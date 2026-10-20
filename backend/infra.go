package main

import (
	"sync"
	"time"
)

// ---- Rate limiter: sliding window per client key (in memory) ----

type rateLimiter struct {
	mu     sync.Mutex
	limit  int
	window time.Duration
	hits   map[string][]time.Time
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	return &rateLimiter{limit: limit, window: window, hits: map[string][]time.Time{}}
}

func (r *rateLimiter) Allow(key string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now()
	cut := now.Add(-r.window)
	kept := r.hits[key][:0]
	for _, t := range r.hits[key] {
		if t.After(cut) {
			kept = append(kept, t)
		}
	}
	if len(kept) >= r.limit {
		r.hits[key] = kept
		return false
	}
	r.hits[key] = append(kept, now)
	if len(r.hits) > 5000 { // cheap guard against unbounded growth
		for k, v := range r.hits {
			if len(v) == 0 || v[len(v)-1].Before(cut) {
				delete(r.hits, k)
			}
		}
	}
	return true
}

// ---- Result cache + duplicate-request collapsing ----
//
// Privacy: entries live only in memory, are keyed by a SHA-256 hash of the
// image (the image itself is never stored), and expire after CacheTTL.
// Purpose: a farmer double-tapping "Analyse" must not trigger two paid
// vision-API calls.

type cacheItem struct {
	resp    DetectResponse
	expires time.Time
}

type flight struct {
	done chan struct{}
	resp DetectResponse
	err  error
}

type resultCache struct {
	mu      sync.Mutex
	ttl     time.Duration
	max     int
	items   map[string]cacheItem
	flights map[string]*flight
}

func newResultCache(ttl time.Duration, max int) *resultCache {
	return &resultCache{ttl: ttl, max: max, items: map[string]cacheItem{}, flights: map[string]*flight{}}
}

// Do returns a cached answer, joins an identical in-flight request, or runs
// fn. Errors are never cached.
func (c *resultCache) Do(key string, fn func() (DetectResponse, error)) (DetectResponse, bool, error) {
	c.mu.Lock()
	if it, ok := c.items[key]; ok && time.Now().Before(it.expires) {
		c.mu.Unlock()
		return it.resp, true, nil
	}
	if f, ok := c.flights[key]; ok {
		c.mu.Unlock()
		<-f.done
		return f.resp, true, f.err
	}
	f := &flight{done: make(chan struct{})}
	c.flights[key] = f
	c.mu.Unlock()

	f.resp, f.err = fn()

	c.mu.Lock()
	delete(c.flights, key)
	if f.err == nil {
		if len(c.items) >= c.max {
			now := time.Now()
			for k, v := range c.items {
				if now.After(v.expires) {
					delete(c.items, k)
				}
			}
			if len(c.items) >= c.max { // still full: drop everything (simple and safe)
				c.items = map[string]cacheItem{}
			}
		}
		c.items[key] = cacheItem{resp: f.resp, expires: time.Now().Add(c.ttl)}
	}
	c.mu.Unlock()
	close(f.done)
	return f.resp, false, f.err
}
