import { L } from './types';
import { DiseaseId } from './diseases';

/**
 * Ambia Bahar and Mrig Bahar are flowering/production CYCLES of the same crop,
 * not different orange species or varieties.
 *
 * Month ranges below come from the project presentation (slide 3), which cites
 * Huchche et al. (1996) for flowering response. They are INDICATIVE only: real
 * timing varies with weather, irrigation and orchard practice. The
 * "fruit development" span is simply the period between flowering and the
 * typical harvest window (derived, not separately sourced).
 * Months are numbered 1 (Jan) to 12 (Dec).
 */
export interface Bahar {
  id: 'ambia' | 'mrig';
  name: L;
  tagline: L;
  flowering: [number, number];
  development: [number, number];
  harvest: [number, number];
  /** True when a phase wraps past December into the next year. */
  wraps: { development?: boolean; harvest?: boolean };
  description: L;
  watch: { text: L; diseases: DiseaseId[] }[];
}

export const BAHARS: Bahar[] = [
  {
    id: 'ambia',
    name: L('Ambia Bahar', 'आंबिया बहार'),
    tagline: L('Spring blossom crop', 'वसंत ऋतूतील फुलोऱ्याचा बहार'),
    flowering: [1, 2],
    development: [3, 9],
    harvest: [10, 12],
    wraps: {},
    description: L(
      'Flowering around January–February, with fruit usually harvested around October–December of the same year.',
      'जानेवारी–फेब्रुवारीच्या सुमारास फुलोरा; फळांची काढणी साधारणतः त्याच वर्षीच्या ऑक्टोबर–डिसेंबरमध्ये.',
    ),
    watch: [
      {
        text: L('Young flush and fruit set: watch for melanose, scab and anthracnose spotting, especially after rain.', 'नवीन फूट व फळधारणा: विशेषतः पावसानंतर मेलॅनोज, स्कॅब व करपा ठिपक्यांवर लक्ष ठेवा.'),
        diseases: ['melanose', 'scab', 'anthracnose'],
      },
      {
        text: L('Monsoon months with fruit developing: check drainage, trunk bases and low fruit.', 'फळवाढीच्या काळात पावसाळा: निचरा, खोडाचे तळ व खालची फळे तपासा.'),
        diseases: ['gummosis', 'brown_rot'],
      },
      {
        text: L('Before harvest: remove fallen or rotting fruit and inspect fruit for blemishes.', 'काढणीपूर्वी: गळलेली/सडलेली फळे काढा व फळांवरील डाग तपासा.'),
        diseases: ['brown_rot', 'canker'],
      },
    ],
  },
  {
    id: 'mrig',
    name: L('Mrig Bahar', 'मृग बहार'),
    tagline: L('Monsoon blossom crop', 'पावसाळ्यातील फुलोऱ्याचा बहार'),
    flowering: [6, 7],
    development: [8, 13],
    harvest: [14, 16],
    wraps: { development: true, harvest: true },
    description: L(
      'Flowering around June–July at the start of the monsoon, with fruit usually harvested around February–April of the next year.',
      'पावसाळ्याच्या सुरुवातीला जून–जुलैच्या सुमारास फुलोरा; फळांची काढणी साधारणतः पुढील वर्षीच्या फेब्रुवारी–एप्रिलमध्ये.',
    ),
    watch: [
      {
        text: L('Flowering and fruit set happen in wet weather: watch drainage, trunk bases and low fruit for Phytophthora problems.', 'फुलोरा व फळधारणा ओल्या हवामानात होते: फायटोफ्थोरा समस्यांसाठी निचरा, खोडाचे तळ व खालची फळे तपासा.'),
        diseases: ['gummosis', 'brown_rot'],
      },
      {
        text: L('Young flush in the rains: watch for spotting diseases and, in particular, canker spread by wind-driven rain.', 'पावसातील नवीन फूट: ठिपक्यांचे रोग व विशेषतः वाऱ्यासह पावसाने पसरणाऱ्या कँकरवर लक्ष ठेवा.'),
        diseases: ['canker', 'scab', 'melanose'],
      },
      {
        text: L('Monsoon fruit disorders: the supplied research links the greening bacterium to a fruit disorder in monsoon cropping, so report misshapen fruit to an expert.', 'पावसाळी फळविकृती: पुरवलेल्या संशोधनात पावसाळी बहारातील फळविकृतीचा ग्रीनिंग जीवाणूशी संबंध नमूद आहे; विकृत फळे तज्ज्ञांना दाखवा.'),
        diseases: ['hlb'],
      },
    ],
  },
];
