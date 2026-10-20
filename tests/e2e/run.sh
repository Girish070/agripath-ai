#!/bin/bash
# Browser end-to-end test with a MOCK AI + weather API (no real key needed). Run from the project root:
#   (cd frontend && npm run build) && (cd backend && go build -o /tmp/agripath-server .) && pip install playwright pillow && playwright install chromium
#   (cd tests/e2e && python3 make_images.py <any-orange-photo.jpg>) && bash tests/e2e/run.sh
ROOT=$(cd "$(dirname "$0")/../.." && pwd); echo disease > /tmp/mock_mode
python3 "$ROOT/tests/e2e/mock_api.py" & MOCK=$!
(cd "$ROOT/backend" && VISION_PROVIDER=openai OPENAI_BASE_URL=http://127.0.0.1:9100 OPENAI_API_KEY=TEST_KEY_NOT_REAL OPENAI_MODEL=mock-vision \
 STATIC_DIR="$ROOT/frontend/dist/frontend/browser" WEATHER_BASE_URL=http://127.0.0.1:9100 FEEDBACK_FILE=/tmp/e2e-feedback.jsonl RATE_LIMIT_PER_MIN=500 /tmp/agripath-server) & SRV=$!
sleep 1.5; (cd "$ROOT/tests/e2e" && python3 e2e.py); kill $SRV $MOCK
