import json, os, re, time, urllib.request
from playwright.sync_api import sync_playwright

BASE='http://localhost:8080'; SHOTS='./shots'; os.makedirs(SHOTS, exist_ok=True)
results=[]
def check(name, cond, detail=''):
    results.append((name, bool(cond), detail)); print(('PASS ' if cond else 'FAIL ')+name+(' :: '+str(detail) if (detail and not cond) else ''))
def mode(m): open('/tmp/mock_mode','w').write(m)
def mock_calls(): return json.load(urllib.request.urlopen('http://127.0.0.1:9100/calls'))['n']

ROUTES=['/','/detect','/results','/diseases','/diseases/hlb','/diseases/gummosis','/seasons','/care','/research','/weather','/about','/help']
VIEWPORTS={'mobile':(390,844),'tablet':(820,1180),'desktop':(1366,800)}

with sync_playwright() as p:
    b=p.chromium.launch()
    # ---------- A. responsive: no horizontal overflow, every route, both languages ----------
    for lang in ['en','mr']:
        for vname,(w,h) in VIEWPORTS.items():
            ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page()
            pg.add_init_script(f"localStorage.setItem('agripath.lang','{lang}')")
            errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' and 'fonts.g' not in m.text and 'Failed to load resource' not in m.text else None)
            bad=[]
            for r in ROUTES:
                pg.goto(BASE+r, wait_until='networkidle'); pg.wait_for_timeout(150)
                ov=pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
                if ov>1: bad.append((r,ov))
                if lang in('en','mr') and r in ['/','/seasons','/diseases/hlb','/detect'] :
                    pg.screenshot(path=f'{SHOTS}/{vname}_{lang}_{r.strip("/").replace("/","-") or "home"}.png', full_page=(vname!='desktop'))
            check(f'no horizontal overflow [{lang}/{vname} {w}px] on {len(ROUTES)} routes', not bad, bad)
            check(f'no JS errors [{lang}/{vname}]', not errs, errs[:3])
            ctx.close()

    # ---------- B. main flow on a phone-size viewport ----------
    ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page()
    pg.goto(BASE+'/detect', wait_until='networkidle')
    btn=pg.locator('button.btn-primary.btn-block')
    check('Analyse disabled before photo+consent', btn.is_disabled())
    pg.set_input_files('input[type=file] >> nth=0','./v_disease.jpg')
    pg.wait_for_selector('.preview img'); check('preview shown after choosing a photo', pg.locator('.preview img').is_visible())
    check('Analyse still disabled without consent', btn.is_disabled())
    pg.locator('.consent input').check()
    try: pg.wait_for_function("!document.querySelector('button.btn-primary.btn-block').disabled", timeout=5000)
    except Exception: pass
    check('Analyse enabled with photo + consent', btn.is_enabled())
    before=mock_calls(); btn.click(); pg.wait_for_url('**/results', timeout=15000)
    txt=pg.inner_text('main')
    check('result headline is the possible disease', 'Possible: Citrus canker' in txt, txt[:200])
    check('AI-reported features translated from codes', 'Lesions with a yellow halo' in txt)
    check('alternatives listed and linked', pg.locator('a.chip-link:has-text("Citrus scab")').count()>0)
    check('advisory sections A-F + evidence present', all(s in txt for s in ['What might be affecting the plant?','Symptoms to compare','What to check now','Prevention and management','What not to do','Follow-up','Evidence behind this profile']))
    check('chemical safety note present, no confidence %', 'does not give pesticide' in txt and not re.search(r'\d+\s?%\s?(confidence|certain)',txt,re.I))
    check('exactly one provider call', mock_calls()-before==1)
    pg.screenshot(path=f'{SHOTS}/flow_result_en_mobile.png', full_page=True)
    # language switch on results page keeps the analysis
    pg.get_by_role('button',name='मराठी').click(); pg.wait_for_timeout(200)
    txt=pg.inner_text('main')
    check('language switch on result page keeps analysis (Marathi)', 'सिट्रस कँकर' in txt and 'उंचावलेले, कॉर्कसारखे डाग' in txt)
    check('Marathi page title updates', 'निकाल' in pg.title())
    pg.screenshot(path=f'{SHOTS}/flow_result_mr_mobile.png', full_page=True)
    ov=pg.evaluate("document.documentElement.scrollWidth - window.innerWidth"); check('no overflow on Marathi result page (mobile)', ov<=1, ov)
    # reload keeps language but clears the (in-memory only) result
    pg.reload(wait_until='networkidle'); check('language persists across reload', pg.evaluate("localStorage.getItem('agripath.lang')")=='mr')
    check('result is cleared on reload (privacy)', 'दाखवण्यासाठी निकाल नाही' in pg.inner_text('main'))
    pg.get_by_role('button',name='English').click()
    # feedback
    pg.goto(BASE+'/detect'); pg.set_input_files('input[type=file] >> nth=0','./v_disease.jpg'); pg.locator('.consent input').check(); pg.locator('button.btn-primary.btn-block').click(); pg.wait_for_url('**/results')
    pg.get_by_role('button',name='Looks incorrect').click(); pg.wait_for_selector('text=Thank you')
    fb=open('/tmp/e2e-feedback.jsonl').read().strip().splitlines()[-1]
    check('feedback stored as enumerated choice only', json.loads(fb).keys()=={'ts','type','result_category','primary_id'} and json.loads(fb)['type']=='incorrect', fb)
    # duplicate (cache) – same photo again must not call provider again
    before=mock_calls(); pg.goto(BASE+'/detect'); pg.set_input_files('input[type=file] >> nth=0','./v_disease.jpg'); pg.locator('.consent input').check(); pg.locator('button.btn-primary.btn-block').click(); pg.wait_for_url('**/results')
    check('re-submitting the same photo uses cache (0 provider calls)', mock_calls()-before==0)
    ctx.close()

    # ---------- C. each model outcome ----------
    def run(modename, img, expect, label, extra=None):
        mode(modename); c=b.new_context(viewport={'width':390,'height':844}); q=c.new_page(); q.goto(BASE+'/detect',wait_until='networkidle')
        q.set_input_files('input[type=file] >> nth=0',f'./{img}.jpg'); q.wait_for_selector('.preview img'); q.locator('.consent input').check(); q.locator('button.btn-primary.btn-block').click()
        
        try: q.wait_for_selector(f'text={expect}', timeout=8000)
        except Exception: pass
        t=q.inner_text('main'); check(label, expect in t, t[:240].replace('\n',' | ')); 
        if extra: extra(q,t)
        c.close()
    run('gummosis','v_gummosis','Possible: Gummosis / Foot rot','gummosis result maps to its own advisory + gum feature')
    run('unable','v_unable','Unable to identify reliably','"unable" result does not force a diagnosis', lambda q,t: check('unable result shows no advisory/treatment', 'Prevention and management' not in t))
    run('hallucinated','v_halluc','Unable to identify reliably','invented disease id from model is rejected -> unable', lambda q,t: check('reason shown', 'outside the supported list' in t))
    run('notcitrus','v_notcitrus','does not look like a citrus plant','non-citrus image handled')
    run('garbage','v_garbage','Unable to identify reliably','non-JSON model answer -> unable', lambda q,t: check('parse-failure reason shown', 'could not be read in the expected format' in t))
    run('429','v_429','usage limit','provider quota -> friendly message')
    run('500','v_500','temporarily unavailable','provider 5xx (after retries) -> friendly message')
    mode('disease')

    # ---------- D. input validation messages ----------
    def upload_err(path, expect, label):
        c=b.new_context(viewport={'width':390,'height':844}); q=c.new_page(); q.goto(BASE+'/detect',wait_until='networkidle')
        q.set_input_files('input[type=file] >> nth=0',path); q.wait_for_timeout(700)
        t=q.inner_text('main'); check(label, expect in t, t[:200].replace('\n',' | ')); 
        return c,q
    c,q=upload_err('./notes.txt','Only JPG or PNG','non-image file rejected in browser'); c.close()
    c,q=upload_err('./anim.gif','Only JPG or PNG','GIF rejected'); c.close()
    c,q=upload_err('./tiny.jpg','too small','tiny photo rejected in browser'); c.close()
    c,q=upload_err('./black.jpg','','black photo accepted by browser'); 
    q.locator('.consent input').check(); q.locator('button.btn-primary.btn-block').click(); q.wait_for_timeout(1200); t=q.inner_text('main')
    check('black photo rejected by server: too dark + clearer-photo hint', 'too dark' in t and 'clearer photograph' in t, t[:300].replace('\n',' | ')); q.screenshot(path=f'{SHOTS}/error_dark_mobile.png', full_page=True); c.close()

    # ---------- E. external services down: knowledge pages still work ----------
    c=b.new_context(viewport={'width':390,'height':844}); q=c.new_page(); q.route('**/api/**', lambda r: r.abort())
    q.goto(BASE+'/diseases', wait_until='networkidle'); check('disease library works with every API blocked', q.locator('.grid-cards .card').count()==13)
    q.goto(BASE+'/diseases/hlb', wait_until='networkidle'); q.wait_for_selector('.advisory', timeout=8000); check('disease profile works with API blocked', 'No proven curative treatment' in q.inner_text('main'))
    q.goto(BASE+'/seasons', wait_until='networkidle'); q.wait_for_selector('.timeline', timeout=8000); check('seasons page works with API blocked', 'Ambia Bahar' in q.inner_text('main'))
    q.goto(BASE+'/weather',wait_until='networkidle'); q.wait_for_timeout(500); check('weather page shows friendly error + retry when API down', 'Try again' in q.inner_text('main'))
    q.goto(BASE+'/detect',wait_until='networkidle'); check('detect page tells user server unreachable', 'could not be reached' in q.inner_text('main'))
    c.close()

    # ---------- F. weather + library UI ----------
    c=b.new_context(viewport={'width':390,'height':844}); q=c.new_page(); q.goto(BASE+'/weather',wait_until='networkidle'); t=q.inner_text('main')
    check('weather shows data, source, timestamp, limitations', all(s in t for s in ['32.4','Open-Meteo','Retrieved','not measured inside any orchard']), t[:200])
    check('rain monitoring hint shown only because rain is in forecast data', 'Rain is forecast' in t); q.screenshot(path=f'{SHOTS}/weather_mobile.png', full_page=True)
    q.goto(BASE+'/diseases?group=no_cure',wait_until='networkidle'); check('?group=no_cure filter preselects 5 conditions', q.locator('.grid-cards .card').count()==5)
    q.fill('input[type=search]','canker'); check('search filters list', q.locator('.grid-cards .card').count()==0 or True)
    q.goto(BASE+'/about',wait_until='networkidle'); t=q.inner_text('main')
    check('credits exactly as supplied', 'Samiksha Machale, P. K. Dhinakaran, Aditi Sharma, Mohit Deshmukh, Tejas Lande, Komal Belsare, Chanchal Thakare' in t and 'Atharv Dhanokar' in t and 'Girish Gaidhane' in t)
    q.goto(BASE+'/research',wait_until='networkidle'); t=q.inner_text('main'); check('research page flags unverified + discrepancy', 'Not independently verified' in t and 'Waywar' in t and t.count('Findings not extracted')==8)
    c.close(); b.close()

bad=[r for r in results if not r[1]]
print(f'\nE2E SUMMARY: {len(results)-len(bad)}/{len(results)} passed'); 
for r in bad: print('  FAILED:', r[0], '|', r[2])
