import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ResultsPage } from './results';
import { SessionStore } from '../core/session.store';
import { I18n } from '../core/i18n.service';
import { DetectResponse } from '../core/api.service';

function response(over: Partial<DetectResponse['detection']>): DetectResponse {
  return {
    request_id: 'r1', cached: false, prompt_version: 'v', generated_at: '2026-10-17T00:00:00Z',
    provider: { name: 'nvidia', model: 'm', label: 'NVIDIA' },
    detection: { category: 'unable', alternative_ids: [], observed_features: [], plant_part: 'unclear', multiple_problems: false, image_quality_concerns: [], ...over },
  };
}

describe('ResultsPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [ResultsPage], providers: [provideRouter([]), provideHttpClient()] }).compileComponents();
  });

  async function render() {
    const f = TestBed.createComponent(ResultsPage);
    await f.whenStable();
    return f;
  }

  it('asks for a photo when there is no result', async () => {
    const f = await render();
    expect((f.nativeElement as HTMLElement).textContent).toContain('No result to show');
  });

  it('shows "Unable to identify reliably" without forcing a disease or any treatment', async () => {
    TestBed.inject(SessionStore).result.set(response({ category: 'unable', abstain_reason: 'model_unsure' }));
    const f = await render();
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Unable to identify reliably');
    expect(f.nativeElement.querySelector('app-advisory')).toBeNull();
    expect(text).not.toContain('Prevention and management');
  });

  it('shows a non-citrus image as non-citrus', async () => {
    TestBed.inject(SessionStore).result.set(response({ category: 'not_citrus' }));
    const f = await render();
    expect((f.nativeElement as HTMLElement).textContent).toContain('does not look like a citrus plant');
  });

  it('renders the disease advisory with the safety notes and no confidence number', async () => {
    TestBed.inject(SessionStore).result.set(response({ category: 'disease', primary_id: 'canker', observed_features: ['yellow_halo_lesions'], alternative_ids: ['scab'] }));
    const f = await render();
    const el = f.nativeElement as HTMLElement;
    const text = el.textContent ?? '';
    expect(text).toContain('Possible: Citrus canker');
    expect(text).toContain('Lesions with a yellow halo');
    expect(text).toContain('not a confirmed diagnosis');
    expect(text).toContain('does not give pesticide or fungicide names, doses');
    expect(text).toContain('What not to do');
    expect(text).not.toMatch(/\d+\s?%\s?(confidence|certain|sure)/i);
    expect(el.querySelectorAll('a.chip-link').length).toBeGreaterThan(0);
  });

  it('switches to Marathi on the result page and keeps the same analysis', async () => {
    const store = TestBed.inject(SessionStore);
    store.result.set(response({ category: 'disease', primary_id: 'gummosis', observed_features: ['gum_oozing'] }));
    const f = await render();
    TestBed.inject(I18n).set('mr');
    await f.whenStable();
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('डिंक्या रोग');
    expect(text).toContain('डिंकासारखा स्राव');
    expect(store.result()?.detection.primary_id).toBe('gummosis');
  });
});
