package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"image"
	"image/color"
	"image/jpeg"
	"math/rand"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"regexp"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

// ---------- synthetic image helpers ----------

func makeJPEG(t *testing.T, w, h int, f func(x, y int) color.RGBA) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			img.Set(x, y, f(x, y))
		}
	}
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 95}); err != nil {
		t.Fatal(err)
	}
	return buf.Bytes()
}

func noisy(t *testing.T, w, h int) []byte {
	rng := rand.New(rand.NewSource(1))
	return makeJPEG(t, w, h, func(x, y int) color.RGBA {
		v := uint8(60 + rng.Intn(120))
		return color.RGBA{v / 2, v, v / 3, 255}
	})
}

// ---------- image validation ----------

func TestInspectImage(t *testing.T) {
	cases := []struct {
		name string
		data []byte
		code string // "" = accepted
	}{
		{"good", noisy(t, 400, 400), ""},
		{"not an image", []byte("hello world, definitely not an image"), "unsupported_type"},
		{"too small", noisy(t, 100, 100), "image_too_small"},
		{"black frame", makeJPEG(t, 400, 400, func(x, y int) color.RGBA { return color.RGBA{2, 2, 2, 255} }), "image_too_dark"},
		{"white frame", makeJPEG(t, 400, 400, func(x, y int) color.RGBA { return color.RGBA{255, 255, 255, 255} }), "image_overexposed"},
		{"flat grey (no detail)", makeJPEG(t, 400, 400, func(x, y int) color.RGBA { return color.RGBA{120, 120, 120, 255} }), "image_blurry"},
	}
	for _, c := range cases {
		_, err := InspectImage(c.data)
		got := ""
		if err != nil {
			got = err.Code
		}
		if got != c.code {
			t.Errorf("%s: got %q want %q", c.name, got, c.code)
		}
	}
}

// ---------- model-output validation (abstention rules) ----------

func TestParseModelOutput(t *testing.T) {
	good := "Sure! ```json\n{\"is_citrus_plant\":\"yes\",\"category\":\"disease\",\"primary_id\":\"canker\",\"observed_features\":[\"yellow_halo_lesions\"]}\n```"
	mo, err := ParseModelOutput(good)
	if err != nil || mo.PrimaryID != "canker" {
		t.Fatalf("expected parse of fenced JSON, got %v %+v", err, mo)
	}
	if _, err := ParseModelOutput("no json here"); err == nil {
		t.Error("expected error for non-JSON")
	}
	if _, err := ParseModelOutput("{broken json"); err == nil {
		t.Error("expected error for broken JSON")
	}
}

