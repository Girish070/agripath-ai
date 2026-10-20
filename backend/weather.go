package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

// WeatherResponse is the normalised payload for the frontend. It is regional
// forecast data for the Warud area - NOT a measurement inside any orchard and
// NOT evidence that any disease is present.
type WeatherResponse struct {
	Source      string         `json:"source"`
	SourceURL   string         `json:"source_url"`
	Latitude    float64        `json:"latitude"`
	Longitude   float64        `json:"longitude"`
	FetchedAt   time.Time      `json:"fetched_at"`
	Stale       bool           `json:"stale"`
	Timezone    string         `json:"timezone"`
	Current     map[string]any `json:"current"`
	Daily       []DailyWeather `json:"daily"`
	Limitations string         `json:"limitations"`
}

type DailyWeather struct {
	Date          string   `json:"date"`
	TempMax       *float64 `json:"temp_max_c"`
	TempMin       *float64 `json:"temp_min_c"`
	PrecipSumMM   *float64 `json:"precipitation_mm"`
	PrecipProbMax *float64 `json:"precipitation_probability_max_pct"`
}

type weatherService struct {
	cfg    Config
	client *http.Client
	mu     sync.Mutex
	cached *WeatherResponse
}

func newWeatherService(cfg Config) *weatherService {
	return &weatherService{cfg: cfg, client: &http.Client{Timeout: 10 * time.Second}}
}

const (
	weatherFresh = 30 * time.Minute
	weatherStale = 6 * time.Hour
)

func (w *weatherService) Get(ctx context.Context) (*WeatherResponse, error) {
	w.mu.Lock()
	c := w.cached
	w.mu.Unlock()
	if c != nil && time.Since(c.FetchedAt) < weatherFresh {
		return c, nil
	}
	fresh, err := w.fetch(ctx)
	if err != nil {
		if c != nil && time.Since(c.FetchedAt) < weatherStale {
			cp := *c
			cp.Stale = true
			return &cp, nil
		}
		return nil, err
	}
	w.mu.Lock()
	w.cached = fresh
	w.mu.Unlock()
	return fresh, nil
}

type openMeteoRaw struct {
	Timezone string `json:"timezone"`
	Current  struct {
		Time        string   `json:"time"`
		Temperature *float64 `json:"temperature_2m"`
		Humidity    *float64 `json:"relative_humidity_2m"`
		Precip      *float64 `json:"precipitation"`
		Wind        *float64 `json:"wind_speed_10m"`
	} `json:"current"`
	Daily struct {
		Time     []string   `json:"time"`
		TMax     []*float64 `json:"temperature_2m_max"`
		TMin     []*float64 `json:"temperature_2m_min"`
		Precip   []*float64 `json:"precipitation_sum"`
		PrecipPr []*float64 `json:"precipitation_probability_max"`
	} `json:"daily"`
}

func at(s []*float64, i int) *float64 {
	if i < len(s) {
		return s[i]
	}
	return nil
}

func (w *weatherService) fetch(ctx context.Context) (*WeatherResponse, error) {
	url := fmt.Sprintf("%s/v1/forecast?latitude=%.4f&longitude=%.4f"+
		"&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"+
		"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max"+
		"&timezone=Asia%%2FKolkata&forecast_days=5", w.cfg.WeatherBaseURL, w.cfg.WarudLat, w.cfg.WarudLon)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := w.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("weather upstream unreachable")
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("weather upstream status %d", resp.StatusCode)
	}
	var raw openMeteoRaw
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&raw); err != nil {
		return nil, fmt.Errorf("weather upstream bad payload")
	}
	if len(raw.Daily.Time) == 0 {
		return nil, fmt.Errorf("weather upstream returned no data")
	}
	out := &WeatherResponse{
		Source: "Open-Meteo", SourceURL: "https://open-meteo.com/",
		Latitude: w.cfg.WarudLat, Longitude: w.cfg.WarudLon,
		FetchedAt: time.Now().UTC(), Timezone: raw.Timezone,
		Current: map[string]any{
			"time": raw.Current.Time, "temperature_c": raw.Current.Temperature,
			"relative_humidity_pct": raw.Current.Humidity, "precipitation_mm": raw.Current.Precip,
			"wind_speed_kmh": raw.Current.Wind,
		},
		Limitations: "Model-based regional forecast for approximate Warud coordinates; not measured inside any orchard and not proof of any disease.",
	}
	for i, d := range raw.Daily.Time {
		out.Daily = append(out.Daily, DailyWeather{
			Date: d, TempMax: at(raw.Daily.TMax, i), TempMin: at(raw.Daily.TMin, i),
			PrecipSumMM: at(raw.Daily.Precip, i), PrecipProbMax: at(raw.Daily.PrecipPr, i),
		})
	}
	return out, nil
}
