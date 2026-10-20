import { Injectable, effect, signal } from '@angular/core';
import { L, Lang } from '../data/types';
import { EN, MR } from './ui-strings';

const KEY = 'agripath.lang';

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'en' || stored === 'mr') return stored;
  } catch {
    /* storage may be blocked; fall through */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('mr') ? 'mr' : 'en';
}

/**
 * Local-first localisation. Every string ships inside the app, so the site
 * works with no translation API. Scientific names, units and safety text are
 * authored per language - never machine-translated at runtime.
 */
@Injectable({ providedIn: 'root' })
export class I18n {
  readonly lang = signal<Lang>(initialLang());

  constructor() {
    effect(() => {
      const l = this.lang();
      if (typeof document !== 'undefined') document.documentElement.lang = l;
      try {
        localStorage.setItem(KEY, l);
      } catch {
        /* ignore */
      }
    });
  }

  set(l: Lang): void {
    this.lang.set(l);
  }

  /** UI string by key, with {placeholder} substitution. Falls back to English, then the key. */
  t(key: string, params?: Record<string, string | number>): string {
    const dict = (this.lang() === 'mr' ? MR : EN) as Record<string, string>;
    let s = dict[key] ?? (EN as Record<string, string>)[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
    return s;
  }

  /** Pick the current language from a bilingual pair. */
  l(x: L | undefined): string {
    return x ? x[this.lang()] || x.en : '';
  }
}
