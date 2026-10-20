import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Api, DetectEvent, toApiError } from './api.service';

describe('Api', () => {
  let api: Api;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(Api);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the photo as multipart form data with the consent flag to a relative URL', () => {
    const events: DetectEvent[] = [];
    api.detect(new Blob(['x'], { type: 'image/jpeg' }), true).subscribe((e) => events.push(e));
    const req = http.expectOne('/api/detect');
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.get('consent')).toBe('true');
    expect(body.get('image')).toBeInstanceOf(Blob);
    req.flush({ request_id: 'abc', detection: { category: 'unable' } });
    expect(events.at(-1)?.phase).toBe('done');
  });

  it('never talks to a hard-coded host (no API keys or absolute URLs in the browser)', () => {
    api.health().subscribe();
    const req = http.expectOne('/api/health');
    expect(req.request.url.startsWith('/')).toBe(true);
    req.flush({});
  });

  it('maps backend error codes, network failures and unknown errors', () => {
    expect(toApiError(new HttpErrorResponse({ status: 422, error: { error: { code: 'image_blurry' } } }))).toEqual({ code: 'image_blurry', status: 422 });
    expect(toApiError(new HttpErrorResponse({ status: 0 })).code).toBe('network');
    expect(toApiError(new HttpErrorResponse({ status: 500, error: 'oops' })).code).toBe('unknown');
    expect(toApiError(new Error('x')).code).toBe('unknown');
  });
});
