import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../core/i18n.service';
import { DISEASES } from '../data/diseases';
import { BAHARS } from '../data/bahar';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <h1>{{ t('home.h1') }}</h1>
          <p class="lead">{{ t('home.lead') }}</p>
          <div class="btn-row">
            <a class="btn btn-primary btn-lg" routerLink="/detect">{{ t('cta.detect') }}</a>
            <a class="btn btn-secondary btn-lg" routerLink="/diseases">{{ t('cta.library') }}</a>
          </div>
          <p class="hero-note">{{ t('home.note') }}</p>
        </div>
        <figure class="hero-photo">
          <img src="gallery/ppt-image4.jpg" [alt]="t('home.photo_alt')" width="736" height="736" fetchpriority="high" />
          <figcaption>{{ t('home.photo_cap') }}</figcaption>
        </figure>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2>{{ t('home.how.title') }}</h2>
        <ol class="steps">
          @for (s of steps; track s) {
            <li>
              <strong>{{ t('home.how.' + s + '.t') }}</strong>
              <span>{{ t('home.how.' + s + '.d') }}</span>
            </li>
          }
        </ol>
      </div>
    </section>

    <section class="section section-tint">
      <div class="container two-col">
        <div>
          <h2>{{ t('home.is.title') }}</h2>
          <ul class="bullets">
            @for (k of ['1','2','3']; track k) {<li>{{ t('home.is.' + k) }}</li>}
          </ul>
        </div>
        <div>
          <h2>{{ t('home.isnt.title') }}</h2>
          <ul class="bullets bullets-no">
            @for (k of ['1','2','3']; track k) {<li>{{ t('home.isnt.' + k) }}</li>}
          </ul>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2>{{ t('home.bahar.title') }}</h2>
        <p class="muted measure">{{ t('home.bahar.sub') }}</p>
        <div class="two-col">
          @for (b of bahars; track b.id) {
            <a class="card card-link" routerLink="/seasons">
              <h3>{{ i18n.l(b.name) }}</h3>
              <p>{{ i18n.l(b.description) }}</p>
            </a>
          }
        </div>
      </div>
    </section>

    <section class="section section-tint">
      <div class="container">
        <h2>{{ t('home.lib.title') }}</h2>
        <p class="muted measure">{{ t('home.lib.sub', { n: total }) }}</p>
        <div class="three-col">
          @for (c of classes(); track c.key) {
            <a class="card card-link" routerLink="/diseases" [queryParams]="{ group: c.key }">
              <span class="big-num">{{ c.count }}</span>
              <h3>{{ t('mgmt.' + c.key) }}</h3>
              <p>{{ t('mgmt.' + c.key + '.desc') }}</p>
            </a>
          }
        </div>
      </div>
    </section>
  `,
})
export class HomePage {
  readonly i18n = inject(I18n);
  readonly t = (k: string, p?: Record<string, string | number>) => this.i18n.t(k, p);
  readonly steps = ['1', '2', '3', '4'];
  readonly bahars = BAHARS;
  readonly total = DISEASES.length;
  readonly classes = computed(() =>
    (['established', 'difficult', 'no_cure'] as const).map((key) => ({
      key,
      count: DISEASES.filter((d) => d.mgmt === key).length,
    })),
  );
}
