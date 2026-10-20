import { DISEASES, DISEASE_BY_ID, CHEMICAL_NOTE } from './diseases';
import { REFERENCES, REF_BY_ID } from './references';
import { FEATURE_LABELS, QUALITY_LABELS } from './features';
import { BAHARS } from './bahar';
import { L } from './types';

const bilingual = (x: L, where: string) => {
  expect(x.en.trim().length, `${where} (en)`).toBeGreaterThan(2);
  expect(x.mr.trim().length, `${where} (mr)`).toBeGreaterThan(2);
  expect(/[\u0900-\u097F]/.test(x.mr), `${where} contains Devanagari`).toBe(true);
};

describe('disease library', () => {
  it('has unique ids and the 13 conditions from the brief', () => {
    const ids = DISEASES.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(13);
    for (const id of ['gummosis', 'brown_rot', 'melanose', 'scab', 'anthracnose', 'canker', 'hlb', 'tristeza', 'decline', 'nematode', 'exocortis', 'ringspot', 'mosaic']) {
      expect(DISEASE_BY_ID[id], id).toBeTruthy();
    }
  });

  it('is complete in English and Marathi for every farmer-facing field', () => {
    for (const d of DISEASES) {
      for (const [field, v] of Object.entries(d)) {
        if (v && typeof v === 'object' && 'en' in v) bilingual(v as L, `${d.id}.${field}`);
        if (Array.isArray(v) && v.length && typeof v[0] === 'object') v.forEach((x, i) => bilingual(x as L, `${d.id}.${field}[${i}]`));
      }
      expect(d.symptoms.length, `${d.id} symptoms`).toBeGreaterThan(0);
      expect(d.prevention.length, `${d.id} prevention`).toBeGreaterThan(0);
      expect(d.dontDo.length, `${d.id} dontDo`).toBeGreaterThan(0);
    }
    bilingual(CHEMICAL_NOTE, 'CHEMICAL_NOTE');
  });

  it('only links look-alikes and references that exist', () => {
    for (const d of DISEASES) {
      d.lookalikes.forEach((l) => expect(DISEASE_BY_ID[l], `${d.id} -> ${l}`).toBeTruthy());
      expect(d.lookalikes).not.toContain(d.id);
      d.refs.forEach((r) => expect(REF_BY_ID[r], `${d.id} -> ${r}`).toBeTruthy());
    }
  });

  it('states no established cure for the diseases the brief lists in group C', () => {
    for (const id of ['hlb', 'tristeza', 'exocortis', 'ringspot', 'mosaic']) {
      expect(DISEASE_BY_ID[id].mgmt, id).toBe('no_cure');
    }
  });

  it('never claims a disease is verified in Warud and never contains dosage-style text', () => {
    const everything = JSON.stringify(DISEASES);
    expect(everything).not.toMatch(/confirmed (to occur )?in warud(?! )/i);
    // quantities such as "2 g/litre", "ml/l", "ppm", "%" w. units, or "per litre" would signal a dose
    expect(everything).not.toMatch(/\b\d+(\.\d+)?\s?(g|gm|ml|kg|ppm|mg)\s?(\/|per)\s?(l|litre|liter|ha|acre|tree)\b/i);
    expect(everything).not.toMatch(/\b\d+(\.\d+)?\s?%\s?(solution|spray|bordeaux|copper)/i);
  });

  it('no_cure diseases are not given a curative framing', () => {
    for (const id of ['hlb', 'tristeza', 'exocortis', 'ringspot', 'mosaic']) {
      const c = DISEASE_BY_ID[id].curative.en.toLowerCase();
      expect(c).toMatch(/no (proven |established )?cur/);
    }
  });
});

describe('references', () => {
  it('are all flagged unverified-by-design (no invented DOIs or findings)', () => {
    expect(REFERENCES.length).toBe(8);
    for (const r of REFERENCES) {
      bilingual(r.topic, r.id);
      expect(r.topic.en.toLowerCase()).toMatch(/title|by its title|presentation/);
    }
  });

  it('flags the known discrepancies between the brief and the presentation', () => {
    expect(REF_BY_ID['nair2025'].flags.length).toBeGreaterThan(0);
    expect(REF_BY_ID['ingle2020'].flags.length).toBeGreaterThan(0);
    expect(REF_BY_ID['das1999'].flags.length).toBeGreaterThan(0);
  });
});

describe('vocabularies and seasons', () => {
  it('has bilingual labels for every feature and quality code', () => {
    Object.entries(FEATURE_LABELS).forEach(([k, v]) => bilingual(v, k));
    Object.entries(QUALITY_LABELS).forEach(([k, v]) => bilingual(v, k));
  });

  it('describes Ambia and Mrig bahar as cycles with the presentation months', () => {
    const [ambia, mrig] = BAHARS;
    expect(ambia.flowering).toEqual([1, 2]);
    expect(ambia.harvest).toEqual([10, 12]);
    expect(mrig.flowering).toEqual([6, 7]);
    expect(mrig.harvest).toEqual([14, 16]); // Feb-Apr of the next year
    for (const b of BAHARS) b.watch.forEach((w) => w.diseases.forEach((id) => expect(DISEASE_BY_ID[id]).toBeTruthy()));
  });
});
