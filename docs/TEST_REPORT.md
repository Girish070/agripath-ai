# Test report (what was actually run)

| Suite | Command | Result |
|---|---|---|
| Go unit + contract tests (race detector) | `cd backend && go test -race ./...` | 17 tests pass: image validation, abstention rules, provider retry/error mapping (mock server), consent/size/type, cache + duplicate collapse, rate limit, CORS, no secrets in /health, weather + stale fallback, feedback validation, backend/frontend taxonomy match |
| Angular unit tests | `cd frontend && npm test -- --watch=false` | 29 pass: i18n (switch, persist, Marathi completeness, placeholders), library completeness EN+MR, no dosage-like text, reference links, API client, image tools, result page (unable / not citrus / disease / language switch) |
| Production build | `cd frontend && npm run build` | succeeds, ~99 kB initial transfer |
| Browser E2E (Chromium) | `tests/e2e/run.sh` | 55/55: no horizontal overflow on 12 routes x 3 viewports x 2 languages, upload flow, consent gating, provider outcomes (disease, unable, hallucinated id, garbage, non-citrus, 429, 5xx), too-dark rejection, cache (0 repeat provider calls), language switch keeping the result, library working with all APIs blocked |

**Not tested:** any real AI provider (E2E used a local mock, so *model accuracy is unknown*); live Open-Meteo; real Android/iOS devices or slow networks; screen readers; Marathi correctness; whether the heuristic blur/dark thresholds suit real orchard photos (they are uncalibrated); the OpenAI adapter against the real API.

Known limitations: results/photos are memory-only (cleared on reload); rate limiter and cache are per-process (not shared across servers); Google Fonts load at runtime (system-font fallback offline); photographs in galleries lack confirmed licence/photographer.