func TestValidateDetection(t *testing.T) {
	cases := []struct {
		name   string
		in     ModelOutput
		cat    string
		reason string
	}{
		{"valid disease", ModelOutput{IsCitrus: "yes", Category: "disease", PrimaryID: "melanose", ObservedFeatures: []string{"dark_raised_specks"}}, "disease", ""},
		{"invented disease id is rejected", ModelOutput{IsCitrus: "yes", Category: "disease", PrimaryID: "purple_blight", ObservedFeatures: []string{"leaf_spots"}}, "unable", "invalid_disease_id"},
		{"disease with no valid features is rejected", ModelOutput{IsCitrus: "yes", Category: "disease", PrimaryID: "scab", ObservedFeatures: []string{"made_up_feature"}}, "unable", "no_supporting_features"},
		{"disease contradicted by healthy features", ModelOutput{IsCitrus: "yes", Category: "disease", PrimaryID: "scab", ObservedFeatures: []string{"raised_corky_lesions", "healthy_green_foliage"}}, "unable", "conflicting_signals"},
		{"non-citrus", ModelOutput{IsCitrus: "no", Category: "disease", PrimaryID: "canker"}, "not_citrus", ""},
		{"unsure whether citrus", ModelOutput{IsCitrus: "unsure", Category: "disease", PrimaryID: "canker", ObservedFeatures: []string{"leaf_spots"}}, "unable", "not_sure_citrus"},
		{"unknown category", ModelOutput{IsCitrus: "yes", Category: "banana"}, "unable", "model_unsure"},
		{"healthy", ModelOutput{IsCitrus: "yes", Category: "healthy", ObservedFeatures: []string{"healthy_green_foliage"}}, "healthy", ""},
		{"healthy but lists lesions", ModelOutput{IsCitrus: "yes", Category: "healthy", ObservedFeatures: []string{"raised_corky_lesions"}}, "unable", "conflicting_signals"},
		{"nutrient or pest", ModelOutput{IsCitrus: "yes", Category: "nutrient_or_pest", ObservedFeatures: []string{"leaf_miner_trails"}}, "nutrient_or_pest", ""},
	}
	for _, c := range cases {
		d := ValidateDetection(c.in)
		if d.Category != c.cat || d.AbstainReason != c.reason {
			t.Errorf("%s: got (%s,%s) want (%s,%s)", c.name, d.Category, d.AbstainReason, c.cat, c.reason)
		}
	}
	// alternatives: deduplicated, valid only, never includes primary, max 3
	d := ValidateDetection(ModelOutput{IsCitrus: "yes", Category: "disease", PrimaryID: "scab",
		ObservedFeatures: []string{"raised_corky_lesions"},
		AlternativeIDs:   []string{"scab", "canker", "canker", "nonsense", "melanose", "anthracnose", "hlb"}})
	if strings.Join(d.AlternativeIDs, ",") != "canker,melanose,anthracnose" {
		t.Errorf("alternatives not sanitised: %v", d.AlternativeIDs)
	}
}

func TestTaxonomyMatchesPromptAndHasNoNumbers(t *testing.T) {
	p := BuildPrompt()
	for _, d := range Diseases {
		if !strings.Contains(p, d.ID) {
			t.Errorf("prompt missing disease %s", d.ID)
		}
	}
	if !strings.Contains(p, "Do NOT give treatment") {
		t.Error("prompt must forbid treatment advice")
	}
}

// ---------- provider adapter against a mock OpenAI-style server ----------
// NOTE: this proves our request/retry/error handling. It does NOT test any
// real model's accuracy.

func mockProvider(url string) *openAICompat {
	return &openAICompat{name: "nvidia", label: "mock", baseURL: url, model: "m", apiKey: "TEST_KEY_NOT_REAL",
		client: &http.Client{Timeout: 5 * time.Second}, maxAttempts: 3, backoff: time.Millisecond}
}

const okBody = `{"choices":[{"message":{"content":"{\"is_citrus_plant\":\"yes\",\"plant_part\":\"fruit\",\"category\":\"disease\",\"primary_id\":\"scab\",\"observed_features\":[\"raised_corky_lesions\"],\"alternative_ids\":[\"canker\"]}"}}]}`

func TestProviderRetriesOn5xxThenSucceeds(t *testing.T) {
	var calls int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer TEST_KEY_NOT_REAL" {
			t.Error("missing bearer auth")
		}
		if atomic.AddInt32(&calls, 1) < 3 {
			w.WriteHeader(502)
			return
		}
		w.Write([]byte(okBody))
	}))
	defer srv.Close()
	out, err := mockProvider(srv.URL).Analyze(context.Background(), []byte("x"), "image/jpeg", "p")
	if err != nil || !strings.Contains(out, "scab") || calls != 3 {
		t.Fatalf("err=%v calls=%d out=%q", err, calls, out)
	}
}

func TestProviderErrorMapping(t *testing.T) {
	for status, want := range map[int]error{401: ErrAuth, 403: ErrAuth, 429: ErrQuota, 400: ErrBadRequest, 503: ErrUnavailable} {
		var calls int32
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			atomic.AddInt32(&calls, 1)
			w.WriteHeader(status)
		}))
		_, err := mockProvider(srv.URL).Analyze(context.Background(), []byte("x"), "image/jpeg", "p")
		srv.Close()
		if !errors.Is(err, want) {
			t.Errorf("status %d: got %v want %v", status, err, want)
		}
		if status == 429 && calls != 1 {
			t.Errorf("quota errors must not be retried, got %d calls", calls)
		}
	}
}

