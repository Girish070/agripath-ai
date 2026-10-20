// AGRIPATH AI backend.
//
// Responsibilities (kept deliberately small so it can be explained in a viva):
//
//	POST /api/detect   validate image -> call vision provider -> validate answer
//	GET  /api/weather  regional Open-Meteo forecast for Warud (optional)
//	POST /api/feedback store an enumerated feedback choice (never images)
//	GET  /api/health   integration status, with no secrets
//
// Disease knowledge and treatment advice live in the frontend library, not in
// model output, so the library works even when every external API is down.
package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type DetectResponse struct {
	RequestID     string       `json:"request_id"`
	Detection     Detection    `json:"detection"`
	Provider      ProviderInfo `json:"provider"`
	Cached        bool         `json:"cached"`
	PromptVersion string       `json:"prompt_version"`
	GeneratedAt   time.Time    `json:"generated_at"`
}

type ProviderInfo struct {
	Name  string `json:"name"`
	Model string `json:"model"`
	Label string `json:"label"`
}

type Server struct {
	cfg     Config
	vision  VisionProvider
	limiter *rateLimiter
	cache   *resultCache
	weather *weatherService
	fbMu    chanMutex
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("notice: no .env file found; using process environment")
	}
	cfg := LoadConfig()
	s := NewServer(cfg)
	if !s.vision.Configured() {
		log.Printf("WARNING: vision provider %q is not fully configured (API key/model missing). "+
			"The site and disease library will work, but /api/detect will return provider_not_configured.", cfg.VisionProvider)
	}
	srv := &http.Server{
		Addr: ":" + cfg.Port, Handler: s.Routes(),
		ReadHeaderTimeout: 10 * time.Second, ReadTimeout: 30 * time.Second,
		WriteTimeout: cfg.RequestTimeout + 30*time.Second, IdleTimeout: 60 * time.Second,
	}
	log.Printf("AGRIPATH AI listening on :%s (vision=%s model=%s weather=%v)", cfg.Port, cfg.VisionProvider, s.vision.Model(), cfg.WeatherEnabled)
	log.Fatal(srv.ListenAndServe())
}

func NewServer(cfg Config) *Server {
	return &Server{
		cfg: cfg, vision: NewVisionProvider(cfg),
		limiter: newRateLimiter(cfg.RateLimitPerMin, time.Minute),
		cache:   newResultCache(cfg.CacheTTL, 200),
		weather: newWeatherService(cfg),
		fbMu:    make(chanMutex, 1),
	}
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", s.handleHealth)
	mux.HandleFunc("POST /api/detect", s.handleDetect)
	mux.HandleFunc("GET /api/weather", s.handleWeather)
	mux.HandleFunc("POST /api/feedback", s.handleFeedback)
	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotFound, "not_found", "Unknown API route.")
	})
	if s.cfg.StaticDir != "" {
		mux.Handle("/", spaHandler(s.cfg.StaticDir))
	}
	return s.recoverer(s.logging(s.securityHeaders(s.cors(mux))))
}

// ---------- helpers ----------

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, code, msg string) {
	writeJSON(w, status, map[string]any{"error": map[string]string{"code": code, "message": msg}})
}

func (s *Server) clientKey(r *http.Request) string {
	if s.cfg.TrustProxy {
		if xf := r.Header.Get("X-Forwarded-For"); xf != "" {
			return strings.TrimSpace(strings.Split(xf, ",")[0])
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// ---------- middleware ----------

func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			for _, o := range s.cfg.AllowedOrigins {
				if o == origin {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Set("Vary", "Origin")
					w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
					w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
				}
			}
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("Referrer-Policy", "no-referrer")
		h.Set("X-Frame-Options", "DENY")
		if strings.HasPrefix(r.URL.Path, "/api/") {
			h.Set("Cache-Control", "no-store")
		}
		next.ServeHTTP(w, r)
	})
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(c int) { w.status = c; w.ResponseWriter.WriteHeader(c) }

// logging records method, path, status and duration ONLY - never bodies,
// images, headers or keys.
func (s *Server) logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, status: 200}
		next.ServeHTTP(sw, r)
		if strings.HasPrefix(r.URL.Path, "/api/") {
			log.Printf("%s %s -> %d (%s)", r.Method, r.URL.Path, sw.status, time.Since(start).Round(time.Millisecond))
		}
	})
}

