package main

import (
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds every setting the server needs. All values come from
// environment variables (optionally loaded from backend/.env in development),
// so no secret or provider choice is ever hard-coded or sent to the browser.
type Config struct {
	Port           string
	AllowedOrigins []string
	TrustProxy     bool // only true when running behind a reverse proxy you control
	StaticDir      string

	// Vision (image analysis) provider
	VisionProvider string // "nvidia" | "openai" | "none"
	VisionBaseURL  string
	VisionModel    string
	VisionAPIKey   string
	VisionLabel    string // human-readable provider name shown in the UI consent text

	MaxUploadBytes  int64
	RateLimitPerMin int
	RequestTimeout  time.Duration
	CacheTTL        time.Duration

	// Weather (optional)
	WeatherEnabled bool
	WeatherBaseURL string
	WarudLat       float64
	WarudLon       float64

	// Feedback (optional, stores only enumerated choices - never images)
	FeedbackFile string
}

func getenv(key, def string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return def
}

func getenvInt(key string, def int) int {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return n
		}
	}
	return def
}

func getenvBool(key string, def bool) bool {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		b, err := strconv.ParseBool(v)
		if err == nil {
			return b
		}
	}
	return def
}

func getenvFloat(key string, def float64) float64 {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	}
	return def
}

// LoadConfig reads the environment. A missing API key is NOT fatal: the
// server still starts so the disease library, seasons and help pages keep
// working, and /api/detect answers with a clear "provider not configured"
// error instead of crashing.
func LoadConfig() Config {
	c := Config{
		Port:            getenv("PORT", "8080"),
		AllowedOrigins:  splitCSV(getenv("ALLOWED_ORIGINS", "http://localhost:4200")),
		TrustProxy:      getenvBool("TRUST_PROXY", false),
		StaticDir:       getenv("STATIC_DIR", ""),
		VisionProvider:  strings.ToLower(getenv("VISION_PROVIDER", "nvidia")),
		MaxUploadBytes:  int64(getenvInt("MAX_UPLOAD_MB", 8)) << 20,
		RateLimitPerMin: getenvInt("RATE_LIMIT_PER_MIN", 10),
		RequestTimeout:  time.Duration(getenvInt("PROVIDER_TIMEOUT_SECONDS", 60)) * time.Second,
		CacheTTL:        time.Duration(getenvInt("CACHE_TTL_MINUTES", 15)) * time.Minute,
		WeatherEnabled:  getenvBool("WEATHER_ENABLED", true),
		WeatherBaseURL:  getenv("WEATHER_BASE_URL", "https://api.open-meteo.com"),
		// Approximate centre of Warud town, Amravati district. Regional weather
		// only - it is not a measurement taken inside any individual orchard.
		WarudLat:     getenvFloat("WARUD_LAT", 21.47),
		WarudLon:     getenvFloat("WARUD_LON", 78.27),
		FeedbackFile: getenv("FEEDBACK_FILE", "./data/feedback.jsonl"),
	}

	switch c.VisionProvider {
	case "nvidia":
		c.VisionBaseURL = getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
		c.VisionModel = getenv("NVIDIA_MODEL", "meta/llama-3.2-11b-vision-instruct")
		c.VisionAPIKey = getenv("NVIDIA_API_KEY", "")
		c.VisionLabel = "NVIDIA API Catalog (hosted Llama 3.2 Vision)"
	case "openai":
		c.VisionBaseURL = getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
		// No default model: pick a vision-capable one from OpenAI's current docs.
		c.VisionModel = getenv("OPENAI_MODEL", "")
		c.VisionAPIKey = getenv("OPENAI_API_KEY", "")
		c.VisionLabel = "OpenAI API"
	default:
		c.VisionProvider = "none"
		c.VisionLabel = "none"
	}
	return c
}

func splitCSV(s string) []string {
	var out []string
	for _, p := range strings.Split(s, ",") {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
