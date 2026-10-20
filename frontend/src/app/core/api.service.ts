import { HttpClient, HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, filter, map } from 'rxjs';

export interface Detection {
  category: 'disease' | 'healthy' | 'nutrient_or_pest' | 'not_citrus' | 'unable';
  primary_id?: string;
  alternative_ids: string[];
  observed_features: string[];
  plant_part: string;
  multiple_problems: boolean;
  image_quality_concerns: string[];
  abstain_reason?: string;
}

export interface DetectResponse {
  request_id: string;
  detection: Detection;
  provider: { name: string; model: string; label: string };
  cached: boolean;
  prompt_version: string;
  generated_at: string;
}

export interface Health {
  status: string;
  vision: { provider: string; model: string; label: string; configured: boolean };
  weather: { enabled: boolean; provider: string };
  limits: { max_upload_mb: number; rate_limit_per_min: number };
  prompt_version: string;
}

export interface DailyWeather {
  date: string;
  temp_max_c: number | null;
  temp_min_c: number | null;
  precipitation_mm: number | null;
  precipitation_probability_max_pct: number | null;
}

export interface Weather {
  source: string;
  source_url: string;
  latitude: number;
  longitude: number;
  fetched_at: string;
  stale: boolean;
  timezone: string;
  current: {
    time: string;
    temperature_c: number | null;
    relative_humidity_pct: number | null;
    precipitation_mm: number | null;
    wind_speed_kmh: number | null;
  };
  daily: DailyWeather[];
  limitations: string;
}

/** A failure the UI can translate: `code` maps to the `err.<code>` UI string. */
export interface ApiError {
  code: string;
  status: number;
}

export type DetectEvent = { phase: 'upload'; percent: number } | { phase: 'done'; body: DetectResponse };

export function toApiError(err: unknown): ApiError {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return { code: 'network', status: 0 };
    const code = err.error?.error?.code;
    if (typeof code === 'string') return { code, status: err.status };
    return { code: 'unknown', status: err.status };
  }
  return { code: 'unknown', status: -1 };
}

/** Relative URLs: `ng serve` proxies /api to the Go server; in production Go serves both. */
@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);

  health(): Observable<Health> {
    return this.http.get<Health>('/api/health');
  }

  weather(): Observable<Weather> {
    return this.http.get<Weather>('/api/weather');
  }

  detect(image: Blob, consent: boolean): Observable<DetectEvent> {
    const form = new FormData();
    form.append('consent', consent ? 'true' : 'false');
    form.append('image', image, 'photo.jpg');
    return this.http.post<DetectResponse>('/api/detect', form, { reportProgress: true, observe: 'events' }).pipe(
      filter((e) => e.type === HttpEventType.UploadProgress || e.type === HttpEventType.Response),
      map((e): DetectEvent => {
        if (e.type === HttpEventType.UploadProgress) {
          return { phase: 'upload', percent: e.total ? Math.round((100 * e.loaded) / e.total) : 0 };
        }
        return { phase: 'done', body: (e as { body: DetectResponse }).body };
      }),
    );
  }

  feedback(type: string, resultCategory: string, primaryId?: string): Observable<unknown> {
    return this.http.post('/api/feedback', { type, result_category: resultCategory, primary_id: primaryId ?? '' });
  }
}