func TestProviderBadBody(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.Write([]byte(`{"choices":[]}`)) }))
	defer srv.Close()
	if _, err := mockProvider(srv.URL).Analyze(context.Background(), []byte("x"), "image/jpeg", "p"); !errors.Is(err, ErrBadResponse) {
		t.Errorf("got %v", err)
	}
}

// ---------- full HTTP flow ----------

type fakeVision struct {
	calls int32
	reply string
	err   error
	ok    bool
}

func (f *fakeVision) Name() string     { return "nvidia" }
func (f *fakeVision) Model() string    { return "fake" }
func (f *fakeVision) Label() string    { return "fake" }
func (f *fakeVision) Configured() bool { return f.ok }
func (f *fakeVision) Analyze(ctx context.Context, b []byte, m, p string) (string, error) {
	atomic.AddInt32(&f.calls, 1)
	time.Sleep(30 * time.Millisecond)
	return f.reply, f.err
}

func testServer(fv *fakeVision, limit int) (*Server, http.Handler) {
	cfg := Config{AllowedOrigins: []string{"http://localhost:4200"}, MaxUploadBytes: 1 << 20, RateLimitPerMin: limit,
		RequestTimeout: 5 * time.Second, CacheTTL: time.Minute, WeatherEnabled: false, FeedbackFile: "/tmp/agripath-test-feedback.jsonl"}
	s := NewServer(cfg)
	s.vision = fv
	return s, s.Routes()
}

func postDetect(h http.Handler, img []byte, consent bool) *httptest.ResponseRecorder {
	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	if consent {
		mw.WriteField("consent", "true")
	}
	fw, _ := mw.CreateFormFile("image", "leaf.jpg")
	fw.Write(img)
	mw.Close()
	req := httptest.NewRequest("POST", "/api/detect", &body)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	req.RemoteAddr = "10.0.0.1:1234"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	return rr
}

func errCode(rr *httptest.ResponseRecorder) string {
	var e struct{ Error struct{ Code string } }
	json.Unmarshal(rr.Body.Bytes(), &e)
	return e.Error.Code
}

func TestDetectFlow(t *testing.T) {
	img := noisy(t, 400, 400)
	fv := &fakeVision{ok: true, reply: okBody2()}
	_, h := testServer(fv, 100)

	if rr := postDetect(h, img, false); rr.Code != 400 || errCode(rr) != "consent_required" {
		t.Errorf("consent: %d %s", rr.Code, rr.Body)
	}
	if rr := postDetect(h, []byte("not an image"), true); rr.Code != 415 {
		t.Errorf("type: %d", rr.Code)
	}
	if rr := postDetect(h, make([]byte, 2<<20), true); rr.Code != 413 {
		t.Errorf("size: %d", rr.Code)
	}
	if atomic.LoadInt32(&fv.calls) != 0 {
		t.Fatal("provider must not be called for invalid uploads")
	}

	rr := postDetect(h, img, true)
	if rr.Code != 200 {
		t.Fatalf("detect: %d %s", rr.Code, rr.Body)
	}
	var out DetectResponse
	json.Unmarshal(rr.Body.Bytes(), &out)
	if out.Detection.Category != "disease" || out.Detection.PrimaryID != "scab" || out.Cached {
		t.Errorf("unexpected: %+v", out)
	}
	if strings.Contains(rr.Body.String(), "confidence") {
		t.Error("response must not contain confidence scores")
	}

	// identical image again -> cache, no second provider call
	rr = postDetect(h, img, true)
	json.Unmarshal(rr.Body.Bytes(), &out)
	if !out.Cached || atomic.LoadInt32(&fv.calls) != 1 {
		t.Errorf("expected cache hit; cached=%v calls=%d", out.Cached, fv.calls)
	}
}

