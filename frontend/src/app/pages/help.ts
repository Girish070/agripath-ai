import { Component, OnInit, inject, signal } from '@angular/core';
import { Api, Health } from '../core/api.service';
import { I18n } from '../core/i18n.service';

@Component({
  selector: 'app-help',
  template: `
    <section class="section">
      <div class="container narrow">
        <h1>{{ t('help.h1') }}</h1>

        <h2>{{ t('help.faq') }}</h2>
        @for (k of faq; track k) {
          <details class="faq">
            <summary>{{ t('help.q.' + k) }}</summary>
            <p>{{ t('help.a.' + k) }}</p>
          </details>
        }

        <h2 id="privacy">{{ t('help.privacy.t') }}</h2>
        <ul class="bullets">
          @for (k of ['1','2','3','4','5']; track k) {<li>{{ t('help.privacy.' + k) }}</li>}
        </ul>

        <h2>{{ t('help.contact.t') }}</h2>
        <p>{{ t('help.contact.p') }}</p>
        <ul class="bullets">
          @for (k of ['1','2','3']; track k) {<li>{{ t('help.contact.' + k) }}</li>}
        </ul>
        <p class="muted small">{{ t('help.contact.note') }}</p>

        <h2>{{ t('help.status.t') }}</h2>
        @if (health(); as h) {
          <dl class="facts">
            <div><dt>{{ t('help.status.server') }}</dt><dd><span class="badge badge-green">{{ t('help.status.ok') }}</span></dd></div>
            <div><dt>{{ t('help.status.ai') }}</dt><dd>
              <span class="badge" [class.badge-green]="h.vision.configured" [class.badge-red]="!h.vision.configured">{{ h.vision.configured ? t('help.status.ready') : t('help.status.notset') }}</span>
              {{ h.vision.label }}
            </dd></div>
            <div><dt>{{ t('help.status.weather') }}</dt><dd>{{ h.weather.enabled ? t('help.status.on') : t('help.status.off') }}</dd></div>
            <div><dt>{{ t('help.status.limits') }}</dt><dd>{{ h.limits.max_upload_mb }} MB · {{ h.limits.rate_limit_per_min }}/min</dd></div>
          </dl>
        } @else if (failed()) {
          <p><span class="badge badge-red">{{ t('help.status.down') }}</span> {{ t('detect.offline') }}</p>
        } @else {
          <p role="status">{{ t('wx.loading') }}</p>
        }
        <p class="muted small">{{ t('help.status.note') }}</p>
      </div>
    </section>
  `,
})
export class HelpPage implements OnInit {
  private readonly api = inject(Api);
  readonly i18n = inject(I18n);
  readonly t = (k: string) => this.i18n.t(k);
  readonly faq = ['1', '2', '3', '4', '5', '6'];
  readonly health = signal<Health | null>(null);
  readonly failed = signal(false);

  ngOnInit(): void {
    this.api.health().subscribe({ next: (h) => this.health.set(h), error: () => this.failed.set(true) });
  }
}
