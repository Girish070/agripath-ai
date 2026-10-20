import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../core/i18n.service';
import { DISEASES } from '../data/diseases';
import { REFERENCES } from '../data/references';

@Component({
  selector: 'app-research',
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="container narrow">
        <h1>{{ t('res_lib.h1') }}</h1>
        <p class="lead">{{ t('res_lib.lead') }}</p>
        <div class="callout callout-warn"><strong>{{ t('res_lib.status.t') }}</strong><p>{{ t('res_lib.status.d') }}</p></div>

        <h2>{{ t('res_lib.scope.t') }}</h2>
        <ul class="bullets">
          @for (k of ['1','2','3','4']; track k) {<li>{{ t('res_lib.scope.' + k) }}</li>}
        </ul>

        <h2>{{ t('res_lib.list') }}</h2>
        @for (r of refs; track r.id) {
          <article class="card" [id]="r.id">
            <p class="ref-cite">{{ r.authors }} ({{ r.year }}). <em>{{ r.title }}.</em> {{ r.venue }}, {{ r.details }}.</p>
            @if (r.link) {<p class="small"><strong>{{ t('res_lib.link') }}:</strong> <code>{{ r.link }}</code></p>}
            <p class="small">{{ i18n.l(r.topic) }}</p>
            <p class="small"><span class="badge badge-grey">{{ t('res_lib.unverified') }}</span> {{ t('res_lib.nofindings') }}</p>
            @for (f of r.flags; track $index) {<p class="small flag">⚑ {{ i18n.l(f) }}</p>}
            @if (usedBy(r.id).length) {
              <p class="small">{{ t('res_lib.used') }}:
                @for (d of usedBy(r.id); track d.id) {<a class="chip chip-link" [routerLink]="['/diseases', d.id]">{{ i18n.l(d.name) }}</a>}
              </p>
            }
          </article>
        }

        <h2>{{ t('res_lib.more.t') }}</h2>
        <p>{{ t('res_lib.more.p') }}</p>
      </div>
    </section>
  `,
})
export class ResearchPage {
  readonly i18n = inject(I18n);
  readonly t = (k: string) => this.i18n.t(k);
  readonly refs = REFERENCES;
  usedBy = (id: string) => DISEASES.filter((d) => d.refs.includes(id));
}
