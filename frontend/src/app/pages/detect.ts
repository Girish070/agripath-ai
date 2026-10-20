import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Api, ApiError, Health, toApiError } from '../core/api.service';
import { I18n } from '../core/i18n.service';
import { SessionStore } from '../core/session.store';
import { prepareImage, validateFile } from '../core/image-tools';

type Phase = 'idle' | 'preparing' | 'uploading' | 'analysing';

@Component({
  selector: 'app-detect',
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="container narrow">
        <h1>{{ t('detect.h1') }}</h1>
        <p class="lead">{{ t('detect.lead') }}</p>

        @if (health(); as h) {
          @if (!h.vision.configured) {
            <div class="callout callout-warn" role="alert"><strong>{{ t('detect.unconfigured.t') }}</strong><p>{{ t('detect.unconfigured.d') }}</p></div>
          }
        } @else if (healthFailed()) {
          <div class="callout callout-warn" role="alert"><strong>{{ t('err.network') }}</strong><p>{{ t('detect.offline') }}</p></div>
        }

        <details class="tips" open>
          <summary>{{ t('detect.tips.title') }}</summary>
          <ul class="bullets">
            @for (k of ['1','2','3','4','5']; track k) {<li>{{ t('detect.tips.' + k) }}</li>}
          </ul>
        </details>

        <div class="card upload-card">
          @if (!preview()) {
            <label class="dropzone" [class.over]="dragging()" (dragover)="$event.preventDefault(); dragging.set(true)" (dragleave)="dragging.set(false)" (drop)="onDrop($event)">
              <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path fill="currentColor" d="M19.4 10a7.5 7.5 0 0 0-14.3-1.8A5.5 5.5 0 0 0 6 19h12.5a4.5 4.5 0 0 0 .9-8.9ZM13 13v4h-2v-4H8l4-4 4 4h-3Z"/></svg>
              <strong>{{ t('detect.drop') }}</strong>
              <span class="muted">{{ t('detect.formats') }}</span>
              <input #gallery type="file" accept="image/jpeg,image/png" class="visually-hidden" (change)="onPick($event)" />
            </label>
            <div class="btn-row center">
              <button type="button" class="btn btn-secondary" (click)="gallery.click()">{{ t('detect.choose') }}</button>
              <button type="button" class="btn btn-secondary" (click)="camera.click()">{{ t('detect.camera') }}</button>
              <input #camera type="file" accept="image/jpeg,image/png" capture="environment" class="visually-hidden" (change)="onPick($event)" />
            </div>
          } @else {
            <figure class="preview">
              <img [src]="preview()" [alt]="t('detect.preview_alt')" />
            </figure>
            <div class="btn-row center">
              <button type="button" class="btn btn-ghost" (click)="replace.click()" [disabled]="busy()">{{ t('detect.replace') }}</button>
              <button type="button" class="btn btn-ghost" (click)="remove()" [disabled]="busy()">{{ t('detect.remove') }}</button>
              <input #replace type="file" accept="image/jpeg,image/png" class="visually-hidden" (change)="onPick($event)" />
            </div>
          }

          @if (error(); as e) {
            <div class="callout callout-warn" role="alert">
              <strong>{{ t('err.' + e.code) }}</strong>
              @if (qualityHint(e.code)) {<p>{{ t('err.hint.quality') }}</p>}
            </div>
          }

          <label class="consent">
            <input type="checkbox" [checked]="consent()" (change)="consent.set($any($event.target).checked)" />
            <span>{{ t('detect.consent', { provider: providerLabel() }) }}</span>
          </label>
          <p class="muted small">{{ t('detect.privacy') }} <a routerLink="/help" fragment="privacy">{{ t('detect.privacy.link') }}</a></p>

          @if (busy()) {
            <div class="progress" role="status" aria-live="polite">
              <div class="bar" [style.width.%]="phase() === 'uploading' ? percent() : 100" [class.indeterminate]="phase() !== 'uploading'"></div>
              <span>{{ t('detect.phase.' + phase()) }}@if (phase() === 'uploading') { {{ percent() }}%}</span>
            </div>
          }

          <button type="button" class="btn btn-primary btn-lg btn-block" [disabled]="!canSubmit()" (click)="analyse()">
            {{ busy() ? t('detect.working') : t('detect.analyse') }}
          </button>
          @if (error() && prepared()) {
            <p class="muted small center">{{ t('detect.retry_hint') }}</p>
          }
        </div>
      </div>
    </section>
  `,
})
export class DetectPage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18n);
  readonly t = (k: string, p?: Record<string, string | number>) => this.i18n.t(k, p);

  readonly health = signal<Health | null>(null);
  readonly healthFailed = signal(false);
  readonly preview = this.session.previewUrl;
  readonly prepared = signal<Blob | null>(null);
  readonly phase = signal<Phase>('idle');
  readonly percent = signal(0);
  readonly dragging = signal(false);
  readonly error = signal<ApiError | null>(null);
  readonly consent = signal(false);

  readonly busy = computed(() => this.phase() !== 'idle');
  readonly providerLabel = computed(() => this.health()?.vision.label ?? '…');
  readonly canSubmit = computed(
    () => !!this.prepared() && this.consent() && !this.busy() && (this.health()?.vision.configured ?? false),
  );

  ngOnInit(): void {
    const sub = this.api.health().subscribe({
      next: (h) => this.health.set(h),
      error: () => this.healthFailed.set(true),
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
    // A previous photo (e.g. after "upload a clearer photo") is cleared so the page starts fresh.
    if (!this.prepared()) this.session.clear();
  }

  qualityHint(code: string): boolean {
    return ['image_blurry', 'image_too_dark', 'image_overexposed', 'image_too_small'].includes(code);
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.dragging.set(false);
    const f = ev.dataTransfer?.files?.[0];
    if (f) void this.take(f);
  }

  onPick(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = ''; // allow picking the same file again
    if (f) void this.take(f);
  }

  private async take(file: File): Promise<void> {
    this.error.set(null);
    this.prepared.set(null);
    const bad = validateFile(file);
    if (bad) return this.error.set({ code: bad, status: 0 });
    this.phase.set('preparing');
    try {
      const out = await prepareImage(file);
      this.prepared.set(out.blob);
      this.session.setPreview(URL.createObjectURL(out.blob));
      this.session.result.set(null);
    } catch (e) {
      this.error.set({ code: (e as Error).message === 'image_too_small' ? 'image_too_small' : 'corrupt_image', status: 0 });
    } finally {
      this.phase.set('idle');
    }
  }

  remove(): void {
    this.session.clear();
    this.prepared.set(null);
    this.error.set(null);
  }

  analyse(): void {
    const blob = this.prepared();
    if (!blob || !this.canSubmit()) return;
    this.error.set(null);
    this.percent.set(0);
    this.phase.set('uploading');
    this.api.detect(blob, this.consent()).subscribe({
      next: (ev) => {
        if (ev.phase === 'upload') {
          this.percent.set(ev.percent);
          if (ev.percent >= 100) this.phase.set('analysing');
        } else {
          this.session.result.set(ev.body);
          this.phase.set('idle');
          void this.router.navigate(['/results']);
        }
      },
      error: (err) => {
        this.phase.set('idle');
        this.error.set(toApiError(err));
      },
    });
  }
}
