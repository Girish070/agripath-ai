package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

var (
	ErrNotConfigured = errors.New("vision provider not configured")
	ErrAuth          = errors.New("provider rejected credentials")
	ErrQuota         = errors.New("provider quota or rate limit reached")
	ErrBadRequest    = errors.New("provider rejected the request")
	ErrUnavailable   = errors.New("provider unavailable")
	ErrBadResponse   = errors.New("provider returned an unusable response")
)

type VisionProvider interface {
	Name() string
	Model() string
	Label() string
	Configured() bool
	Analyze(ctx context.Context, image []byte, mime, prompt string) (string, error)
}

type openAICompat struct {
	name, label, baseURL, model, apiKey string
	client                              *http.Client
	maxAttempts                         int
	backoff                             time.Duration
}

func NewVisionProvider(c Config) VisionProvider {
	if c.VisionProvider == "none" {
		return noProvider{}
	}
	return &openAICompat{
		name: c.VisionProvider, label: c.VisionLabel, baseURL: strings.TrimRight(c.VisionBaseURL, "/"),
		model: c.VisionModel, apiKey: c.VisionAPIKey,
		client:      &http.Client{Timeout: c.RequestTimeout},
		maxAttempts: 3, backoff: 600 * time.Millisecond,
	}
}

func (p *openAICompat) Name() string  { return p.name }
func (p *openAICompat) Model() string { return p.model }
func (p *openAICompat) Label() string { return p.label }
func (p *openAICompat) Configured() bool {
	return p.apiKey != "" && p.model != "" && p.baseURL != ""
}

type chatRequest struct {
	Model       string        `json:"model"`
	Messages    []chatMessage `json:"messages"`
	MaxTokens   int           `json:"max_tokens"`
	Temperature float32       `json:"temperature"`
}
type chatMessage struct {
	Role    string        `json:"role"`
	Content []chatContent `json:"content"`
}
type chatContent struct {
	Type     string    `json:"type"`
	Text     string    `json:"text,omitempty"`
	ImageURL *imageURL `json:"image_url,omitempty"`
}
type imageURL struct {
	URL string `json:"url"`
}
type chatResponse struct {
	Choices []struct {
		Message struct {
			Content          string `json:"content"`
			ReasoningContent string `json:"reasoning_content"`
		} `json:"message"`
	} `json:"choices"`
}

func (p *openAICompat) Analyze(ctx context.Context, img []byte, mime, prompt string) (string, error) {
	if !p.Configured() {
		return "", ErrNotConfigured
	}
	dataURI := "data:" + mime + ";base64," + base64.StdEncoding.EncodeToString(img)
	body, err := json.Marshal(chatRequest{
		Model: p.model, MaxTokens: 1500, Temperature: 0.1,
		Messages: []chatMessage{{Role: "user", Content: []chatContent{
			{Type: "text", Text: prompt},
			{Type: "image_url", ImageURL: &imageURL{URL: dataURI}},
		}}},
	})
	if err != nil {
		return "", err
	}

	var lastErr error
	for attempt := 0; attempt < p.maxAttempts; attempt++ {
		if attempt > 0 {
			select {
			case <-time.After(p.backoff << (attempt - 1)):
			case <-ctx.Done():
				return "", ErrUnavailable
			}
		}
		text, retry, err := p.once(ctx, body)
		if err == nil {
			return text, nil
		}
		lastErr = err
		if !retry {
			return "", err
		}
	}
	return "", lastErr
}

func (p *openAICompat) once(ctx context.Context, body []byte) (text string, retry bool, err error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", false, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.apiKey)

	resp, err := p.client.Do(req)
	if err != nil {
		log.Printf("[vision error] network/timeout for model %s: %v", p.model, err)
		return "", true, ErrUnavailable
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))

	if resp.StatusCode >= 400 {
		log.Printf("[vision error] model=%s status=%d body=%s", p.model, resp.StatusCode, string(raw))
	}

	switch {
	case resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden:
		return "", false, ErrAuth
	case resp.StatusCode == http.StatusTooManyRequests:
		return "", false, ErrQuota
	case resp.StatusCode >= 500:
		return "", true, ErrUnavailable
	case resp.StatusCode >= 400:
		return "", false, ErrBadRequest
	}
	var cr chatResponse
	if err := json.Unmarshal(raw, &cr); err != nil || len(cr.Choices) == 0 {
		log.Printf("[vision parse error] model=%s raw=%s", p.model, string(raw))
		return "", false, ErrBadResponse
	}
	out := strings.TrimSpace(cr.Choices[0].Message.Content)
	if out == "" {
		out = strings.TrimSpace(cr.Choices[0].Message.ReasoningContent)
	}
	if out == "" {
		log.Printf("[vision empty content] model=%s raw=%s", p.model, string(raw))
		return "", false, ErrBadResponse
	}
	return out, false, nil
}

type noProvider struct{}

func (noProvider) Name() string     { return "none" }
func (noProvider) Model() string    { return "" }
func (noProvider) Label() string    { return "none" }
func (noProvider) Configured() bool { return false }
func (noProvider) Analyze(context.Context, []byte, string, string) (string, error) {
	return "", fmt.Errorf("%w", ErrNotConfigured)
}