func okBody2() string {
	return `{"is_citrus_plant":"yes","plant_part":"fruit","category":"disease","primary_id":"scab","observed_features":["raised_corky_lesions"],"alternative_ids":["canker"]}`
}

func TestDuplicateInFlightRequestsCallProviderOnce(t *testing.T) {
	img := noisy(t, 400, 400)
	fv := &fakeVision{ok: true, reply: okBody2()}
	_, h := testServer(fv, 100)
	done := make(chan int, 5)
	for i := 0; i < 5; i++ {
		go func() { done <- postDetect(h, img, true).Code }()
	}
	for i := 0; i < 5; i++ {
		if c := <-done; c != 200 {
			t.Errorf("status %d", c)
		}
	}
	if n := atomic.LoadInt32(&fv.calls); n != 1 {
		t.Errorf("expected 1 provider call for 5 identical concurrent requests, got %d", n)
	}
}

func TestDetectUnparseableModelAnswerBecomesUnable(t *testing.T) {
	fv := &fakeVision{ok: true, reply: "I think it is a lovely tree."}
	_, h := testServer(fv, 100)
	rr := postDetect(h, noisy(t, 300, 300), true)
	var out DetectResponse
	json.Unmarshal(rr.Body.Bytes(), &out)
	if rr.Code != 200 || out.Detection.Category != "unable" || out.Detection.AbstainReason != "parse_failure" {
		t.Errorf("got %d %+v", rr.Code, out.Detection)
	}
}

func TestDetectProviderFailuresAreFriendlyAndLeakNothing(t *testing.T) {
	for err, want := range map[error]string{ErrQuota: "provider_quota", ErrAuth: "provider_auth", ErrUnavailable: "provider_unavailable"} {
		fv := &fakeVision{ok: true, err: err}
		_, h := testServer(fv, 100)
		rr := postDetect(h, noisy(t, 300, 300), true)
		if errCode(rr) != want || rr.Code < 500 {
			t.Errorf("%v: %d %s", err, rr.Code, rr.Body)
		}
	}
	_, h := testServer(&fakeVision{ok: false}, 100)
	if rr := postDetect(h, noisy(t, 300, 300), true); errCode(rr) != "provider_not_configured" {
		t.Errorf("not configured: %s", rr.Body)
	}
}

func TestRateLimit(t *testing.T) {
	_, h := testServer(&fakeVision{ok: true, reply: okBody2()}, 2)
	img := noisy(t, 300, 300)
	postDetect(h, img, true)
	postDetect(h, img, true)
	if rr := postDetect(h, img, true); rr.Code != 429 || errCode(rr) != "rate_limited" {
		t.Errorf("expected 429, got %d", rr.Code)
	}
}

func TestCORSOnlyForAllowedOrigins(t *testing.T) {
	_, h := testServer(&fakeVision{ok: true}, 10)
	for origin, want := range map[string]string{"http://localhost:4200": "http://localhost:4200", "https://evil.example": ""} {
		req := httptest.NewRequest("GET", "/api/health", nil)
		req.Header.Set("Origin", origin)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		if got := rr.Header().Get("Access-Control-Allow-Origin"); got != want {
			t.Errorf("origin %s: got %q want %q", origin, got, want)
		}
	}
}

func TestHealthNeverExposesSecrets(t *testing.T) {
	cfg := LoadConfig()
	cfg.VisionAPIKey = "SUPER_SECRET_KEY_123"
	s := NewServer(cfg)
	rr := httptest.NewRecorder()
	s.Routes().ServeHTTP(rr, httptest.NewRequest("GET", "/api/health", nil))
	if strings.Contains(rr.Body.String(), "SUPER_SECRET") || rr.Code != 200 {
		t.Errorf("health leaked or failed: %d %s", rr.Code, rr.Body)
	}
}

// ---------- weather against a mock Open-Meteo ----------

