/** A bilingual text pair. Every farmer-facing string in the knowledge library uses this. */
export interface L {
  en: string;
  mr: string;
}

export const L = (en: string, mr: string): L => ({ en, mr });

export type Lang = 'en' | 'mr';
