import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../core/i18n.service';

/** Credits exactly as supplied in the project presentation - spelling and capitalisation preserved. */
export const CREDITS: { role: string; names: string }[] = [
  { role: 'credits.ui', names: 'Samiksha Machale' },
  { role: 'credits.frontend', names: 'Atharv Dhanokar' },
  { role: 'credits.backend', names: 'Girish Gaidhane' },
  { role: 'credits.poster', names: 'Samiksha Machale, P. K. Dhinakaran, Aditi Sharma, Mohit Deshmukh, Tejas Lande, Komal Belsare, Chanchal Thakare' },
  { role: 'credits.presented', names: 'Mohit Deshmukh, Atharv Dhanokar, P. K. Dhinakaran, Samiksha Machale, Girish Gaidhane' },
];

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="container narrow">
        <h1>{{ t('about.h1') }}</h1>
        <p class="lead">{{ t('about.lead') }}</p>

        <h2>{{ t('about.how.t') }}</h2>
        <ul class="bullets">
          @for (k of ['1','2','3','4']; track k) {<li>{{ t('about.how.' + k) }}</li>}
        </ul>

        <div class="callout callout-warn">
          <strong>{{ t('about.honest.t') }}</strong>
          <p>{{ t('about.honest.d') }}</p>
        </div>

        <h2>{{ t('about.tech.t') }}</h2>
        <p>{{ t('about.tech.d') }}</p>

        <h2>{{ t('about.credits.t') }}</h2>
        <dl class="credits">
          @for (c of credits; track c.role) {
            <div><dt>{{ t(c.role) }}</dt><dd>{{ c.names }}</dd></div>
          }
        </dl>
        <p class="muted">{{ t('about.course') }}</p>
        <p class="muted small">{{ t('about.photos') }}</p>
        <a class="btn btn-secondary" routerLink="/help">{{ t('nav.help') }}</a>
      </div>
    </section>
  `,
})
export class AboutPage {
  readonly i18n = inject(I18n);
  readonly t = (k: string) => this.i18n.t(k);
  readonly credits = CREDITS;
}
