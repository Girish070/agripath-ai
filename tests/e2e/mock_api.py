"""Local MOCK of an OpenAI-compatible vision API + Open-Meteo. For pipeline testing only."""
import json, sys, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MODE_FILE = '/tmp/mock_mode'
def mode():
    try: return open(MODE_FILE).read().strip()
    except Exception: return 'disease'

ANSWERS = {
  'disease': {"is_citrus_plant":"yes","plant_part":"leaf","category":"disease","primary_id":"canker","alternative_ids":["scab","melanose"],"observed_features":["raised_corky_lesions","yellow_halo_lesions"],"multiple_problems":False,"image_quality_concerns":[]},
  'gummosis': {"is_citrus_plant":"yes","plant_part":"trunk","category":"disease","primary_id":"gummosis","alternative_ids":["decline"],"observed_features":["gum_oozing","bark_lesion"],"multiple_problems":False,"image_quality_concerns":[]},
  'unable': {"is_citrus_plant":"yes","plant_part":"unclear","category":"unable","primary_id":None,"alternative_ids":[],"observed_features":[],"multiple_problems":False,"image_quality_concerns":["partial_view"]},
  'hallucinated': {"is_citrus_plant":"yes","plant_part":"leaf","category":"disease","primary_id":"purple_wilt_virus","alternative_ids":[],"observed_features":["leaf_spots"]},
  'notcitrus': {"is_citrus_plant":"no","plant_part":"other","category":"not_citrus","primary_id":None,"alternative_ids":[],"observed_features":[],"multiple_problems":False,"image_quality_concerns":[]},
}
calls = {'n': 0}

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, obj):
        b = json.dumps(obj).encode(); self.send_response(code)
        self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_POST(self):
        n = int(self.headers.get('Content-Length',0)); body = json.loads(self.rfile.read(n) or b'{}')
        calls['n'] += 1
        # prove the server sends a proper image data-URI + the expected prompt, and a bearer key
        parts = body['messages'][0]['content']
        img = [p for p in parts if p['type']=='image_url'][0]['image_url']['url']
        assert img.startswith('data:image/jpeg;base64,'), img[:30]
        assert self.headers.get('Authorization','').startswith('Bearer '), 'no bearer'
        m = mode()
        if m == '429': return self._send(429, {"error":"quota"})
        if m == '500': return self._send(500, {"error":"boom"})
        if m == 'garbage': return self._send(200, {"choices":[{"message":{"content":"Looks like a nice tree to me!"}}]})
        if m == 'slow': time.sleep(2)
        ans = ANSWERS.get(m, ANSWERS['disease'])
        self._send(200, {"choices":[{"message":{"content":"Here you go:\n```json\n"+json.dumps(ans)+"\n```"}}]})
    def do_GET(self):
        if self.path == '/calls': return self._send(200, calls)
        if self.path.startswith('/v1/forecast'):
            return self._send(200, {"timezone":"Asia/Kolkata","current":{"time":"2026-10-17T15:00","temperature_2m":32.4,"relative_humidity_2m":48,"precipitation":0.0,"wind_speed_10m":9.5},
              "daily":{"time":["2026-10-17","2026-10-18","2026-10-19","2026-10-20","2026-10-21"],"temperature_2m_max":[33,34,32,31,33],"temperature_2m_min":[21,22,21,20,21],"precipitation_sum":[0,0,6.2,1.1,0],"precipitation_probability_max":[3,10,70,40,5]}})
        self._send(404, {})

ThreadingHTTPServer(('127.0.0.1', 9100), H).serve_forever()