func (s *Server) recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("panic recovered on %s %s", r.Method, r.URL.Path) // no stack/body to logs or client
				writeError(w, http.StatusInternalServerError, "internal_error", "Something went wrong on the server.")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// ---------- handlers ----------

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status": "ok",
		"vision": map[string]any{
			"provider": s.vision.Name(), "model": s.vision.Model(),
			"label": s.vision.Label(), "configured": s.vision.Configured(),
		},
		"weather":        map[string]any{"enabled": s.cfg.WeatherEnabled, "provider": "open_meteo"},
		"limits":         map[string]any{"max_upload_mb": s.cfg.MaxUploadBytes >> 20, "rate_limit_per_min": s.cfg.RateLimitPerMin},
		"prompt_version": PromptVersion,
	})
}

func (s *Server) handleDetect(w http.ResponseWriter, r *http.Request) {
	if !s.limiter.Allow(s.clientKey(r)) {
		w.Header().Set("Retry-After", "60")
		writeError(w, http.StatusTooManyRequests, "rate_limited", "Too many requests. Please wait a minute and try again.")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, s.cfg.MaxUploadBytes+(1<<20))
	if err := r.ParseMultipartForm(1 << 20); err != nil {
		var mbe *http.MaxBytesError
		if errors.As(err, &mbe) {
			writeError(w, http.StatusRequestEntityTooLarge, "file_too_large", "The image is too large.")
			return
		}
		writeError(w, http.StatusBadRequest, "bad_form", "Could not read the upload.")
		return
	}
	// Explicit, per-request authorisation to send the photo to a third party.
	if r.FormValue("consent") != "true" {
		writeError(w, http.StatusBadRequest, "consent_required", "Please agree to send the photo for analysis.")
		return
	}
	file, _, err := r.FormFile("image")
	if err != nil {
		writeError(w, http.StatusBadRequest, "image_missing", "No image was received.")
		return
	}
	defer file.Close()
	data, err := io.ReadAll(io.LimitReader(file, s.cfg.MaxUploadBytes+1))
	if err != nil {
		writeError(w, http.StatusBadRequest, "bad_form", "Could not read the image.")
		return
	}
	if int64(len(data)) > s.cfg.MaxUploadBytes {
		writeError(w, http.StatusRequestEntityTooLarge, "file_too_large", "The image is too large.")
		return
	}

	report, ierr := InspectImage(data)
	if ierr != nil {
		writeError(w, ierr.Status, ierr.Code, ierr.Message)
		return
	}
	if !s.vision.Configured() {
		writeError(w, http.StatusServiceUnavailable, "provider_not_configured", "The AI service is not set up on this server.")
		return
	}

	sum := sha256.Sum256(data)
	key := hex.EncodeToString(sum[:]) + "|" + s.vision.Name() + "|" + s.vision.Model() + "|" + PromptVersion

	resp, cached, err := s.cache.Do(key, func() (DetectResponse, error) {
		// Detached from the client's request so a closed browser tab does not
		// cancel a call that other identical requests may be waiting on.
		ctx, cancel := context.WithTimeout(context.Background(), s.cfg.RequestTimeout)
		defer cancel()
		raw, err := s.vision.Analyze(ctx, data, report.Mime, BuildPrompt())
		if err != nil {
			return DetectResponse{}, err
		}
		var det Detection
		if mo, perr := ParseModelOutput(raw); perr != nil {
			det = unable("parse_failure", ModelOutput{})
		} else {
			det = ValidateDetection(mo)
		}
		return DetectResponse{
			RequestID:     newRequestID(),
			Detection:     det,
			Provider:      ProviderInfo{Name: s.vision.Name(), Model: s.vision.Model(), Label: s.vision.Label()},
			PromptVersion: PromptVersion, GeneratedAt: time.Now().UTC(),
		}, nil
	})
	if err != nil {
		s.writeProviderError(w, err)
		return
	}
	// Merge server-measured quality concerns (real measurements) with the model's.
	merged := map[string]bool{}
	for _, c := range resp.Detection.QualityConcerns {
		merged[c] = true
	}
	for _, c := range report.Concerns {
		merged[c] = true
	}
	resp.Detection.QualityConcerns = []string{}
	for _, c := range QualityCodes {
		if merged[c] {
			resp.Detection.QualityConcerns = append(resp.Detection.QualityConcerns, c)
		}
	}
	resp.Cached = cached
	writeJSON(w, http.StatusOK, resp)
}