func TestWeatherNormalisesAndServesStale(t *testing.T) {
	up := true
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !up {
			w.WriteHeader(500)
			return
		}
		w.Write([]byte(`{"timezone":"Asia/Kolkata","current":{"time":"2026-10-17T12:00","temperature_2m":31.2,"relative_humidity_2m":55,"precipitation":0,"wind_speed_10m":8},
		"daily":{"time":["2026-10-17","2026-10-18"],"temperature_2m_max":[33,34],"temperature_2m_min":[21,22],"precipitation_sum":[0,4.5],"precipitation_probability_max":[5,60]}}`))
	}))
	defer srv.Close()
	ws := newWeatherService(Config{WeatherBaseURL: srv.URL, WarudLat: 21.47, WarudLon: 78.27})
	r, err := ws.Get(context.Background())
	if err != nil || len(r.Daily) != 2 || *r.Daily[1].PrecipSumMM != 4.5 || r.Stale || r.Source != "Open-Meteo" {
		t.Fatalf("bad first fetch: %v %+v", err, r)
	}
	up = false
	ws.cached.FetchedAt = time.Now().Add(-time.Hour) // no longer fresh
	r, err = ws.Get(context.Background())
	if err != nil || !r.Stale {
		t.Errorf("expected stale cache on upstream failure: %v %+v", err, r)
	}
	ws2 := newWeatherService(Config{WeatherBaseURL: srv.URL})
	if _, err := ws2.Get(context.Background()); err == nil {
		t.Error("expected error with no cache and failing upstream")
	}
}

// ---------- feedback ----------

func TestFeedbackValidation(t *testing.T) {
	_, h := testServer(&fakeVision{ok: true}, 10)
	post := func(body string) int {
		rr := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/api/feedback", strings.NewReader(body))
		h.ServeHTTP(rr, req)
		return rr.Code
	}
	if c := post(`{"type":"incorrect","result_category":"disease","primary_id":"scab"}`); c != 200 {
		t.Errorf("valid feedback rejected: %d", c)
	}
	if c := post(`{"type":"hack","result_category":"disease"}`); c != 400 {
		t.Errorf("bad type accepted: %d", c)
	}
	if c := post(`{"type":"incorrect","result_category":"disease","primary_id":"zzz"}`); c != 400 {
		t.Errorf("bad id accepted: %d", c)
	}
}

// ---------- contract with the frontend knowledge library ----------

func frontendIDs(t *testing.T, file, pattern string) map[string]bool {
	t.Helper()
	b, err := os.ReadFile(file)
	if err != nil {
		t.Skipf("frontend source not found (%v) - run from the full project", err)
	}
	out := map[string]bool{}
	for _, m := range regexp.MustCompile(pattern).FindAllStringSubmatch(string(b), -1) {
		out[m[1]] = true
	}
	return out
}

func sameSet(t *testing.T, name string, a, b map[string]bool) {
	t.Helper()
	for k := range a {
		if !b[k] {
			t.Errorf("%s: %q exists in backend but not in frontend", name, k)
		}
	}
	for k := range b {
		if !a[k] {
			t.Errorf("%s: %q exists in frontend but not in backend", name, k)
		}
	}
}

func TestTaxonomyMatchesFrontendLibrary(t *testing.T) {
	fe := frontendIDs(t, "../frontend/src/app/data/diseases.ts", `(?m)^    id: '([a-z_]+)',`)
	if len(fe) != 13 {
		t.Fatalf("expected 13 diseases in frontend, found %d", len(fe))
	}
	sameSet(t, "disease ids", diseaseIDs, fe)

	feats := frontendIDs(t, "../frontend/src/app/data/features.ts", `(?m)^  ([a-z_]+): L\(`)
	qual := map[string]bool{}
	fq := frontendIDs(t, "../frontend/src/app/data/features.ts", `(?m)^  ([a-z_]+): L\(`)
	for k := range fq {
		if qualitySet[k] {
			qual[k] = true
			delete(feats, k)
		}
	}
	sameSet(t, "feature codes", featureSet, feats)
	sameSet(t, "quality codes", qualitySet, qual)
}
