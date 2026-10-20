#!/usr/bin/env python3
"""Evaluate AGRIPATH AI against an EXPERT-LABELLED test set (standard library only).

Folder layout (see ml/README.md):  ml/dataset/test/<label>/<photo>.jpg|png
<label> is a disease id (gummosis, canker, hlb, ...) or one of: healthy, nutrient_or_pest, not_citrus.
Labels must come from an agriculture expert - NEVER from this app's own output.

Usage:  python3 ml/evaluate.py --server http://localhost:8080 --data ml/dataset/test --out ml/results.json
The server must have a real provider configured and a high enough RATE_LIMIT_PER_MIN (or use --delay).
Reports per-class precision / recall / F1, a confusion matrix, and the abstain ("unable") rate.
"""
import argparse, json, mimetypes, os, sys, time, urllib.request, uuid
from collections import Counter, defaultdict

def post_image(server, path):
    boundary = uuid.uuid4().hex
    mime = mimetypes.guess_type(path)[0] or 'image/jpeg'
    data = open(path, 'rb').read()
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="consent"\r\n\r\ntrue\r\n'
            f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="{os.path.basename(path)}"\r\n'
            f'Content-Type: {mime}\r\n\r\n').encode() + data + f'\r\n--{boundary}--\r\n'.encode()
    req = urllib.request.Request(server.rstrip('/') + '/api/detect', data=body,
                                 headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    try:
        return json.load(urllib.request.urlopen(req, timeout=120))
    except urllib.error.HTTPError as e:
        try: return {'error': json.load(e)['error']['code']}
        except Exception: return {'error': f'http_{e.code}'}

def predicted_label(resp):
    if 'error' in resp: return 'ERROR:' + resp['error']
    d = resp['detection']
    return d['primary_id'] if d['category'] == 'disease' else d['category']  # 'unable' = abstained

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--server', default='http://localhost:8080')
    ap.add_argument('--data', default='ml/dataset/test'); ap.add_argument('--out', default='ml/results.json')
    ap.add_argument('--delay', type=float, default=0.0, help='seconds between requests')
    a = ap.parse_args()
    items = []
    for label in sorted(os.listdir(a.data)):
        d = os.path.join(a.data, label)
        if os.path.isdir(d):
            items += [(label, os.path.join(d, f)) for f in sorted(os.listdir(d)) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    if not items: sys.exit('No labelled images found. See ml/README.md.')
    rows = []
    for label, path in items:
        rows.append((label, predicted_label(post_image(a.server, path)), path)); time.sleep(a.delay)
    labels = sorted({r[0] for r in rows}); preds = sorted({r[1] for r in rows} | set(labels))
    cm = defaultdict(Counter)
    for t, p, _ in rows: cm[t][p] += 1
    per = {}
    for c in labels:
        tp = cm[c][c]; fp = sum(cm[t][c] for t in labels if t != c); fn = sum(v for p, v in cm[c].items() if p != c)
        pr = tp / (tp + fp) if tp + fp else None; rc = tp / (tp + fn) if tp + fn else None
        f1 = 2 * pr * rc / (pr + rc) if pr and rc else (0.0 if pr is not None and rc is not None else None)
        per[c] = {'n': tp + fn, 'precision': pr, 'recall': rc, 'f1': f1}
    n = len(rows); abstain = sum(1 for r in rows if r[1] == 'unable'); errors = sum(1 for r in rows if r[1].startswith('ERROR'))
    out = {'n_images': n, 'abstain_rate': abstain / n, 'error_rate': errors / n, 'per_class': per,
           'confusion_matrix': {t: dict(cm[t]) for t in labels}, 'note': 'Accuracy is only meaningful if labels are expert-verified and images were never used for prompt tuning.'}
    json.dump(out, open(a.out, 'w'), indent=2)
    fmt = lambda v: '  -  ' if v is None else f'{v:5.2f}'
    print(f'{"class":18}{"n":>4}  prec  recall   f1'); [print(f'{c:18}{v["n"]:>4}  {fmt(v["precision"])}  {fmt(v["recall"])}  {fmt(v["f1"])}') for c, v in per.items()]
    print(f'images={n} abstain_rate={abstain/n:.2f} error_rate={errors/n:.2f}  -> {a.out}')
main()
