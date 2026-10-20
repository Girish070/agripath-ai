import { L } from './types';

/**
 * Research library.
 *
 * HONESTY RULES applied here:
 *  - Bibliographic details are exactly as supplied in the project presentation / brief.
 *  - NONE of these have been independently verified (no access to publisher sites
 *    from the build environment), so every entry has status "unverified".
 *  - `topic` describes only what the TITLE says. Findings were NOT extracted
 *    because the full texts were not read. No result, dose or percentage is
 *    attributed to any paper.
 *  - Discrepancies between the brief and the presentation are listed in `flags`.
 */
export interface Reference {
  id: string;
  authors: string;
  year: number;
  title: string;
  venue: string;
  details: string;
  link?: string; // exactly as supplied; not verified
  topic: L;
  flags: L[];
}

export const REFERENCES: Reference[] = [
  {
    id: 'wagh2018',
    authors: 'Wagh, S. P., Gade, R. M., & Lad, R. S.',
    year: 2018,
    title: 'Survey on Phytophthora diseases in Nagpur Mandarin',
    venue: 'Journal of Plant Disease Sciences',
    details: '13(1), 32–35',
    link: 'indianjournals.com/article/jpds-13-1-007',
    topic: L(
      'By its title: a survey of Phytophthora-related diseases in Nagpur Mandarin.',
      'शीर्षकानुसार: नागपुरी संत्र्यातील फायटोफ्थोरा रोगांचे सर्वेक्षण.',
    ),
    flags: [],
  },
  {
    id: 'ingle2023',
    authors: 'Ingle, Y. V., Paithankar, D. H., Paulkar, P. K., & Giri, M. D.',
    year: 2023,
    title: 'Management of Phytophthora root rot and gummosis in Nagpur mandarin',
    venue: 'Journal of Plant Disease Sciences',
    details: '18(2), 121–124',
    link: 'doi:10.48165/jpds.2023.1802.11',
    topic: L(
      'By its title: management of Phytophthora root rot and gummosis in Nagpur Mandarin.',
      'शीर्षकानुसार: नागपुरी संत्र्यातील फायटोफ्थोरा मूळकूज व डिंक्या रोगाचे व्यवस्थापन.',
    ),
    flags: [],
  },
  {
    id: 'ingle2020',
    authors: 'Ingle, Y. V., Paithankar, D. H., Sadawarte, A. K., & Bhonde, S. R.',
    year: 2020,
    title:
      'Evaluation of potassium salt of phosphonic acid in Nagpur mandarin with special reference to Phytophthora management',
    venue: 'Journal of Horticultural Sciences',
    details: '15(2), 153–160',
    link: 'doi:10.24154/jhs.v15i2.943',
    topic: L(
      'By its title: evaluation of a potassium salt of phosphonic acid for Phytophthora management in Nagpur Mandarin.',
      'शीर्षकानुसार: नागपुरी संत्र्यात फायटोफ्थोरा नियंत्रणासाठी फॉस्फोनिक आम्लाच्या पोटॅशियम क्षाराचे मूल्यमापन.',
    ),
    flags: [
      L(
        'The brief gives no page range; the presentation gives 153–160. Confirm against the publisher record.',
        'सूचनेत पृष्ठ क्रमांक नाहीत; सादरीकरणात 153–160 आहेत. प्रकाशकाच्या नोंदीशी पडताळा करा.',
      ),
    ],
  },
  {
    id: 'gade2012',
    authors: 'Gade, R. M., & Koche, M. D.',
    year: 2012,
    title: 'Integrated disease management for root rot and gummosis in Nagpur mandarin',
    venue: 'Indian Phytopathology',
    details: '65(3), 272–275',
    topic: L(
      'By its title: integrated management of root rot and gummosis in Nagpur Mandarin.',
      'शीर्षकानुसार: नागपुरी संत्र्यातील मूळकूज व डिंक्या रोगाचे एकात्मिक व्यवस्थापन.',
    ),
    flags: [
      L(
        'No DOI or official link was supplied (the presentation only notes a ResearchGate record).',
        'DOI किंवा अधिकृत दुवा दिलेला नाही (सादरीकरणात फक्त ResearchGate नोंद आहे).',
      ),
    ],
  },
  {
    id: 'gade2005',
    authors: 'Gade, R. M., Sangle, U. R., Singh, R. V., & Bambawale, O. M.',
    year: 2005,
    title: 'Evaluation of different mandarin varieties for resistance to prominent diseases of citrus',
    venue: 'Annals of Plant Protection Sciences',
    details: '13(1), 156–158',
    link: 'indianjournals.com/article/apps-13-1-035',
    topic: L(
      'By its title: resistance of different mandarin varieties to prominent citrus diseases.',
      'शीर्षकानुसार: संत्र्याच्या विविध जातींची प्रमुख रोगांविरुद्धची प्रतिकारशक्ती.',
    ),
    flags: [
      L(
        'The presentation prints “Orange” where the published title most likely reads “Citrus”; verify the exact title.',
        'सादरीकरणात “Orange” असे छापले आहे; प्रकाशित शीर्षकात बहुधा “Citrus” असेल. अचूक शीर्षक तपासा.',
      ),
    ],
  },
  {
    id: 'das1999',
    authors: 'Das, A. K., & Singh, S.',
    year: 1999,
    title: 'Distribution of citrus greening disease in Marathwada region of Maharashtra',
    venue: 'Indian Phytopathology',
    details: '52(3), 281–282',
    link: 'epubs.icar.org.in/index.php/IPPJ/article/view/19531',
    topic: L(
      'By its title: distribution of citrus greening (HLB) in the Marathwada region of Maharashtra.',
      'शीर्षकानुसार: महाराष्ट्रातील मराठवाडा विभागातील सिट्रस ग्रीनिंग (HLB) चा प्रसार.',
    ),
    flags: [
      L(
        'Marathwada is a different region from Warud (Vidarbha). Not evidence of HLB in Warud. The presentation prints “Orange greening”; verify the exact title.',
        'मराठवाडा हा वरूड (विदर्भ) पेक्षा वेगळा विभाग आहे. वरूडमध्ये HLB असल्याचा पुरावा नाही. शीर्षक तपासा.',
      ),
    ],
  },
  {
    id: 'nair2025',
    authors: 'Nair, R., & Jyothsna, J.',
    year: 2025,
    title:
      'Association of greening bacterium with fruit disorder “Waywar” in monsoon cropping of Nagpur Mandarin',
    venue: 'Israel Journal of Plant Sciences',
    details: '72(1–2)',
    topic: L(
      'By its title: association of the greening bacterium with the fruit disorder “Waywar” in monsoon-season Nagpur Mandarin cropping.',
      'शीर्षकानुसार: नागपुरी संत्र्याच्या पावसाळी (मृग) हंगामातील “वायवर” फळविकृतीशी ग्रीनिंग जीवाणूचा संबंध.',
    ),
    flags: [
      L(
        'The brief says “fruit morphological disorder”; the presentation says “fruit disorder”. DOI/pages not supplied. Verify the exact title with the publisher.',
        'सूचनेत “fruit morphological disorder” तर सादरीकरणात “fruit disorder” आहे. DOI/पृष्ठे दिलेली नाहीत. अचूक शीर्षक प्रकाशकाकडून तपासा.',
      ),
    ],
  },
  {
    id: 'huchche1996',
    authors: 'Huchche, A. D., Dass, H. C., Kohli, R. R., & Srivastava, A. K.',
    year: 1996,
    title: 'Leaf NH₃–NH₄⁺ content and flowering response in Nagpur Mandarin',
    venue: 'Indian Journal of Horticulture',
    details: '53(3), 163–165',
    topic: L(
      'By its title: leaf ammonia/ammonium content and flowering response in Nagpur Mandarin. Cited in the presentation for seasonal flowering context only.',
      'शीर्षकानुसार: नागपुरी संत्र्यातील पानांतील अमोनिया/अमोनियम प्रमाण व फुलोऱ्याचा प्रतिसाद. सादरीकरणात फक्त हंगामी फुलोऱ्याच्या संदर्भासाठी वापरले आहे.',
    ),
    flags: [
      L(
        'Appears only in the presentation (not in the brief’s list).',
        'हा संदर्भ फक्त सादरीकरणात आहे (सूचनेतील यादीत नाही).',
      ),
    ],
  },
];

export const REF_BY_ID: Record<string, Reference> = Object.fromEntries(REFERENCES.map((r) => [r.id, r]));
