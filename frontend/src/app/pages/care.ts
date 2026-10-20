import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../core/i18n.service';

const TOPICS = ['material', 'water', 'sanitation', 'scouting', 'nutrition'];

@Component({
  selector: 'app-care',
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="container narrow">
        <h1>{{ t('care.h1') }}</h1>
        <p class="lead">{{ t('care.lead') }}</p>
        @for (k of topics; track k) {
          <article class="card">
            <h2 class="h3">{{ t('care.' + k + '.t') }}</h2>
            <ul class="bullets">
              @for (n of ['1','2','3']; track n) {<li>{{ t('care.' + k + '.' + n) }}</li>}
            </ul>
          </article>
        }
        <article class="card card-safety" id="safety">
          <h2 class="h3">{{ t('care.safety.t') }}</h2>
          <ul class="bullets">
            @for (n of ['1','2','3','4','5','6']; track n) {<li>{{ t('care.safety.' + n) }}</li>}
          </ul>
        </article>
        <p class="muted">{{ t('care.link') }} <a routerLink="/diseases">{{ t('nav.diseases') }}</a></p>
      </div>
    </section>
  `,
})
export class CarePage {
  readonly i18n = inject(I18n);
  readonly t = (k: string) => this.i18n.t(k);
  readonly topics = TOPICS;
}
