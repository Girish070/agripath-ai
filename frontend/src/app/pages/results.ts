import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { I18n } from '../core/i18n.service';
import { SessionStore } from '../core/session.store';
import { DISEASE_BY_ID } from '../data/diseases';
import { FEATURE_LABELS, QUALITY_LABELS } from '../data/features';
import { AdvisoryComponent } from '../shared/advisory';

const FEEDBACK = ['looks_correct', 'incorrect', 'uncertain', 'unhelpful_advice', 'missing_disease'];

@Component({
  selector: 'app-results',
  imports: [RouterLink, AdvisoryComponent],
  template: `
    <section class="section">
      <div class="container narrow">
        @if (res(); as r) {
          @let d = r.detection;
          <div class="result-top">
            @if (preview(); as p) {<img class="result-thumb" [src]="p" [alt]="t('detect.preview_alt')" />}
            <div>
              <p class="kicker-plain">{{ t('res.prelim') }}</p>
              @switch (d.category) {
                @case ('disease') {
                  <h1>{{ t('res.possible') }}: {{ i18n.l(primary()?.name) }}</h1>
                }
                @case ('healthy') { <h1>{{ t('res.healthy.h') }}</h1> }
                @case ('nutrient_or_pest') { <h1>{{ t('res.other.h') }}</h1> }
                @case ('not_citrus') { <h1>{{ t('res.notcitrus.h') }}</h1> }
                @default { <h1>{{ t('res.unable.h') }}</h1> }
              }
            </div>
          </div>

          <div class="callout callout-info" role="note"><p>{{ t('res.notdiagnosis') }}</p></div>

          @switch (d.category) {
            @case ('healthy') { <p>{{ t('res.healthy.p') }}</p> }
            @case ('nutrient_or_pest') { <p>{{ t('res.other.p') }}</p> }
            @case ('not_citrus') { <p>{{ t('res.notcitrus.p') }}</p> }
            @case ('unable') {
              <p>{{ t('res.unable.p') }}</p>
              @if (d.abstain_reason) {<p class="muted">{{ t('res.reason.' + d.abstain_reason) }}</p>}
            }
          }

          @if (d.image_quality_concerns.length) {
            <div class="callout callout-warn">
              <strong>{{ t('res.quality.title') }}</strong>
              <ul class="bullets">
                @for (q of d.image_quality_concerns; track q) {<li>{{ quality(q) }}</li>}
              </ul>
            </div>
          }

          @if (d.observed_features.length) {
            <div class="card">
              <h2 class="h3">{{ t('res.features.title') }}</h2>
              <p class="muted small">{{ t('res.features.note') }}</p>
              <div class="chips">
                @for (f of d.observed_features; track f) {<span class="chip">{{ feature(f) }}</span>}
              </div>
            </div>
          }

          @if (d.multiple_problems) {
            <div class="callout callout-info"><p>{{ t('res.multiple') }}</p></div>
          }

          @if (alternatives().length) {
            <div class="card">
              <h2 class="h3">{{ t('res.alt.title') }}</h2>
              <p class="muted small">{{ t('res.alt.note') }}</p>
              <div class="chips">
                @for (a of alternatives(); track a.id) {
                  <a class="chip chip-link" [routerLink]="['/diseases', a.id]">{{ i18n.l(a.name) }}</a>
                }
              </div>
            </div>
          }

          @if (primary(); as p) {
            <app-advisory [disease]="p" mode="result">
              <div class="btn-row">
                <a class="btn btn-secondary" routerLink="/detect">{{ t('res.again') }}</a>
                <a class="btn btn-secondary" [routerLink]="['/diseases', p.id]">{{ t('res.profile') }}</a>
                <a class="btn btn-secondary" routerLink="/research">{{ t('res.refs') }}</a>
              </div>
            </app-advisory>
          } @else {
            <div class="btn-row">
              <a class="btn btn-primary" routerLink="/detect">{{ t('res.again') }}</a>
              <a class="btn btn-secondary" routerLink="/diseases">{{ t('cta.library') }}</a>
            </div>
          }

          <div class="card">
            <h2 class="h3">{{ t('fb.title') }}</h2>
            @if (feedbackSent()) {
              <p role="status">{{ t('fb.thanks') }}</p>
            } @else {
              <div class="btn-row">
                @for (f of feedbackTypes; track f) {
                  <button type="button" class="btn btn-ghost" (click)="sendFeedback(f)">{{ t('fb.' + f) }}</button>
                }
              </div>
              @if (feedbackFailed()) {<p class="muted small" role="status">{{ t('fb.failed') }}</p>}
              <p class="muted small">{{ t('fb.note') }}</p>
            }
          </div>

          <div class="result-foot">
            <p class="muted small">{{ t('res.meta', { provider: r.provider.label, model: r.provider.model }) }} · {{ t('res.accuracy') }}</p>
            <button type="button" class="btn btn-ghost no-print" (click)="print()">{{ t('res.print') }}</button>
          </div>
        } @else {
          <h1>{{ t('res.none.h') }}</h1>
          <p>{{ t('res.none.p') }}</p>
          <a class="btn btn-primary" routerLink="/detect">{{ t('cta.detect') }}</a>
        }
      </div>
    </section>
  `,
})
export class ResultsPage {
  private readonly session = inject(SessionStore);
  private readonly api = inject(Api);
  readonly i18n = inject(I18n);
  readonly t = (k: string, p?: Record<string, string | number>) => this.i18n.t(k, p);

  readonly res = this.session.result;
  readonly preview = this.session.previewUrl;
  readonly feedbackTypes = FEEDBACK;
  readonly feedbackSent = signal(false);
  readonly feedbackFailed = signal(false);

  readonly primary = computed(() => {
    const id = this.res()?.detection.primary_id;
    return id ? DISEASE_BY_ID[id] : undefined;
  });
  readonly alternatives = computed(() =>
    (this.res()?.detection.alternative_ids ?? []).map((id) => DISEASE_BY_ID[id]).filter(Boolean),
  );

  feature = (code: string) => this.i18n.l(FEATURE_LABELS[code]) || code;
  quality = (code: string) => this.i18n.l(QUALITY_LABELS[code]) || code;

  sendFeedback(type: string): void {
    const r = this.res();
    if (!r) return;
    this.api.feedback(type, r.detection.category, r.detection.primary_id).subscribe({
      next: () => this.feedbackSent.set(true),
      error: () => this.feedbackFailed.set(true), // optional feature: show a small note, never block the person
    });
  }

  print(): void {
    window.print();
  }
}
