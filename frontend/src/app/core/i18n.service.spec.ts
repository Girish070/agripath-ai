import { TestBed } from '@angular/core/testing';
import { I18n } from './i18n.service';
import { EN } from './ui-strings.en';
import { MR } from './ui-strings.mr';
import { L } from '../data/types';

describe('I18n', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('defaults to English and translates a key', () => {
    const i18n = TestBed.inject(I18n);
    expect(i18n.lang()).toBe('en');
    expect(i18n.t('cta.detect')).toBe('Detect Orange Disease');
  });

  it('switches to Marathi, persists the choice and updates <html lang>', async () => {
    const i18n = TestBed.inject(I18n);
    i18n.set('mr');
    TestBed.tick();
    expect(i18n.t('cta.detect')).toBe('संत्र्याचा रोग ओळखा');
    expect(localStorage.getItem('agripath.lang')).toBe('mr');
    expect(document.documentElement.lang).toBe('mr');
  });

  it('restores the stored language on a fresh load', () => {
    localStorage.setItem('agripath.lang', 'mr');
    expect(TestBed.inject(I18n).lang()).toBe('mr');
  });

  it('substitutes {placeholders} and falls back to the key for unknown keys', () => {
    const i18n = TestBed.inject(I18n);
    expect(i18n.t('home.lib.sub', { n: 13 })).toContain('13 citrus conditions');
    expect(i18n.t('does.not.exist')).toBe('does.not.exist');
  });

  it('picks the right side of a bilingual pair', () => {
    const i18n = TestBed.inject(I18n);
    const x = L('Leaf', 'पान');
    expect(i18n.l(x)).toBe('Leaf');
    i18n.set('mr');
    expect(i18n.l(x)).toBe('पान');
  });

  it('has a non-empty Marathi string for every English key and keeps placeholders intact', () => {
    for (const key of Object.keys(EN) as (keyof typeof EN)[]) {
      expect(MR[key], key).toBeTruthy();
      const ph = (EN[key].match(/\{\w+\}/g) ?? []).sort();
      const phMr = (MR[key].match(/\{\w+\}/g) ?? []).sort();
      expect(phMr, `placeholders of ${key}`).toEqual(ph);
    }
  });
});
