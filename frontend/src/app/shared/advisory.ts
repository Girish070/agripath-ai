import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../core/i18n.service';
import { CHEMICAL_NOTE, DISEASE_BY_ID, Disease } from '../data/diseases';
import { REF_BY_ID } from '../data/references';

/**
 * The treatment-and-prevention advisory for ONE disease profile, organised
 * exactly like the project brief (A-F). It is used both on the AI result page
 * and on each disease-library page, so the facts are identical in both.
 */
@Component({
  selector: 'app-advisory',
  imports: [RouterLink],
  template: `
    @let d = disease();
    <div class="advisory">
      <section class="adv-section">
        <h3>{{ t('adv.a.title') }}</h3>
        <p>{{ i18n.l(d.summary) }}</p>
        @if (mode() === 'result') {
          <p class="muted">{{ t('adv.a.uncertain') }}</p>
        }
        <dl class="facts">
          <div><dt>{{ t('adv.scientific') }}</dt><dd><em>{{ d.scientific }}</em></dd></div>
          <div><dt>{{ t('adv.class') }}</dt><dd><span class="badge" [class]="mgmtBadge()">{{ t('mgmt.' + d.mgmt) }}</span></dd></div>
          <div>
            <dt>{{ t('adv.parts') }}</dt>
            <dd>
              @for (p of d.parts; track p) {<span class="chip">{{ t('part.' + p) }}</span>}
            </dd>
          </div>
          <div><dt>{{ t('adv.cure') }}</dt><dd>{{ i18n.l(d.curative) }}</dd></div>
        </dl>
      </section>

      <section class="adv-section">
        <h3>{{ t('adv.b.title') }}</h3>
        <p class="muted">{{ t('adv.b.intro') }}</p>
        <ul class="bullets">
          @for (s of d.symptoms; track $index) {<li>{{ i18n.l(s) }}</li>}
        </ul>
        <h4>{{ t('adv.spread') }}</h4>
        <ul class="bullets">
          @for (s of d.spread; track $index) {<li>{{ i18n.l(s) }}</li>}
        </ul>
        <p><strong>{{ t('adv.conditions') }}:</strong> {{ i18n.l(d.conditions) }}</p>
        @if (lookalikes().length) {
          <h4>{{ t('adv.lookalikes') }}</h4>
          <div class="chips">
            @for (o of lookalikes(); track o.id) {
              <a class="chip chip-link" [routerLink]="['/diseases', o.id]">{{ i18n.l(o.name) }}</a>
            }
          </div>
        }
      </section>

      <section class="adv-section">
        <h3>{{ t('adv.c.title') }}</h3>
        <ul class="bullets">
          @for (c of d.checks; track $index) {<li>{{ i18n.l(c) }}</li>}
          <li>{{ t('adv.c.neighbours') }}</li>
          <li>{{ t('adv.c.photos') }}</li>
          <li>{{ t('adv.c.drainage') }}</li>
        </ul>
      </section>

      <section class="adv-section">
        <h3>{{ t('adv.d.title') }}</h3>
        <h4>{{ t('adv.prevention') }}</h4>
        <ul class="bullets">
          @for (p of d.prevention; track $index) {<li>{{ i18n.l(p) }}</li>}
        </ul>
        <h4>{{ t('adv.management') }}</h4>
        <ul class="bullets">
          @for (m of d.management; track $index) {<li>{{ i18n.l(m) }}</li>}
        </ul>
        <div class="callout callout-warn" role="note">
          <strong>{{ t('adv.chem.title') }}</strong>
          <p>{{ i18n.l(chem) }}</p>
        </div>
      </section>

      <section class="adv-section">
        <h3>{{ t('adv.e.title') }}</h3>
        <ul class="bullets bullets-no">
          @for (x of d.dontDo; track $index) {<li>{{ i18n.l(x) }}</li>}
        </ul>
      </section>

      <section class="adv-section">
        <h3>{{ t('adv.f.title') }}</h3>
        <div class="callout" [class.callout-warn]="d.expertStrong" [class.callout-info]="!d.expertStrong">
          <strong>{{ d.expertStrong ? t('adv.expert.strong') : t('adv.expert.normal') }}</strong>
          <p>{{ i18n.l(d.expertNote) }}</p>
        </div>
        <ng-content />
      </section>

      <section class="adv-section">
        <h3>{{ t('adv.evidence.title') }}</h3>
        <p><span class="badge badge-grey">{{ t('scope.' + d.scope) }}</span> {{ i18n.l(d.scopeNote) }}</p>
        <p class="muted">{{ t('adv.evidence.warud') }}</p>
        @if (d.refs.length) {
          <ul class="bullets">
            @for (id of d.refs; track id) {
              <li>
                <a [routerLink]="['/research']" [fragment]="id">{{ ref(id).authors }} ({{ ref(id).year }}). {{ ref(id).title }}.</a>
                <span class="muted"> {{ t('adv.evidence.unverified') }}</span>
              </li>
            }
          </ul>
        } @else {
          <p class="muted">{{ t('adv.evidence.noref') }}</p>
        }
      </section>
    </div>
  `,
})
export class AdvisoryComponent {
  readonly i18n = inject(I18n);
  readonly disease = input.required<Disease>();
  readonly mode = input<'result' | 'library'>('library');
  readonly chem = CHEMICAL_NOTE;

  readonly lookalikes = computed(() => this.disease().lookalikes.map((id) => DISEASE_BY_ID[id]).filter(Boolean));
  readonly mgmtBadge = computed(() => ({ established: 'badge-green', difficult: 'badge-amber', no_cure: 'badge-red' })[this.disease().mgmt]);

  readonly t = (k: string) => this.i18n.t(k);
  readonly ref = (id: string) => REF_BY_ID[id];
}
