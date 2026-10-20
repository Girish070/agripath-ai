import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../core/i18n.service';
import { DISEASE_BY_ID } from '../data/diseases';
import { diseasePhoto } from '../data/gallery';
import { AdvisoryComponent } from '../shared/advisory';
import { ImageSlotComponent } from '../shared/image-slot';

@Component({
  selector: 'app-disease-detail',
  imports: [RouterLink, AdvisoryComponent, ImageSlotComponent],
  template: `
    <section class="section">
      <div class="container narrow">
        <a class="back" routerLink="/diseases">‹ {{ t('lib.back') }}</a>
        @if (disease(); as d) {
          <h1>{{ i18n.l(d.name) }}</h1>
          <div class="callout callout-info"><p>{{ t('lib.profile_note') }}</p></div>
          <app-image-slot [src]="photo()" [caption]="i18n.l(d.name)" [hint]="'public/' + photo()" />
          <p class="muted small">{{ t('gallery.disease_rule') }}</p>
          <app-advisory [disease]="d" mode="library">
            <div class="btn-row">
              <a class="btn btn-primary" routerLink="/detect">{{ t('cta.detect') }}</a>
              <a class="btn btn-secondary" routerLink="/seasons">{{ t('nav.seasons') }}</a>
            </div>
          </app-advisory>
        } @else {
          <h1>{{ t('lib.notfound') }}</h1>
          <a class="btn btn-primary" routerLink="/diseases">{{ t('lib.back') }}</a>
        }
      </div>
    </section>
  `,
})
export class DiseaseDetailPage {
  readonly i18n = inject(I18n);
  readonly t = (k: string) => this.i18n.t(k);
  /** Route parameter :id (bound by withComponentInputBinding). */
  readonly id = input.required<string>();
  readonly disease = computed(() => DISEASE_BY_ID[this.id()]);
  readonly photo = computed(() => diseasePhoto(this.id() as never));
}
