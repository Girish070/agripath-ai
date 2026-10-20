import { L } from './types';
import { DiseaseId } from './diseases';

/**
 * EDITABLE gallery. To add or replace a photo, put the file in
 * frontend/public/gallery/ and edit the entry below.
 *
 * RULES: add a disease photo ONLY if a plant pathologist / agriculture expert has
 * confirmed what it shows. Never caption a photo with a different disease.
 * The photos below were supplied by the project team inside the presentation;
 * the original photographer, date, location and licence are NOT known and must
 * be confirmed before public release. The variety is likewise not verified.
 */
export interface GalleryItem {
  file: string | null;
  caption: L;
  credit: string;
}

export const PROVENANCE = 'Supplied in the project presentation; photographer and licence to be confirmed.';

export const FRUIT_GALLERY: GalleryItem[] = [
  { file: 'gallery/ppt-image4.jpg', caption: L('Healthy orange fruit and leaves on the branch', 'फांदीवरील निरोगी संत्री फळे व पाने'), credit: PROVENANCE },
  { file: 'gallery/ppt-image2.jpg', caption: L('Harvested mandarin-type fruit', 'काढलेली मँडारिन प्रकारची फळे'), credit: PROVENANCE },
  { file: 'gallery/ppt-image33.jpg', caption: L('Heap of harvested fruit', 'काढलेल्या फळांचा ढीग'), credit: PROVENANCE },
];

export const ORCHARD_GALLERY: GalleryItem[] = [
  { file: 'gallery/ppt-image27.jpg', caption: L('Orchard rows with fruit on the trees', 'फळांनी लगडलेल्या झाडांच्या बागेतील ओळी'), credit: PROVENANCE },
  { file: 'gallery/ppt-image41.jpg', caption: L('Orchard rows with grass between the trees', 'झाडांमध्ये गवत असलेल्या बागेतील ओळी'), credit: PROVENANCE },
  { file: 'gallery/ppt-image32.jpg', caption: L('Orchard tree carrying fruit', 'फळे असलेले बागेतील झाड'), credit: PROVENANCE },
];

/** Upload-ready slots: drop photos with these names into public/gallery/. */
export const SEASON_SLOTS: { file: string; caption: L; hint: string }[] = [
  { file: 'gallery/ambia-orchard.jpg', caption: L('Ambia Bahar orchard (add a dated photo)', 'आंबिया बहार बाग (तारीख असलेला फोटो जोडा)'), hint: 'public/gallery/ambia-orchard.jpg' },
  { file: 'gallery/mrig-orchard.jpg', caption: L('Mrig Bahar orchard (add a dated photo)', 'मृग बहार बाग (तारीख असलेला फोटो जोडा)'), hint: 'public/gallery/mrig-orchard.jpg' },
];

export const diseasePhoto = (id: DiseaseId): string => `gallery/diseases/${id}.jpg`;
