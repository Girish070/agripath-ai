import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../core/i18n.service';
import { BAHARS, Bahar } from '../data/bahar';
import { DISEASE_BY_ID } from '../data/diseases';
import { FRUIT_GALLERY, ORCHARD_GALLERY, SEASON_SLOTS } from '../data/gallery';
import { ImageSlotComponent } from '../shared/image-slot';

@Component({
  selector: 'app-seasons',
  imports: [RouterLink, ImageSlotComponent],
  template: `
    <section class="section">
      <div class="container">
        <h1>{{ t('sea.h1') }}</h1>
        <p class="lead measure">{{ t('sea.lead') }}</p>
        <div class="callout callout-info measure"><p>{{ t('sea.indicative') }}</p></div>

        <h2>{{ t('sea.timeline') }}</h2>
        <div class="timeline-wrap" role="group" [attr.aria-label]="t('sea.timeline')">
          <div class="timeline">
            <div class="tl-head">
              <span></span>
              @for (m of months; track m) {<span class="tl-month">{{ t('month.' + m) }}</span>}
            </div>
            @for (b of bahars; track b.id) {
              <div class="tl-row">
                <span class="tl-label">{{ i18n.l(b.name) }}</span>
                @for (m of monthIdx; track m) {
                  <span class="tl-cell" [class]="phase(b, m)" [attr.title]="phaseLabel(b, m)"></span>
                }
              </div>
            }
          </div>
        </div>
        <ul class="legend">
          <li><span class="swatch flow"></span>{{ t('sea.flowering') }}</li>
          <li><span class="swatch dev"></span>{{ t('sea.development') }}</li>
          <li><span class="swatch harv"></span>{{ t('sea.harvest') }}</li>
        </ul>
        <p class="muted small measure">{{ t('sea.source') }}</p>

        <div class="two-col">
          @for (b of bahars; track b.id) {
            <article class="card">
              <h2 class="h3">{{ i18n.l(b.name) }} <span class="muted">· {{ i18n.l(b.tagline) }}</span></h2>
              <p>{{ i18n.l(b.description) }}</p>
              <h3 class="h4">{{ t('sea.watch') }}</h3>
              <ul class="bullets">
                @for (w of b.watch; track $index) {
                  <li>
                    {{ i18n.l(w.text) }}
                    <span class="chips">
                      @for (id of w.diseases; track id) {
                        <a class="chip chip-link" [routerLink]="['/diseases', id]">{{ i18n.l(disease(id).name) }}</a>
                      }
                    </span>
                  </li>
                }
              </ul>
            </article>
          }
        </div>
        <div class="callout measure"><p>{{ t('sea.nopersonal') }}</p></div>

        <h2>{{ t('sea.region.title') }}</h2>
        <div class="card measure">
          <p>{{ t('sea.region.p1') }}</p>
          <p><strong>22,492 ha</strong> - {{ t('sea.region.area') }}</p>
          <p class="muted small">{{ t('sea.region.caveat') }}</p>
        </div>

        <h2>{{ t('gallery.fruit') }}</h2>
        <div class="gallery">
          @for (g of fruit; track g.file) {<app-image-slot [src]="g.file" [caption]="i18n.l(g.caption)" [credit]="g.credit" />}
        </div>
        <h2>{{ t('gallery.orchard') }}</h2>
        <div class="gallery">
          @for (g of orchard; track g.file) {<app-image-slot [src]="g.file" [caption]="i18n.l(g.caption)" [credit]="g.credit" />}
          @for (s of slots; track s.file) {<app-image-slot [src]="s.file" [caption]="i18n.l(s.caption)" [hint]="s.hint" />}
        </div>
        <p class="muted small measure">{{ t('gallery.note') }}</p>
      </div>
    </section>
  `,
})
export class SeasonsPage {
  readonly i18n = inject(I18n);
  readonly t = (k: string) => this.i18n.t(k);
  readonly bahars = BAHARS;
  readonly fruit = FRUIT_GALLERY;
  readonly orchard = ORCHARD_GALLERY;
  readonly slots = SEASON_SLOTS;
  readonly months = Array.from({ length: 12 }, (_, i) => i + 1);
  /** Mrig Bahar runs past December, so the grid covers 12 months and wrapped months fold back. */
  readonly monthIdx = this.months;
  readonly disease = (id: string) => DISEASE_BY_ID[id];

  private within(r: [number, number], m: number): boolean {
    return (m >= r[0] && m <= r[1]) || (m + 12 >= r[0] && m + 12 <= r[1]);
  }

  phase(b: Bahar, m: number): string {
    if (this.within(b.flowering, m)) return 'tl-cell flow';
    if (this.within(b.harvest, m)) return 'tl-cell harv';
    if (this.within(b.development, m)) return 'tl-cell dev';
    return 'tl-cell';
  }

  phaseLabel(b: Bahar, m: number): string {
    const p = this.phase(b, m);
    return p.includes('flow') ? this.t('sea.flowering') : p.includes('harv') ? this.t('sea.harvest') : p.includes('dev') ? this.t('sea.development') : '';
  }
}
