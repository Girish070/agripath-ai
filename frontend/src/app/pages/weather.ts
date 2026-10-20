import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Api, ApiError, Weather, toApiError } from '../core/api.service';
import { I18n } from '../core/i18n.service';

@Component({
  selector: 'app-weather',
  imports: [DatePipe],
  template: `
    <section class="section">
      <div class="container narrow">
        <h1>{{ t('wx.h1') }}</h1>
        <p class="lead">{{ t('wx.lead') }}</p>

        @if (loading()) {
          <p role="status">{{ t('wx.loading') }}</p>
        } @else if (error(); as e) {
          <div class="callout callout-warn" role="alert">
            <strong>{{ t('err.' + e.code) }}</strong>
            <p>{{ t('wx.unavailable') }}</p>
            <button type="button" class="btn btn-secondary" (click)="load()">{{ t('wx.retry') }}</button>
          </div>
        } @else if (wx(); as w) {
          @if (w.stale) {<div class="callout callout-warn"><p>{{ t('wx.stale') }}</p></div>}
          <div class="card">
            <h2 class="h3">{{ t('wx.now') }}</h2>
            <dl class="facts">
              <div><dt>{{ t('wx.temp') }}</dt><dd>{{ fmt(w.current.temperature_c) }} °C</dd></div>
              <div><dt>{{ t('wx.humidity') }}</dt><dd>{{ fmt(w.current.relative_humidity_pct) }} %</dd></div>
              <div><dt>{{ t('wx.rain') }}</dt><dd>{{ fmt(w.current.precipitation_mm) }} mm</dd></div>
              <div><dt>{{ t('wx.wind') }}</dt><dd>{{ fmt(w.current.wind_speed_kmh) }} km/h</dd></div>
            </dl>
          </div>

          <h2>{{ t('wx.forecast') }}</h2>
          <div class="table-scroll">
            <table class="table">
              <thead><tr><th>{{ t('wx.date') }}</th><th>{{ t('wx.max') }} °C</th><th>{{ t('wx.min') }} °C</th><th>{{ t('wx.rain') }} mm</th><th>{{ t('wx.prob') }} %</th></tr></thead>
              <tbody>
                @for (d of w.daily; track d.date) {
                  <tr><td>{{ d.date }}</td><td>{{ fmt(d.temp_max_c) }}</td><td>{{ fmt(d.temp_min_c) }}</td><td>{{ fmt(d.precipitation_mm) }}</td><td>{{ fmt(d.precipitation_probability_max_pct) }}</td></tr>
                }
              </tbody>
            </table>
          </div>

          @if (rainExpected()) {
            <div class="callout callout-info"><strong>{{ t('wx.hint.t') }}</strong><p>{{ t('wx.hint.rain') }}</p></div>
          }

          <p class="muted small">
            {{ t('wx.source', { src: w.source }) }} · {{ t('wx.updated') }}: {{ w.fetched_at | date: 'medium' }} ·
            {{ t('wx.coords', { lat: w.latitude, lon: w.longitude }) }}
          </p>
          <p class="muted small">{{ t('wx.limits') }}</p>
        }
      </div>
    </section>
  `,
})
export class WeatherPage implements OnInit {
  private readonly api = inject(Api);
  readonly i18n = inject(I18n);
  readonly t = (k: string, p?: Record<string, string | number>) => this.i18n.t(k, p);

  readonly wx = signal<Weather | null>(null);
  readonly loading = signal(true);
  readonly error = signal<ApiError | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.weather().subscribe({
      next: (w) => {
        this.wx.set(w);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(toApiError(e));
        this.loading.set(false);
      },
    });
  }

  fmt(v: number | null | undefined): string {
    return v === null || v === undefined ? '–' : String(Math.round(v * 10) / 10);
  }

  rainExpected(): boolean {
    return !!this.wx()?.daily.some((d) => (d.precipitation_mm ?? 0) > 0);
  }
}
