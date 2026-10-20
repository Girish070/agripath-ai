import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../core/i18n.service';
import { DISEASES, MgmtClass } from '../data/diseases';

type Filter = 'all' | MgmtClass;

@Component({
  selector: 'app-diseases',
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="container">
        <h1>{{ t('lib.h1') }}</h1>
        <p class="lead measure">{{ t('lib.lead') }}</p>

        <div class="callout callout-info measure"><p>{{ t('lib.scope') }}</p></div>

        <div class="toolbar">
          <label class="field">
            <span class="visually-hidden">{{ t('lib.search') }}</span>
            <input type="search" [placeholder]="t('lib.search')" [value]="query()" (input)="query.set($any($event.target).value)" />
          </label>
          <div class="chips" role="group" [attr.aria-label]="t('lib.filter')">
            @for (f of filters; track f) {
              <button type="button" class="chip chip-btn" [class.on]="filter() === f" [attr.aria-pressed]="filter() === f" (click)="filter.set(f)">
                {{ f === 'all' ? t('lib.all') : t('mgmt.' + f) }}
              </button>
            }
          </div>
        </div>

        <div class="grid-cards">
          @for (d of shown(); track d.id) {
            <a class="card card-link" [routerLink]="['/diseases', d.id]">
              <h2 class="h3">{{ i18n.l(d.name) }}</h2>
              <p class="muted small"><em>{{ d.scientific }}</em></p>
              <p><span class="badge" [class]="badge(d.mgmt)">{{ t('mgmt.' + d.mgmt) }}</span></p>
              <p class="small">{{ i18n.l(d.summary) }}</p>
            </a>
          } @empty {
            <p>{{ t('lib.empty') }}</p>
          }
        </div>
        <p class="muted small measure">{{ t('lib.groups_note') }}</p>
      </div>
    </section>
  `,
})
export class DiseasesPage {
  readonly i18n = inject(I18n);
  readonly t = (k: string) => this.i18n.t(k);
  /** Optional ?group= query parameter (bound by withComponentInputBinding). */
  readonly group = input<string | undefined>(undefined);

  readonly filters: Filter[] = ['all', 'established', 'difficult', 'no_cure'];
  readonly query = signal('');
  /** Writable, but re-seeded from ?group= whenever that parameter changes. */
  readonly filter = linkedSignal<Filter>(() => this.fromQuery());

  private fromQuery(): Filter {
    const g = this.group();
    return g === 'established' || g === 'difficult' || g === 'no_cure' ? g : 'all';
  }

  readonly shown = computed(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filter();
    return DISEASES.filter((d) => (f === 'all' || d.mgmt === f) && (!q || [d.name.en, d.name.mr, d.scientific].join(' ').toLowerCase().includes(q)));
  });

  badge = (m: MgmtClass) => ({ established: 'badge-green', difficult: 'badge-amber', no_cure: 'badge-red' })[m];
}
