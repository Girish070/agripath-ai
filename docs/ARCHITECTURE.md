# Architecture (explainable in a viva)

```
Browser (Angular)                         Go server                          External
------------------                        ----------                         --------
pick photo -> validate type/size
shrink to <=1280px + re-encode (strips GPS/EXIF)
consent checkbox ------------------------> POST /api/detect
                                           rate limit -> consent -> size/type
                                           decode, size, dark/bright/blur checks
                                           SHA-256 cache / duplicate collapse
                                           build prompt (closed lists) ----------> vision model (NVIDIA / OpenAI-style)
                                           parse JSON <---------------------------
                                           validate: unknown id / no features /
                                           contradiction => "unable"
result (codes only) <---------------------
look up advisory in local disease library (English + Marathi)
```
**Key design decision:** the AI only reports *visible feature codes* and *one disease id from a fixed list*. All advice shown to the farmer comes from the reviewed library in `frontend/src/app/data/diseases.ts`, never from AI free text. Consequences: Marathi never depends on live translation; no model can invent a pesticide or dose; the disease library works with every API down.

| Area | Files |
|---|---|
| Backend entry, routes, middleware | `backend/main.go` |
| Provider interface + OpenAI-compatible adapter (retry/backoff, error mapping) | `backend/vision.go` |
| Closed taxonomy + prompt | `backend/taxonomy.go` (IDs must match `diseases.ts`; a Go test enforces this) |
| Answer validation / abstention | `backend/result.go` |
| Image validation + quality heuristics | `backend/validate.go` |
| Rate limiter, cache, duplicate collapse | `backend/infra.go` |
| Weather (Open-Meteo, 30-min cache, stale fallback) | `backend/weather.go` |
| Knowledge library (13 diseases, references, bahar, features) | `frontend/src/app/data/` |
| Localisation (typed: missing Marathi key = compile error) | `frontend/src/app/core/ui-strings.*.ts`, `i18n.service.ts` |
| Pages / advisory component | `frontend/src/app/pages/`, `shared/advisory.ts` |

**Original files replaced:** `scanner.component.ts` (914-line single component), `detection.service.ts`. **Preserved:** Angular + Go + godotenv + NVIDIA `meta/llama-3.2-11b-vision-instruct` architecture and `NVIDIA_API_KEY` name.

**Adding a provider:** implement `VisionProvider` in `vision.go`, add a `case` in `config.go`, set `VISION_PROVIDER`. **Adding a disease:** add it to `taxonomy.go` and `diseases.ts` (tests fail until both agree and both languages are filled).

**Conflicts between presentation and source:** presentation says "Orange canker/scab/greening" (find-and-replace of "Citrus"); implemented as Citrus canker/scab/greening. Presentation's three groups overlap (HLB and tristeza in two); implemented as one profile each with a single management class. Presentation lists "current prototype = upload + hosted model"; matches the original source.
