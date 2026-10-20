# AGRIPATH AI - Warud Orange Edition
*Intelligent Orange Disease Detection & Advisory for Warud Farmers* - Nagpur Mandarin (Nagpuri Santra), Warud, Amravati, Maharashtra.

Preliminary AI screening of an orange photo + a bilingual (English/मराठी) citrus disease library with prevention/management guidance and honest references. **Not a laboratory diagnosis; no pesticide names or doses; accuracy not yet validated.**

## Run locally
Requirements: Node 20+, Go 1.22+.
```bash
# 1. backend
cd backend && cp .env.example .env     # add NVIDIA_API_KEY (a NEW key - revoke any key that was ever shared)
go run .                                # http://localhost:8080
# 2. frontend (second terminal)
cd frontend && npm install && npm start # http://localhost:4200  (proxies /api to :8080)
```
Single-server mode: `cd frontend && npm run build`, then set `STATIC_DIR=../frontend/dist/frontend/browser` and `go run .` -> everything at http://localhost:8080.
Without an API key the site still runs; photo analysis reports "AI analysis is not set up".

## Test
`cd backend && go test -race ./...` - `cd frontend && npm test -- --watch=false` - browser E2E: see `tests/e2e/run.sh`. Details: `docs/TEST_REPORT.md`.

## Docs
`docs/ARCHITECTURE.md` (design, file map, how to extend) - `docs/PROVIDERS_AND_COSTS.md` - `docs/RESEARCH_AND_VERIFICATION.md` - `ml/README.md` (evaluation + fine-tuning prep).

## Before public release (needs people, not code)
Revoke the exposed NVIDIA key; expert review of all Marathi text and disease content; verify the research citations; add verified KVK/ICAR contacts (Help page); replace/confirm gallery photo licences and add expert-confirmed disease photos in `frontend/public/gallery/diseases/<id>.jpg`; collect an expert-labelled Warud test set and run `ml/evaluate.py`.

## Credits
UI Design: Samiksha Machale. Frontend Development: Atharv Dhanokar. Backend Development: Girish Gaidhane. Poster Design: Samiksha Machale, P. K. Dhinakaran, Aditi Sharma, Mohit Deshmukh, Tejas Lande, Komal Belsare, Chanchal Thakare. Presented By: Mohit Deshmukh, Atharv Dhanokar, P. K. Dhinakaran, Samiksha Machale, Girish Gaidhane.
