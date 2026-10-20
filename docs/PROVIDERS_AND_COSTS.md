# Providers, configuration and costs

**Pricing, free tiers, quotas and data-retention terms change. They were NOT verified while building this (no access to provider sites). Check the official pages below before relying on any of it.**

| Service | Status in this project | Needed config | Official docs to check |
|---|---|---|---|
| NVIDIA API Catalog (hosted `meta/llama-3.2-11b-vision-instruct`) | **Implemented** (original provider) | `VISION_PROVIDER=nvidia`, `NVIDIA_API_KEY` | https://build.nvidia.com , https://docs.api.nvidia.com |
| OpenAI vision models | **Implemented** (OpenAI-compatible adapter), untested against the real API | `VISION_PROVIDER=openai`, `OPENAI_API_KEY`, `OPENAI_MODEL` | https://platform.openai.com/docs |
| Google Gemini vision | Not implemented | - | https://ai.google.dev |
| Anthropic vision | Not implemented | - | https://docs.claude.com |
| Hugging Face / self-hosted | Not implemented | - | https://huggingface.co/docs |
| Open-Meteo weather | **Implemented**, tested against a mock only | `WEATHER_ENABLED`, `WARUD_LAT/LON` | https://open-meteo.com (check terms: non-commercial use and attribution) |
| IMD weather | Not implemented (no verified public API assessed) | - | https://mausam.imd.gov.in |
| Bhashini / Google Translation / IndicTrans2 | Not used. Marathi is stored locally on purpose | - | https://bhashini.gov.in |
| Database, auth, history, PDF, maps, push, price data | Not implemented (not required for the core workflow; "Print / save as PDF" uses the browser) | - | - |

Privacy: the photo is sent to the selected provider only after a per-request consent tick. The server does not store photos; it keeps an in-memory SHA-256 fingerprint + result for `CACHE_TTL_MINUTES`. There is no automatic fallback to a second provider (that would send the photo somewhere the user didn't agree to).

Cost control: client-side shrinking, 8 MB limit, per-IP rate limit, result cache, duplicate-request collapse, quota errors not retried.