func (s *Server) writeProviderError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrQuota):
		writeError(w, http.StatusServiceUnavailable, "provider_quota", "The AI service has reached its usage limit. Please try later.")
	case errors.Is(err, ErrAuth):
		log.Println("provider credentials were rejected - check the server API key")
		writeError(w, http.StatusServiceUnavailable, "provider_auth", "The AI service is not set up correctly on this server.")
	case errors.Is(err, ErrNotConfigured):
		writeError(w, http.StatusServiceUnavailable, "provider_not_configured", "The AI service is not set up on this server.")
	case errors.Is(err, ErrBadRequest):
		writeError(w, http.StatusBadGateway, "provider_rejected", "The AI service could not process this image.")
	case errors.Is(err, ErrBadResponse):
		writeError(w, http.StatusBadGateway, "provider_bad_response", "The AI service returned an unusable answer.")
	default:
		writeError(w, http.StatusBadGateway, "provider_unavailable", "The AI service is temporarily unavailable.")
	}
}

func (s *Server) handleWeather(w http.ResponseWriter, r *http.Request) {
	if !s.cfg.WeatherEnabled {
		writeError(w, http.StatusServiceUnavailable, "weather_disabled", "Weather is turned off on this server.")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()
	res, err := s.weather.Get(ctx)
	if err != nil {
		writeError(w, http.StatusBadGateway, "weather_unavailable", "Weather data is unavailable right now.")
		return
	}
	writeJSON(w, http.StatusOK, res)
}

// Feedback stores ONLY enumerated choices - no image, no free text, no IP.
type feedbackIn struct {
	Type           string `json:"type"`
	ResultCategory string `json:"result_category"`
	PrimaryID      string `json:"primary_id"`
}

var feedbackTypes = setOf([]string{"looks_correct", "incorrect", "uncertain", "unhelpful_advice", "missing_disease"})

type chanMutex chan struct{}

func (m chanMutex) Lock()   { m <- struct{}{} }
func (m chanMutex) Unlock() { <-m }

func (s *Server) handleFeedback(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 4<<10)
	var in feedbackIn
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil || !feedbackTypes[in.Type] ||
		!categorySet[in.ResultCategory] || (in.PrimaryID != "" && !diseaseIDs[in.PrimaryID]) {
		writeError(w, http.StatusBadRequest, "bad_feedback", "Invalid feedback.")
		return
	}
	rec := map[string]string{"ts": time.Now().UTC().Format(time.RFC3339), "type": in.Type,
		"result_category": in.ResultCategory, "primary_id": in.PrimaryID}
	line, _ := json.Marshal(rec)
	s.fbMu.Lock()
	defer s.fbMu.Unlock()
	if err := os.MkdirAll(filepath.Dir(s.cfg.FeedbackFile), 0o750); err == nil {
		if f, err := os.OpenFile(s.cfg.FeedbackFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o640); err == nil {
			_, _ = f.Write(append(line, '\n'))
			_ = f.Close()
		}
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "recorded"})
}

// spaHandler serves the built Angular app and falls back to index.html so
// deep links such as /diseases/hlb work after a browser refresh.
func spaHandler(dir string) http.Handler {
	fs := http.FileServer(http.Dir(dir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p := filepath.Join(dir, filepath.Clean("/"+r.URL.Path))
		if st, err := os.Stat(p); err == nil && !st.IsDir() {
			fs.ServeHTTP(w, r)
			return
		}
		http.ServeFile(w, r, filepath.Join(dir, "index.html"))
	})
}

func newRequestID() string {
	b := make([]byte, 6)
	t := time.Now().UnixNano()
	for i := range b {
		b[i] = byte(t >> (8 * i))
	}
	sum := sha256.Sum256(append(b, []byte(time.Now().String())...))
	return hex.EncodeToString(sum[:5])
}
