import { L } from './types';

/**
 * Citrus / Nagpur Mandarin disease library - the SINGLE source of truth for
 * disease information. The library pages, the AI result page and the advisory
 * all read from this one structure, so the same facts appear everywhere.
 *
 * IDs must match backend/taxonomy.go (checked by a unit test).
 *
 * SAFETY RULES for editors of this file:
 *  - Never add a pesticide brand, concentration, dose, mixing ratio or spray schedule.
 *  - Never state that a disease is confirmed in Warud.
 *  - Marathi text is a draft for expert review (see UI banner + docs/).
 */
export type DiseaseId =
  | 'gummosis' | 'brown_rot' | 'melanose' | 'scab' | 'anthracnose'
  | 'canker' | 'hlb' | 'tristeza' | 'decline' | 'nematode'
  | 'exocortis' | 'ringspot' | 'mosaic';

/** Management difficulty class, simplified from the presentation's three groups. */
export type MgmtClass = 'established' | 'difficult' | 'no_cure';
export type Part = 'leaf' | 'fruit' | 'trunk' | 'branch' | 'root' | 'whole_tree';
/** Where the evidence comes from. "Verified in Warud" is deliberately NOT an option. */
export type EvidenceScope = 'nagpur_research' | 'broader_region' | 'general_citrus';

export interface Disease {
  id: DiseaseId;
  name: L;
  scientific: string;
  mgmt: MgmtClass;
  /** The supplied presentation lists these in more than one group. */
  listedInGroups: ('A' | 'B' | 'C')[];
  parts: Part[];
  summary: L;
  symptoms: L[];
  spread: L[];
  conditions: L;
  lookalikes: DiseaseId[];
  checks: L[];
  prevention: L[];
  management: L[];
  curative: L;
  dontDo: L[];
  expertStrong: boolean;
  expertNote: L;
  refs: string[];
  scope: EvidenceScope;
  scopeNote: L;
}

/** Shown wherever chemical control could be inferred. */
export const CHEMICAL_NOTE = L(
  'This app does not give pesticide or fungicide names, doses, mixing ratios or spray schedules. Confirm the diagnosis with a horticulture / plant-protection expert first, then follow current official recommendations and the product label (including protective clothing and waiting periods).',
  'हे अॅप कीटकनाशक/बुरशीनाशकाची नावे, मात्रा, मिश्रण प्रमाण किंवा फवारणी वेळापत्रक देत नाही. आधी कृषी/वनस्पती संरक्षण तज्ज्ञांकडून रोगनिदान निश्चित करा, मग अद्ययावत अधिकृत शिफारशी व औषधाच्या लेबलनुसार (संरक्षक कपडे व प्रतीक्षा कालावधीसह) वापर करा.',
);

export const DISEASES: Disease[] = [
  {
    id: 'gummosis',
    name: L('Gummosis / Foot rot', 'डिंक्या रोग / फूट रॉट (गमोसिस)'),
    scientific: 'Phytophthora spp. (commonly P. nicotianae and P. citrophthora in citrus literature)',
    mgmt: 'established',
    listedInGroups: ['A'],
    parts: ['trunk', 'root', 'whole_tree'],
    summary: L(
      'A bark disease at the trunk base caused by soil-borne Phytophthora. It can girdle the trunk, weaken the whole tree and is closely linked to root rot.',
      'खोडाच्या तळाशी होणारा सालीचा रोग; जमिनीतील फायटोफ्थोरा बुरशीमुळे होतो. खोडाला वेढा पडल्यास संपूर्ण झाड कमजोर होते; मूळकूजशी याचा जवळचा संबंध आहे.',
    ),
    symptoms: [
      L('Gum or resin oozing from bark near the soil line.', 'जमिनीजवळील सालीतून डिंकासारखा स्राव निघणे.'),
      L('Bark darkens, cracks or peels, exposing brown tissue underneath.', 'साल काळपट पडणे, तडकणे किंवा सोलून निघणे; आतील भाग तपकिरी दिसणे.'),
      L('Yellowing, thinning canopy and leaf fall; fewer, smaller fruit.', 'पाने पिवळी पडणे, पर्णसंभार विरळ होणे व पानगळ; फळे कमी व लहान.'),
    ],
    spread: [
      L('Spores in soil and water, splashed onto the trunk base.', 'जमिनीतील व पाण्यातील बीजाणू खोडाच्या तळावर उडून पोहोचतात.'),
      L('Entry through wounds and wet bark.', 'जखमा व ओल्या सालीतून शिरकाव.'),
    ],
    conditions: L(
      'Waterlogged or poorly drained soil, irrigation water touching the trunk, a low bud union, and prolonged wetness.',
      'पाणी साचणारी किंवा निचरा कमी असलेली जमीन, खोडाला स्पर्श करणारे सिंचन, कमी उंचीवरील कलम जोड व दीर्घकाळ ओलावा.',
    ),
    lookalikes: ['decline', 'nematode', 'hlb'],
    checks: [
      L('Look at the whole trunk base and the soil line, not only the leaves.', 'फक्त पानेच नव्हे तर संपूर्ण खोडाचा तळ व जमिनीलगतचा भाग तपासा.'),
      L('Check whether water stands around the tree after irrigation or rain.', 'सिंचन किंवा पावसानंतर झाडाभोवती पाणी साचते का ते पहा.'),
    ],
    prevention: [
      L('Plant on well-drained soil and keep the bud union well above the soil level.', 'निचऱ्याच्या जमिनीत लागवड करा व कलम जोड जमिनीपासून पुरेसा वर ठेवा.'),
      L('Irrigate so that water does not wet or pool around the trunk.', 'पाणी खोडाला लागणार नाही व साचणार नाही अशा पद्धतीने सिंचन करा.'),
      L('Avoid wounding the trunk with tools, weeders or tying material.', 'अवजारे, खुरपणी किंवा बांधणीमुळे खोडाला जखम होऊ देऊ नका.'),
      L('Ask your nursery or horticulture officer about suitable rootstocks.', 'योग्य खुंटाबद्दल रोपवाटिका किंवा फलोत्पादन अधिकाऱ्यांना विचारा.'),
    ],
    management: [
      L('Fix drainage and keep the trunk base clean and dry first - this is the foundation of all other measures.', 'आधी निचरा सुधारा व खोडाचा तळ स्वच्छ व कोरडा ठेवा - इतर सर्व उपायांचा हा पाया आहे.'),
      L('Treatment of the bark lesion (cleaning the affected bark and protecting the cut) should be done as advised by a horticulture / plant-protection officer.', 'सालीवरील जखमेवरील उपचार (बाधित साल स्वच्छ करणे व जखम संरक्षित करणे) फलोत्पादन/वनस्पती संरक्षण अधिकाऱ्याच्या सल्ल्यानुसारच करा.'),
      L('Nagpur Mandarin research listed in the Research page studies fungicide-based and integrated management of Phytophthora root rot and gummosis (by their titles). Product, dose and timing are not reproduced here - use the papers, current official advice and the label with an expert.', 'संशोधन पानावरील नागपुरी संत्र्यावरील अभ्यास (शीर्षकानुसार) फायटोफ्थोरा मूळकूज व डिंक्या रोगाचे बुरशीनाशक-आधारित व एकात्मिक व्यवस्थापन तपासतात. औषध, मात्रा व वेळ येथे दिलेली नाही - तज्ज्ञासोबत शोधनिबंध, अद्ययावत अधिकृत सल्ला व लेबल पाहून वापरा.'),
    ],
    curative: L(
      'Early cases can often be managed; advanced girdling or severe root rot may not be reversible. Outcome depends on severity and correct diagnosis.',
      'सुरुवातीच्या टप्प्यात व्यवस्थापन अनेकदा शक्य आहे; खोडाला पूर्ण वेढा किंवा तीव्र मूळकूज झाल्यास ते उलट करता येणार नाही. निकाल रोगाची तीव्रता व योग्य निदानावर अवलंबून.',
    ),
    dontDo: [
      L('Do not pile soil, mulch or compost against the trunk.', 'खोडाजवळ माती, आच्छादन किंवा कंपोस्ट रचू नका.'),
      L('Do not flood-irrigate around the trunk of a suspect tree.', 'संशयित झाडाच्या खोडाभोवती पाणी भरून सिंचन करू नका.'),
      L('Do not use home remedies or fungicide doses forwarded on messaging apps.', 'घरगुती उपाय किंवा मेसेजिंग अॅपवर आलेल्या औषध मात्रा वापरू नका.'),
    ],
    expertStrong: true,
    expertNote: L(
      'Contact a horticulture / plant-pathology expert soon if the lesion goes around the trunk or the canopy is declining.',
      'जखम खोडाभोवती पसरली असेल किंवा झाड खालावत असेल तर लवकरात लवकर फलोत्पादन/वनस्पती रोगशास्त्र तज्ज्ञांशी संपर्क साधा.',
    ),
    refs: ['wagh2018', 'ingle2023', 'ingle2020', 'gade2012'],
    scope: 'nagpur_research',
    scopeNote: L(
      'Phytophthora diseases are the subject of several Nagpur Mandarin papers in the supplied list. This does not prove the disease is present in any particular Warud orchard.',
      'पुरवलेल्या यादीतील अनेक नागपुरी संत्रा शोधनिबंध फायटोफ्थोरा रोगांवर आहेत. वरूडमधील कोणत्याही विशिष्ट बागेत हा रोग असल्याचे यातून सिद्ध होत नाही.',
    ),
  },
  {
    id: 'brown_rot',
    name: L('Phytophthora brown rot (fruit)', 'फायटोफ्थोरा तपकिरी फळसड (ब्राऊन रॉट)'),
    scientific: 'Phytophthora spp.',
    mgmt: 'established',
    listedInGroups: ['A'],
    parts: ['fruit'],
    summary: L(
      'A fruit rot caused by the same group of soil-borne organisms as gummosis. It mostly affects fruit hanging low on the tree in wet weather.',
      'गमोसिसप्रमाणेच जमिनीतील जीवांमुळे होणारी फळसड. ओल्या हवामानात झाडाच्या खालच्या भागातील फळांवर जास्त दिसते.',
    ),
    symptoms: [
      L('Firm, brown, leathery patches on the rind that spread over the fruit.', 'सालीवर घट्ट, तपकिरी, चिवट डाग जे संपूर्ण फळावर पसरतात.'),
      L('A sour or unpleasant smell and sometimes white mould in humid weather.', 'आंबट किंवा अप्रिय वास; दमट हवेत कधीकधी पांढरी बुरशी.'),
      L('Affected fruit may drop.', 'बाधित फळे गळू शकतात.'),
    ],
    spread: [
      L('Rain splash carries spores from the soil to low fruit and leaves.', 'पावसाच्या थेंबांमुळे जमिनीतील बीजाणू खालची फळे व पानांवर पोहोचतात.'),
    ],
    conditions: L('Prolonged wet weather and dense branches touching the ground.', 'दीर्घकाळ ओले हवामान व जमिनीला टेकलेल्या फांद्या.'),
    lookalikes: ['anthracnose', 'gummosis'],
    checks: [
      L('Check whether the affected fruit is low on the tree or close to the soil.', 'बाधित फळे झाडाच्या खालच्या भागात/जमिनीजवळ आहेत का ते पहा.'),
      L('Check the trunk base of the same tree for gum or bark lesions.', 'त्याच झाडाच्या खोडाच्या तळावर डिंक किंवा सालीचे डाग आहेत का ते पहा.'),
    ],
    prevention: [
      L('Prune lower branches so fruit and leaves stay clear of the soil.', 'फळे व पाने जमिनीपासून दूर राहावीत म्हणून खालच्या फांद्यांची छाटणी करा.'),
      L('Improve drainage and avoid water splashing from the ground into the canopy.', 'निचरा सुधारा व जमिनीतील पाणी झाडावर उडू देऊ नका.'),
      L('Collect and dispose of fallen and rotting fruit away from the orchard.', 'गळलेली व सडलेली फळे गोळा करून बागेपासून दूर नष्ट करा.'),
    ],
    management: [
      L('Sanitation and canopy/drainage management come first.', 'स्वच्छता व झाडाच्या फांद्या/निचऱ्याचे व्यवस्थापन हे प्राधान्याचे उपाय आहेत.'),
      L('Protective fungicide use, if needed, must follow current official advice and the label - confirm the diagnosis with an expert first.', 'गरज असल्यास संरक्षक बुरशीनाशक वापर अद्ययावत अधिकृत सल्ला व लेबलनुसारच करा - आधी तज्ज्ञांकडून निदान निश्चित करा.'),
    ],
    curative: L(
      'Rotted fruit cannot be restored; the aim is to protect healthy fruit and reduce the source of infection.',
      'सडलेली फळे पूर्ववत होत नाहीत; निरोगी फळांचे संरक्षण व संसर्गाचा स्रोत कमी करणे हा उद्देश असतो.',
    ),
    dontDo: [
      L('Do not leave rotten fruit under the tree.', 'सडलेली फळे झाडाखाली ठेवू नका.'),
      L('Do not mix suspect fruit with healthy fruit during harvest or storage.', 'काढणी किंवा साठवणीत संशयित फळे निरोगी फळांसोबत मिसळू नका.'),
    ],
    expertStrong: false,
    expertNote: L('Ask an expert if many fruits are affected or the tree also shows trunk or root symptoms.', 'अनेक फळे बाधित असतील किंवा झाडाच्या खोडावर/मुळांवरही लक्षणे असतील तर तज्ज्ञांना विचारा.'),
    refs: ['wagh2018'],
    scope: 'nagpur_research',
    scopeNote: L(
      'Covered under Phytophthora disease research on Nagpur Mandarin (by title). Not verified for Warud.',
      'नागपुरी संत्र्यावरील फायटोफ्थोरा रोग संशोधनात समाविष्ट (शीर्षकानुसार). वरूडसाठी पडताळलेले नाही.',
    ),
  },
  {
    id: 'melanose',
    name: L('Melanose', 'मेलॅनोज'),
    scientific: 'Diaporthe citri (asexual stage: Phomopsis citri)',
    mgmt: 'established',
    listedInGroups: ['A'],
    parts: ['leaf', 'fruit', 'branch'],
    summary: L(
      'A fungal disease that causes tiny dark raised specks on young leaves and fruit. It is often a surface blemish that lowers market quality.',
      'बुरशीजन्य रोग; कोवळ्या पानांवर व फळांवर लहान गडद उंचावलेले ठिपके येतात. बहुतेकदा हा सालीवरील डाग असतो जो बाजारमूल्य कमी करतो.',
    ),
    symptoms: [
      L('Many tiny dark-brown to black raised specks that feel rough like sandpaper.', 'अनेक लहान गडद तपकिरी ते काळे उंचावलेले ठिपके; हाताला खरबरीत लागतात.'),
      L('On fruit, specks may run in tear-stain streaks or form a crusty "mud-cake" patch.', 'फळावर ठिपके अश्रूंच्या धारांसारखे किंवा चिखलासारख्या खरबरीत थराच्या स्वरूपात दिसू शकतात.'),
      L('Leaf spots may have a yellowish halo.', 'पानांवरील ठिपक्यांभोवती पिवळसर कडा असू शकते.'),
    ],
    spread: [
      L('Spores from dead twigs and dead wood are washed by rain onto young tissue.', 'वाळलेल्या फांद्या व लाकडातील बीजाणू पावसाने कोवळ्या भागांवर पोहोचतात.'),
    ],
    conditions: L('Wet weather while leaves and fruit are young; plenty of dead wood in the canopy.', 'पाने व फळे कोवळी असताना ओले हवामान; झाडात भरपूर वाळलेल्या फांद्या.'),
    lookalikes: ['scab', 'canker', 'anthracnose'],
    checks: [
      L('Run a finger over the spots: melanose usually feels gritty and rough.', 'ठिपक्यांवरून बोट फिरवा: मेलॅनोज सहसा खरबरीत लागतो.'),
      L('Look for dead twigs above the affected leaves and fruit.', 'बाधित पाने व फळांच्या वरच्या भागात वाळलेल्या फांद्या आहेत का ते पहा.'),
    ],
    prevention: [
      L('Prune out and remove dead twigs and dead wood regularly.', 'वाळलेल्या फांद्या नियमित छाटून काढून टाका.'),
      L('Keep the canopy open so leaves and fruit dry quickly after rain.', 'पावसानंतर पाने व फळे लवकर कोरडी होण्यासाठी झाडात हवा खेळती ठेवा.'),
    ],
    management: [
      L('Sanitation (removing dead wood) is the main long-term measure.', 'स्वच्छता (वाळलेले लाकूड काढणे) हा मुख्य दीर्घकालीन उपाय आहे.'),
      L('Protective fungicide timing on young growth, if advised, must come from current official recommendations and the label.', 'कोवळ्या फुटीवरील संरक्षक बुरशीनाशकाची वेळ, सल्ला दिल्यास, अद्ययावत अधिकृत शिफारशी व लेबलनुसारच ठरवा.'),
    ],
    curative: L(
      'Existing specks do not disappear; management protects new growth. Damage is usually cosmetic.',
      'आधीचे ठिपके नाहीसे होत नाहीत; व्यवस्थापन नवीन फुटीचे संरक्षण करते. नुकसान सहसा दिसण्यापुरते असते.',
    ),
    dontDo: [
      L('Do not spray repeatedly hoping to erase old spots.', 'जुने ठिपके जातील या आशेने वारंवार फवारणी करू नका.'),
      L('Do not leave pruned dead wood lying under the trees.', 'छाटलेले वाळलेले लाकूड झाडांखाली पडू देऊ नका.'),
    ],
    expertStrong: false,
    expertNote: L('Ask an expert if the spotting is severe on young trees or you are unsure it is not canker or scab.', 'तरुण झाडांवर तीव्र प्रादुर्भाव असेल किंवा तो कँकर/स्कॅब नाही याबद्दल खात्री नसेल तर तज्ज्ञांना विचारा.'),
    refs: [],
    scope: 'general_citrus',
    scopeNote: L(
      'Described in general citrus plant-pathology literature. No Nagpur-Mandarin-specific paper is in the supplied list.',
      'सर्वसाधारण सिट्रस वनस्पती रोगशास्त्र साहित्यात वर्णन आहे. पुरवलेल्या यादीत नागपुरी संत्र्यासाठी विशिष्ट शोधनिबंध नाही.',
    ),
  },
  {
    id: 'scab',
    name: L('Citrus scab', 'सिट्रस स्कॅब (खरूज)'),
    scientific: 'Elsinoë fawcettii',
    mgmt: 'established',
    listedInGroups: ['A'],
    parts: ['leaf', 'fruit', 'branch'],
    summary: L(
      'A fungal disease causing raised, corky, wart-like lesions on leaves, twigs and fruit. Young growth is most affected.',
      'बुरशीजन्य रोग; पाने, फांद्या व फळांवर उंचावलेले, कॉर्कसारखे, चामखीळासारखे डाग येतात. कोवळ्या फुटीवर जास्त परिणाम होतो.',
    ),
    symptoms: [
      L('Raised, corky, pinkish-grey to brown wart-like lesions.', 'उंचावलेले, कॉर्कसारखे, गुलाबी-राखाडी ते तपकिरी चामखीळासारखे डाग.'),
      L('Leaves may become twisted or distorted.', 'पाने वाकडी किंवा विकृत होऊ शकतात.'),
      L('Rough, scabby patches on fruit rind.', 'फळाच्या सालीवर खरबरीत खपल्यांसारखे भाग.'),
    ],
    spread: [L('Spores spread by rain splash from infected leaves and twigs to young growth.', 'संक्रमित पाने व फांद्यांतील बीजाणू पावसाच्या थेंबांनी कोवळ्या फुटीवर पसरतात.')],
    conditions: L('Wet weather during flushes of young growth.', 'नवीन फूट येताना ओले हवामान.'),
    lookalikes: ['canker', 'melanose'],
    checks: [
      L('Check whether the lesions are corky and raised with no oily margin (canker usually has an oily margin and yellow halo).', 'डाग कॉर्कसारखे, उंचावलेले व तेलकट कडा नसलेले आहेत का पहा (कँकरमध्ये सहसा तेलकट कडा व पिवळे वलय असते).'),
      L('Look at young leaves and twigs on neighbouring trees.', 'शेजारील झाडांची कोवळी पाने व फांद्या पहा.'),
    ],
    prevention: [
      L('Use clean planting material from a reliable nursery.', 'विश्वासार्ह रोपवाटिकेतील निरोगी रोपे वापरा.'),
      L('Prune and remove badly affected twigs; keep the canopy open.', 'जास्त बाधित फांद्या छाटून काढा; झाडात हवा खेळती ठेवा.'),
    ],
    management: [
      L('Sanitation and protecting young growth during wet periods are the main measures.', 'स्वच्छता व ओल्या काळात कोवळ्या फुटीचे संरक्षण हे मुख्य उपाय आहेत.'),
      L('Any fungicide use must follow current official advice and the label after expert confirmation.', 'कोणतेही बुरशीनाशक तज्ज्ञांच्या पुष्टीनंतर अद्ययावत अधिकृत सल्ला व लेबलनुसारच वापरा.'),
    ],
    curative: L('Existing lesions remain; management protects new growth. Often a blemish problem, more serious on young trees and nurseries.', 'आधीचे डाग तसेच राहतात; व्यवस्थापन नवीन फुटीचे रक्षण करते. बहुतेकदा दिसण्याचा प्रश्न; तरुण झाडे व रोपवाटिकेत अधिक गंभीर.'),
    dontDo: [
      L('Do not move cuttings or budwood from affected trees.', 'बाधित झाडांचे कलम काड्या किंवा डोळे इतरत्र नेऊ नका.'),
      L('Do not assume corky lesions are scab - canker looks similar and needs different handling.', 'कॉर्कसारखे डाग म्हणजे स्कॅबच असे समजू नका - कँकर सारखा दिसतो पण त्याची हाताळणी वेगळी असते.'),
    ],
    expertStrong: false,
    expertNote: L('Ask an expert to separate scab from canker if you are unsure.', 'स्कॅब व कँकर यातील फरकाबद्दल खात्री नसेल तर तज्ज्ञांना विचारा.'),
    refs: [],
    scope: 'general_citrus',
    scopeNote: L('Described in general citrus literature. No Nagpur-Mandarin-specific paper in the supplied list.', 'सर्वसाधारण सिट्रस साहित्यात वर्णन आहे. पुरवलेल्या यादीत नागपुरी संत्र्यासाठी विशिष्ट शोधनिबंध नाही.'),
  },
  {
    id: 'anthracnose',
    name: L('Anthracnose', 'करपा (अँथ्रॅक्नोज)'),
    scientific: 'Colletotrichum gloeosporioides (and related Colletotrichum species)',
    mgmt: 'established',
    listedInGroups: ['A'],
    parts: ['leaf', 'fruit', 'branch'],
    summary: L(
      'A fungal disease causing leaf spots, twig dieback and fruit lesions, usually worse on stressed or injured trees.',
      'बुरशीजन्य रोग; पानांवर ठिपके, फांद्यांचे शेंडे वाळणे व फळांवर डाग येतात. ताणाखाली किंवा जखमी झाडांवर जास्त दिसतो.',
    ),
    symptoms: [
      L('Brown leaf spots and twigs dying back from the tip.', 'पानांवर तपकिरी ठिपके व फांद्या शेंड्याकडून वाळणे.'),
      L('Dark, sunken lesions or tear-stain streaks on fruit.', 'फळावर गडद, खोलगट डाग किंवा अश्रूधारांसारख्या रेषा.'),
      L('Premature leaf or fruit drop.', 'पाने किंवा फळांची अकाली गळ.'),
    ],
    spread: [L('Spores spread by rain splash; dead twigs and wounds are entry points.', 'बीजाणू पावसाच्या थेंबांनी पसरतात; वाळलेल्या फांद्या व जखमा प्रवेशद्वार असतात.')],
    conditions: L('Warm, wet and humid weather; weak, drought-stressed or wounded trees.', 'उष्ण, ओले व दमट हवामान; कमजोर, पाण्याच्या ताणातील किंवा जखमी झाडे.'),
    lookalikes: ['melanose', 'brown_rot', 'decline'],
    checks: [
      L('Check whether the dieback starts at twig tips and whether dead wood is present.', 'शेंडे वाळणे फांद्यांच्या टोकापासून सुरू होते का व वाळलेले लाकूड आहे का ते पहा.'),
      L('Check irrigation, nutrition and root health, since weak trees are more affected.', 'सिंचन, खते व मुळांचे आरोग्य तपासा, कारण कमजोर झाडे जास्त बाधित होतात.'),
    ],
    prevention: [
      L('Keep trees vigorous with steady irrigation and balanced nutrition based on soil/leaf tests.', 'नियमित सिंचन व माती/पान तपासणीवर आधारित संतुलित खतांनी झाडे सशक्त ठेवा.'),
      L('Prune and remove dead twigs; avoid injuring trees.', 'वाळलेल्या फांद्या छाटून काढा; झाडांना इजा टाळा.'),
    ],
    management: [
      L('Sanitation and tree-health management first.', 'आधी स्वच्छता व झाडांच्या आरोग्याचे व्यवस्थापन.'),
      L('Fungicide use only after expert confirmation and following current official advice and the label.', 'बुरशीनाशक फक्त तज्ज्ञांच्या पुष्टीनंतर व अद्ययावत अधिकृत सल्ला व लेबलनुसार.'),
    ],
    curative: L('Often manageable when the tree is otherwise healthy; dead twigs and damaged fruit do not recover.', 'झाड इतर बाबतीत निरोगी असल्यास बहुतेकदा नियंत्रण शक्य; वाळलेल्या फांद्या व खराब फळे पूर्ववत होत नाहीत.'),
    dontDo: [
      L('Do not ignore dead twigs - they carry spores.', 'वाळलेल्या फांद्यांकडे दुर्लक्ष करू नका - त्यात बीजाणू असतात.'),
      L('Do not treat dieback as anthracnose without checking roots, trunk base and water supply.', 'मुळे, खोडाचा तळ व पाण्याचा पुरवठा तपासल्याशिवाय शेंडेमर म्हणजे करपा असे समजू नका.'),
    ],
    expertStrong: false,
    expertNote: L('Ask an expert if dieback is spreading or more than a few branches are affected.', 'शेंडेमर पसरत असेल किंवा काही फांद्यांपेक्षा जास्त बाधित असतील तर तज्ज्ञांना विचारा.'),
    refs: [],
    scope: 'general_citrus',
    scopeNote: L('Described in general citrus literature. No Nagpur-Mandarin-specific paper in the supplied list.', 'सर्वसाधारण सिट्रस साहित्यात वर्णन आहे. पुरवलेल्या यादीत नागपुरी संत्र्यासाठी विशिष्ट शोधनिबंध नाही.'),
  },
  {
    id: 'canker',
    name: L('Citrus canker', 'सिट्रस कँकर (व्रण रोग)'),
    scientific: 'Xanthomonas citri subsp. citri',
    mgmt: 'difficult',
    listedInGroups: ['B'],
    parts: ['leaf', 'fruit', 'branch'],
    summary: L(
      'A bacterial disease causing raised corky lesions with a yellow halo. It spreads in wind-driven rain and can cause leaf and fruit drop. It is hard to eliminate once established.',
      'जीवाणूजन्य रोग; पिवळ्या कडेचे उंचावलेले कॉर्कसारखे डाग येतात. वाऱ्यासह पावसात पसरतो व पाने/फळांची गळ होऊ शकते. एकदा स्थिरावल्यावर नष्ट करणे कठीण.',
    ),
    symptoms: [
      L('Small raised blister-like spots that turn brown, corky and crater-like.', 'लहान फोडासारखे उंचावलेले ठिपके जे तपकिरी, कॉर्कसारखे व खळग्यासारखे होतात.'),
      L('An oily, water-soaked margin and a yellow halo around lesions.', 'डागांभोवती तेलकट, पाणथळ कडा व पिवळे वलय.'),
      L('Spots on leaves, twigs and fruit; severe cases show leaf and fruit drop.', 'पाने, फांद्या व फळांवर डाग; तीव्र प्रादुर्भावात पाने व फळे गळतात.'),
    ],
    spread: [
      L('Wind-driven rain, contaminated tools, hands and clothing.', 'वाऱ्यासह पाऊस, दूषित अवजारे, हात व कपडे.'),
      L('Infected planting material; leaf-miner injuries open entry points on young leaves.', 'संक्रमित रोपे; पाने पोखरणाऱ्या अळीच्या जखमा कोवळ्या पानांवर प्रवेशद्वार ठरतात.'),
    ],
    conditions: L('Warm, wet and windy weather during young flushes. Susceptibility differs between citrus types and varieties.', 'नवीन फुटीच्या काळात उष्ण, ओले व वाऱ्याचे हवामान. सिट्रसचे प्रकार व जातींनुसार संवेदनशीलता वेगळी असते.'),
    lookalikes: ['scab', 'melanose', 'anthracnose'],
    checks: [
      L('Look for the oily margin and yellow halo on several leaves, and on twigs and fruit.', 'अनेक पानांवर, तसेच फांद्या व फळांवर तेलकट कडा व पिवळे वलय आहे का ते पहा.'),
      L('Check for leaf-miner damage on young leaves and for similar spots on neighbouring trees.', 'कोवळ्या पानांवर पाने पोखरणाऱ्या अळीचे नुकसान व शेजारील झाडांवर तसेच डाग आहेत का ते पहा.'),
    ],
    prevention: [
      L('Use healthy planting material only; keep windbreaks where advised.', 'फक्त निरोगी रोपे वापरा; सल्ल्यानुसार वारारोधक झाडे ठेवा.'),
      L('Control citrus leaf miner on new flushes.', 'नवीन फुटीवर पाने पोखरणाऱ्या अळीचे नियंत्रण करा.'),
      L('Clean tools, hands and clothing before moving from a suspect tree to healthy ones.', 'संशयित झाडावरून निरोगी झाडांकडे जाण्यापूर्वी अवजारे, हात व कपडे स्वच्छ करा.'),
    ],
    management: [
      L('Remove and destroy badly infected twigs and fallen infected leaves and fruit, as advised by an expert.', 'तज्ज्ञांच्या सल्ल्यानुसार जास्त बाधित फांद्या तसेच गळलेली बाधित पाने व फळे काढून नष्ट करा.'),
      L('Copper-based protective sprays are widely cited in extension literature as protective only, not curative. Product, dose and timing must come from current official advice and the label.', 'तांबेयुक्त संरक्षक फवारण्यांचा विस्तार साहित्यात फक्त संरक्षक म्हणून उल्लेख असतो, रोग बरा करणाऱ्या नव्हे. औषध, मात्रा व वेळ अद्ययावत अधिकृत सल्ला व लेबलनुसारच.'),
      L('Report suspected spread to your agriculture department - official rules may apply.', 'प्रसार झाल्याचा संशय असल्यास कृषी विभागाला कळवा - अधिकृत नियम लागू असू शकतात.'),
    ],
    curative: L('No simple cure. Management reduces spread and protects new growth; infected tissue stays infected.', 'सोपा इलाज नाही. व्यवस्थापन प्रसार कमी करते व नवीन फुटीचे रक्षण करते; बाधित भाग बाधितच राहतो.'),
    dontDo: [
      L('Do not move cuttings, budwood or fruit from suspect trees.', 'संशयित झाडांच्या काड्या, डोळे किंवा फळे इतरत्र नेऊ नका.'),
      L('Do not prune or work in wet foliage and then go straight to healthy trees.', 'ओल्या पर्णसंभारात छाटणी/काम करून थेट निरोगी झाडांकडे जाऊ नका.'),
      L('Do not use unverified spray mixtures from messaging apps.', 'मेसेजिंग अॅपवरील पडताळणी न केलेली फवारणी मिश्रणे वापरू नका.'),
    ],
    expertStrong: true,
    expertNote: L('Contact a plant-protection expert or your agriculture office promptly if canker is suspected.', 'कँकरचा संशय असल्यास लगेच वनस्पती संरक्षण तज्ज्ञ किंवा कृषी कार्यालयाशी संपर्क साधा.'),
    refs: [],
    scope: 'general_citrus',
    scopeNote: L('Described in general citrus literature. No Nagpur-Mandarin-specific paper in the supplied list.', 'सर्वसाधारण सिट्रस साहित्यात वर्णन आहे. पुरवलेल्या यादीत नागपुरी संत्र्यासाठी विशिष्ट शोधनिबंध नाही.'),
  },
  {
    id: 'hlb',
    name: L('Citrus greening / Huanglongbing (HLB)', 'सिट्रस ग्रीनिंग / हुआंगलाँगबिंग (HLB)'),
    scientific: 'Candidatus Liberibacter asiaticus (spread by the Asian citrus psyllid, Diaphorina citri)',
    mgmt: 'no_cure',
    listedInGroups: ['B', 'C'],
    parts: ['leaf', 'fruit', 'whole_tree'],
    summary: L(
      'A serious systemic bacterial disease spread by a small sap-sucking insect and by infected planting material. Trees decline and produce poor fruit. There is no established cure.',
      'गंभीर सर्वांगीण जीवाणूजन्य रोग; रस शोषणाऱ्या लहान किडीमुळे व संक्रमित रोपांमुळे पसरतो. झाड खालावते व फळे निकृष्ट येतात. प्रस्थापित इलाज नाही.',
    ),
    symptoms: [
      L('Blotchy, asymmetric yellow mottling across the leaf (not neatly matching the veins).', 'पानावर चट्टेदार, असममित पिवळसर ठिपके (शिरांना नीटपणे अनुसरत नाहीत).'),
      L('Yellow shoots, often on one sector of the tree first.', 'पिवळे कोंब, बहुधा आधी झाडाच्या एकाच भागात.'),
      L('Small, lopsided, poorly coloured fruit; aborted seeds; fruit drop and dieback.', 'लहान, वाकडेतिकडे, फिकट रंगाची फळे; अविकसित बिया; फळगळ व शेंडेमर.'),
    ],
    spread: [
      L('Feeding by the Asian citrus psyllid (Diaphorina citri).', 'आशियाई सिट्रस सायला (Diaphorina citri) किडीचे अन्न शोषण.'),
      L('Grafting with infected budwood or planting infected nursery plants.', 'संक्रमित डोळे कलमासाठी वापरणे किंवा संक्रमित रोपे लावणे.'),
    ],
    conditions: L('Present where the psyllid vector and infected trees or planting material occur.', 'सायला कीड व संक्रमित झाडे/रोपे असलेल्या ठिकाणी आढळतो.'),
    lookalikes: ['tristeza', 'decline', 'mosaic'],
    checks: [
      L('Compare several leaves and shoots: HLB blotches are uneven; nutrient deficiencies are usually symmetrical along veins.', 'अनेक पाने व कोंबांची तुलना करा: HLB चे चट्टे असमान असतात; अन्नद्रव्य कमतरतेत सहसा शिरांवर समान नक्षी असते.'),
      L('Look for small psyllid insects and nymphs on new shoots.', 'नवीन कोंबांवर सायला किडी व त्यांची पिल्ले आहेत का ते पहा.'),
    ],
    prevention: [
      L('Plant only certified disease-free plants from an accredited nursery.', 'मान्यताप्राप्त रोपवाटिकेतील प्रमाणित रोगमुक्त रोपेच लावा.'),
      L('Monitor and manage the psyllid on new flushes, following official advice.', 'अधिकृत सल्ल्यानुसार नवीन फुटीवरील सायला किडीवर देखरेख व नियंत्रण करा.'),
      L('Never take budwood from trees showing suspect symptoms.', 'संशयित लक्षणे असलेल्या झाडांचे डोळे/काड्या कधीही घेऊ नका.'),
    ],
    management: [
      L('Laboratory confirmation (for example by an authorised testing lab) is needed before deciding what to do with a tree.', 'झाडाबद्दल निर्णय घेण्यापूर्वी प्रयोगशाळेतील पुष्टी (उदा. अधिकृत चाचणी प्रयोगशाळा) आवश्यक आहे.'),
      L('Management is prevention-led: clean planting material, vector control and removal of confirmed infected trees as advised by the authorities.', 'व्यवस्थापन प्रतिबंधावर आधारित: स्वच्छ रोपे, किडीचे नियंत्रण व अधिकाऱ्यांच्या सल्ल्यानुसार पुष्टी झालेली बाधित झाडे काढणे.'),
      L('Good nutrition and irrigation may support a tree but do not cure the disease.', 'चांगले खत व सिंचन झाडाला आधार देऊ शकते पण रोग बरा करत नाही.'),
    ],
    curative: L('No proven curative treatment is established.', 'सिद्ध झालेला इलाज प्रस्थापित नाही.'),
    dontDo: [
      L('Do not expect an ordinary fungicide to cure it - it is a bacterial, systemic disease.', 'सामान्य बुरशीनाशकाने तो बरा होईल अशी अपेक्षा करू नका - तो जीवाणूजन्य, सर्वांगीण रोग आहे.'),
      L('Do not take budwood or cuttings from suspect trees.', 'संशयित झाडांचे डोळे किंवा काड्या घेऊ नका.'),
      L('Do not remove trees on a photo alone - confirm first, because several problems look similar.', 'फक्त फोटोवरून झाडे काढू नका - आधी पुष्टी करा, कारण अनेक समस्या सारख्या दिसतात.'),
    ],
    expertStrong: true,
    expertNote: L('Contact an expert or your agriculture office for testing and official guidance.', 'चाचणी व अधिकृत मार्गदर्शनासाठी तज्ज्ञ किंवा कृषी कार्यालयाशी संपर्क साधा.'),
    refs: ['das1999', 'nair2025'],
    scope: 'broader_region',
    scopeNote: L(
      'The supplied list has a Marathwada distribution paper (1999) and a 2025 paper on the greening bacterium and a Nagpur Mandarin fruit disorder (by their titles). Neither proves HLB in Warud.',
      'पुरवलेल्या यादीत मराठवाड्यातील प्रसारावरील (1999) व नागपुरी संत्र्यातील फळविकृतीबाबतच्या ग्रीनिंग जीवाणूवरील (2025) शोधनिबंध आहेत (शीर्षकानुसार). यापैकी कोणताही वरूडमध्ये HLB असल्याचे सिद्ध करत नाही.',
    ),
  },
  {
    id: 'tristeza',
    name: L('Citrus tristeza virus (CTV)', 'सिट्रस ट्रिस्टेझा विषाणू रोग'),
    scientific: 'Citrus tristeza virus (Closteroviridae)',
    mgmt: 'no_cure',
    listedInGroups: ['B', 'C'],
    parts: ['whole_tree', 'branch', 'leaf', 'fruit'],
    summary: L(
      'A virus spread by aphids and infected budwood. Effects range from no visible symptoms to stem pitting or sudden decline, depending on the virus strain, variety and rootstock. It cannot be confirmed from a photo.',
      'मावा किडी व संक्रमित डोळ्यांमुळे पसरणारा विषाणू. विषाणूचा प्रकार, जात व खुंट यानुसार लक्षणे नसण्यापासून खोडावर खळगे किंवा अचानक झाड मरेपर्यंत परिणाम होतात. फोटोवरून पुष्टी करता येत नाही.',
    ),
    symptoms: [
      L('Stunted, declining trees with yellowing leaves.', 'खुंटलेली, खालावणारी झाडे व पिवळी पडणारी पाने.'),
      L('Stem pitting (small pits under the bark) and small fruit in some cases.', 'काही प्रकरणांत खोडाच्या सालीखाली लहान खळगे व लहान फळे.'),
      L('Quick decline of the whole tree on susceptible rootstock combinations.', 'संवेदनशील खुंट संयोगावर संपूर्ण झाड अचानक मरणे.'),
    ],
    spread: [
      L('Aphids (several species) carry the virus from tree to tree.', 'मावा किडींच्या अनेक प्रजाती विषाणू झाडातून झाडात नेतात.'),
      L('Infected budwood and nursery plants.', 'संक्रमित डोळे व रोपवाटिकेतील रोपे.'),
    ],
    conditions: L('Presence of aphid vectors and infected trees or budwood.', 'मावा किडी व संक्रमित झाडे/डोळ्यांची उपस्थिती.'),
    lookalikes: ['hlb', 'decline', 'nematode', 'gummosis'],
    checks: [
      L('Note the rootstock and age of the tree, and whether neighbouring trees show similar decline.', 'झाडाचा खुंट व वय तसेच शेजारील झाडांतही अशीच घट आहे का ते नोंदवा.'),
      L('Check the trunk base and roots first - these are far more common causes of decline.', 'आधी खोडाचा तळ व मुळे तपासा - झाड खालावण्याची ही अधिक सामान्य कारणे आहेत.'),
    ],
    prevention: [
      L('Use virus-tested budwood and plants from an accredited nursery.', 'मान्यताप्राप्त रोपवाटिकेतील विषाणू-चाचणी केलेले डोळे व रोपे वापरा.'),
      L('Ask experts about rootstock and scion combinations suited to your area.', 'तुमच्या भागासाठी योग्य खुंट व कलम संयोगाबद्दल तज्ज्ञांना विचारा.'),
    ],
    management: [
      L('Confirmation needs laboratory testing; management is prevention-led.', 'पुष्टीसाठी प्रयोगशाळा चाचणी लागते; व्यवस्थापन प्रतिबंधावर आधारित आहे.'),
      L('Decisions on affected trees should follow expert and official advice.', 'बाधित झाडांबाबतचे निर्णय तज्ज्ञ व अधिकृत सल्ल्यानुसार घ्या.'),
    ],
    curative: L('No curative treatment exists for a virus-infected tree.', 'विषाणूग्रस्त झाडासाठी इलाज उपलब्ध नाही.'),
    dontDo: [
      L('Do not use a fungicide or antibiotic spray expecting it to clear a virus.', 'विषाणू जाईल या अपेक्षेने बुरशीनाशक किंवा प्रतिजैविक फवारू नका.'),
      L('Do not propagate from trees of unknown health.', 'आरोग्य माहीत नसलेल्या झाडांपासून रोपे/कलमे तयार करू नका.'),
    ],
    expertStrong: true,
    expertNote: L('Seek expert testing before concluding that a declining tree has a virus.', 'झाड खालावणे हे विषाणूमुळे आहे असा निष्कर्ष काढण्यापूर्वी तज्ज्ञांकडून चाचणी करा.'),
    refs: [],
    scope: 'general_citrus',
    scopeNote: L('Described in general citrus literature. No Nagpur-Mandarin-specific paper in the supplied list.', 'सर्वसाधारण सिट्रस साहित्यात वर्णन आहे. पुरवलेल्या यादीत नागपुरी संत्र्यासाठी विशिष्ट शोधनिबंध नाही.'),
  },
  {
    id: 'decline',
    name: L('Citrus decline / Dieback', 'संत्रा झाडाचा ऱ्हास / शेंडेमर (डिक्लाइन / डायबॅक)'),
    scientific: 'Syndrome with several possible causes (not a single pathogen)',
    mgmt: 'difficult',
    listedInGroups: ['B'],
    parts: ['whole_tree', 'branch', 'root'],
    summary: L(
      'Decline and dieback describe a weakening tree, not one disease. Root rot, nematodes, greening, poor drainage, water stress and nutrient problems can all produce it. The cause must be found before treating.',
      'ऱ्हास व शेंडेमर म्हणजे झाड कमजोर होणे; तो एक रोग नाही. मूळकूज, सूत्रकृमी, ग्रीनिंग, खराब निचरा, पाण्याचा ताण व अन्नद्रव्य समस्या यांमुळे हे होऊ शकते. उपचारापूर्वी कारण शोधणे आवश्यक.',
    ),
    symptoms: [
      L('Thin canopy, small pale leaves and leaf fall.', 'विरळ पर्णसंभार, लहान फिकट पाने व पानगळ.'),
      L('Twigs and branches dying back from the tips.', 'फांद्या व शेंडे टोकाकडून वाळणे.'),
      L('Poor fruit set and small fruit.', 'फळधारणा कमी व फळे लहान.'),
    ],
    spread: [L('Depends on the underlying cause.', 'मूळ कारणावर अवलंबून.')],
    conditions: L('Poor drainage, drought stress, nutrient imbalance, weak roots, and several diseases together.', 'खराब निचरा, दुष्काळी ताण, अन्नद्रव्य असंतुलन, कमजोर मुळे व अनेक रोग एकत्र.'),
    lookalikes: ['gummosis', 'nematode', 'hlb', 'tristeza', 'anthracnose'],
    checks: [
      L('Inspect the trunk base for gum or bark lesions and dig carefully to look at feeder roots.', 'खोडाच्या तळावर डिंक/सालीचे डाग पहा व सावधपणे खणून पांढरी मुळे तपासा.'),
      L('Review irrigation, drainage and fertiliser history; check several trees, not just one.', 'सिंचन, निचरा व खत इतिहास तपासा; एकाच नव्हे तर अनेक झाडे पहा.'),
    ],
    prevention: [
      L('Provide good drainage, steady irrigation and balanced nutrition based on soil and leaf analysis.', 'चांगला निचरा, नियमित सिंचन व माती-पान तपासणीवर आधारित संतुलित खते द्या.'),
      L('Use healthy, certified planting material and suitable rootstocks.', 'निरोगी, प्रमाणित रोपे व योग्य खुंट वापरा.'),
    ],
    management: [
      L('Find the cause first: trunk base, roots, soil and leaf tests and, if needed, nematode and pathogen tests.', 'आधी कारण शोधा: खोडाचा तळ, मुळे, माती व पान तपासणी आणि गरज असल्यास सूत्रकृमी व रोगकारक चाचण्या.'),
      L('Correct drainage, irrigation and nutrition problems; prune dead wood.', 'निचरा, सिंचन व खतांतील दोष दुरुस्त करा; वाळलेले लाकूड छाटा.'),
    ],
    curative: L('Depends entirely on the cause; recovery is not guaranteed.', 'पूर्णपणे कारणावर अवलंबून; पूर्ववत होण्याची हमी नाही.'),
    dontDo: [
      L('Do not spray random chemicals on a declining tree.', 'खालावणाऱ्या झाडावर अनिश्चित रसायने फवारू नका.'),
      L('Do not uproot trees before an expert has identified the cause.', 'तज्ज्ञांनी कारण ओळखण्यापूर्वी झाडे उपटू नका.'),
    ],
    expertStrong: true,
    expertNote: L('Expert diagnosis is strongly recommended for decline.', 'ऱ्हासासाठी तज्ज्ञ निदान अत्यंत आवश्यक आहे.'),
    refs: [],
    scope: 'general_citrus',
    scopeNote: L('A general citrus syndrome. No Nagpur-Mandarin-specific paper in the supplied list.', 'सर्वसाधारण सिट्रस सिंड्रोम. पुरवलेल्या यादीत नागपुरी संत्र्यासाठी विशिष्ट शोधनिबंध नाही.'),
  },
  {
    id: 'nematode',
    name: L('Citrus nematode disease', 'सिट्रस सूत्रकृमी (निमॅटोड) रोग'),
    scientific: 'Tylenchulus semipenetrans (citrus nematode)',
    mgmt: 'difficult',
    listedInGroups: ['B'],
    parts: ['root', 'whole_tree'],
    summary: L(
      'Microscopic worms feeding on fine roots cause a slow decline. Above-ground signs are vague and a leaf or trunk photo cannot identify it; root and soil sampling is needed.',
      'सूक्ष्म कृमी बारीक मुळांवर उपजीविका करतात व हळूहळू झाड खालावते. जमिनीवरील लक्षणे अस्पष्ट असतात व पान/खोडाच्या फोटोवरून ओळखता येत नाही; मुळे व माती नमुना तपासणी आवश्यक.',
    ),
    symptoms: [
      L('Slowly thinning, stunted trees with small fruit.', 'हळूहळू विरळ होणारी, खुंटलेली झाडे व लहान फळे.'),
      L('Few fine feeder roots; soil may cling to roots.', 'बारीक पांढरी मुळे कमी; मुळांना माती चिकटलेली असू शकते.'),
    ],
    spread: [
      L('Moving infested soil, water, tools and nursery plants.', 'बाधित माती, पाणी, अवजारे व रोपांची हलवाहलव.'),
    ],
    conditions: L('Infested soil, often in patches that slowly enlarge.', 'बाधित जमीन; अनेकदा हळूहळू वाढणाऱ्या पट्ट्यांत.'),
    lookalikes: ['decline', 'gummosis', 'tristeza'],
    checks: [
      L('Note whether weak trees occur in a patch rather than randomly.', 'कमजोर झाडे अनियमित नसून पट्ट्यात आहेत का ते नोंदवा.'),
      L('Ask for a root and soil test at a laboratory or through your KVK.', 'प्रयोगशाळा किंवा KVK मार्फत मुळे व माती तपासणी करून घ्या.'),
    ],
    prevention: [
      L('Use clean nursery plants and avoid moving soil from infested areas.', 'स्वच्छ रोपे वापरा व बाधित भागातील माती इतरत्र नेऊ नका.'),
      L('Maintain organic matter, drainage and balanced nutrition to support root health.', 'मुळांच्या आरोग्यासाठी सेंद्रिय पदार्थ, निचरा व संतुलित खते ठेवा.'),
    ],
    management: [
      L('Confirm with a soil and root nematode count before any treatment.', 'कोणत्याही उपचारापूर्वी माती व मुळांतील सूत्रकृमी मोजणीने पुष्टी करा.'),
      L('Chemical nematicides can be highly toxic; use them only on expert advice, following the label and safety rules.', 'रासायनिक सूत्रकृमीनाशके अत्यंत विषारी असू शकतात; फक्त तज्ज्ञांच्या सल्ल्याने, लेबल व सुरक्षा नियमांनुसार वापरा.'),
    ],
    curative: L('Populations can be reduced but rarely eliminated from an orchard.', 'संख्या कमी करता येते पण बागेतून पूर्ण नष्ट करणे क्वचितच शक्य.'),
    dontDo: [
      L('Do not apply nematicides without a confirmed count.', 'पुष्टी झालेल्या मोजणीशिवाय सूत्रकृमीनाशके वापरू नका.'),
      L('Do not carry soil on tools or boots from a weak patch to healthy areas.', 'कमजोर पट्ट्यातील माती अवजारे/बुटांवरून निरोगी भागात नेऊ नका.'),
    ],
    expertStrong: true,
    expertNote: L('Expert and laboratory support are needed to confirm nematodes.', 'सूत्रकृमींच्या पुष्टीसाठी तज्ज्ञ व प्रयोगशाळेची मदत आवश्यक.'),
    refs: [],
    scope: 'general_citrus',
    scopeNote: L('Described in general citrus literature. No Nagpur-Mandarin-specific paper in the supplied list.', 'सर्वसाधारण सिट्रस साहित्यात वर्णन आहे. पुरवलेल्या यादीत नागपुरी संत्र्यासाठी विशिष्ट शोधनिबंध नाही.'),
  },
  {
    id: 'exocortis',
    name: L('Citrus exocortis', 'सिट्रस एक्सोकॉर्टिस (साल तडकणे)'),
    scientific: 'Citrus exocortis viroid (CEVd)',
    mgmt: 'no_cure',
    listedInGroups: ['C'],
    parts: ['trunk', 'whole_tree'],
    summary: L(
      'A viroid (an infectious RNA, smaller than a virus) that can cause bark scaling on sensitive rootstocks and stunting. Many trees show little or no sign.',
      'विषाणूपेक्षाही लहान संसर्गजन्य आरएनए (व्हायरॉइड); संवेदनशील खुंटावर साल खपली निघणे व वाढ खुंटणे होऊ शकते. अनेक झाडांत लक्षणे कमी किंवा नसतात.',
    ),
    symptoms: [
      L('Bark scaling or cracking on the rootstock below the bud union on sensitive rootstocks.', 'संवेदनशील खुंटावर कलम जोडाखालील सालीला खपल्या/तडे.'),
      L('Stunted growth and reduced vigour.', 'खुंटलेली वाढ व कमी जोम.'),
    ],
    spread: [
      L('Contaminated pruning knives and tools.', 'दूषित छाटणी चाकू व अवजारे.'),
      L('Infected budwood.', 'संक्रमित डोळे.'),
    ],
    conditions: L('Spread by human handling and propagation rather than by weather.', 'हवामानापेक्षा मानवी हाताळणी व रोपनिर्मितीतून पसरतो.'),
    lookalikes: ['gummosis', 'decline'],
    checks: [
      L('Check the rootstock part of the trunk for scaling, and note the rootstock type.', 'खोडाच्या खुंटाच्या भागावर खपल्या आहेत का ते व खुंटाचा प्रकार नोंदवा.'),
      L('Rule out trunk-base gum and bark lesions first.', 'आधी खोडाच्या तळावरील डिंक व सालीचे डाग नाकारा.'),
    ],
    prevention: [
      L('Use pathogen-tested budwood from accredited sources.', 'मान्यताप्राप्त स्रोतातील रोगचाचणी केलेले डोळे वापरा.'),
      L('Disinfect cutting tools between trees as advised by extension guidance.', 'विस्तार मार्गदर्शनानुसार प्रत्येक झाडानंतर कापण्याची अवजारे निर्जंतुक करा.'),
    ],
    management: [
      L('Confirmation needs laboratory testing; management is prevention-led.', 'पुष्टीसाठी प्रयोगशाळा चाचणी लागते; व्यवस्थापन प्रतिबंधावर आधारित आहे.'),
    ],
    curative: L('No curative treatment exists.', 'इलाज उपलब्ध नाही.'),
    dontDo: [
      L('Do not use the same pruning tool on many trees without disinfecting it.', 'निर्जंतुक न करता एकच छाटणी अवजार अनेक झाडांवर वापरू नका.'),
      L('Do not spray fungicides - this is not a fungal disease.', 'बुरशीनाशक फवारू नका - हा बुरशीजन्य रोग नाही.'),
    ],
    expertStrong: true,
    expertNote: L('Seek expert testing before concluding it is exocortis.', 'एक्सोकॉर्टिस असल्याचा निष्कर्ष काढण्यापूर्वी तज्ज्ञ चाचणी करा.'),
    refs: [],
    scope: 'general_citrus',
    scopeNote: L('Described in general citrus literature. No Nagpur-Mandarin-specific paper in the supplied list.', 'सर्वसाधारण सिट्रस साहित्यात वर्णन आहे. पुरवलेल्या यादीत नागपुरी संत्र्यासाठी विशिष्ट शोधनिबंध नाही.'),
  },
  {
    id: 'ringspot',
    name: L('Citrus ringspot', 'सिट्रस रिंगस्पॉट (वलयांकित ठिपके)'),
    scientific: 'Citrus ringspot virus and related virus-like agents (specific pathogen must be confirmed)',
    mgmt: 'no_cure',
    listedInGroups: ['C'],
    parts: ['leaf', 'fruit', 'trunk'],
    summary: L(
      'A virus-like disease causing ring or line patterns on leaves and fruit rind. The exact cause must be confirmed in a laboratory before the case is given a name.',
      'विषाणूसदृश रोग; पाने व फळांच्या सालीवर वलय/रेषांची नक्षी दिसते. नाव देण्यापूर्वी नेमके कारण प्रयोगशाळेत निश्चित करणे आवश्यक.',
    ),
    symptoms: [
      L('Yellowish ring or line patterns on leaves.', 'पानांवर पिवळसर वलय किंवा रेषांची नक्षी.'),
      L('Ring-shaped blotches on the fruit rind.', 'फळाच्या सालीवर वलयाकार डाग.'),
    ],
    spread: [
      L('Mainly through infected propagation material; vector involvement is unclear.', 'मुख्यत्वे संक्रमित रोपनिर्मिती साहित्यातून; किडींचा सहभाग अस्पष्ट.'),
    ],
    conditions: L('Linked to infected planting material rather than weather.', 'हवामानापेक्षा संक्रमित रोपांशी संबंधित.'),
    lookalikes: ['mosaic', 'hlb'],
    checks: [
      L('Note whether patterns appear on many leaves and on fruit, and on neighbouring trees.', 'नक्षी अनेक पानांवर, फळांवर व शेजारील झाडांवर आहे का ते नोंदवा.'),
      L('Rule out nutrient deficiency and spray injury with an expert.', 'तज्ज्ञांसोबत अन्नद्रव्य कमतरता व फवारणीमुळे झालेली इजा नाकारा.'),
    ],
    prevention: [
      L('Use pathogen-tested, certified planting material.', 'रोगचाचणी केलेली, प्रमाणित रोपे वापरा.'),
      L('Never propagate from trees showing these patterns.', 'अशी नक्षी असलेल्या झाडांपासून रोपे तयार करू नका.'),
    ],
    management: [
      L('Laboratory confirmation is needed; management is prevention-led.', 'प्रयोगशाळा पुष्टी आवश्यक; व्यवस्थापन प्रतिबंधावर आधारित.'),
    ],
    curative: L('No curative treatment exists.', 'इलाज उपलब्ध नाही.'),
    dontDo: [
      L('Do not name the disease from a photo alone.', 'फक्त फोटोवरून रोगाचे नाव ठरवू नका.'),
      L('Do not use fungicides expecting to clear a virus-like disease.', 'विषाणूसदृश रोग जाईल या अपेक्षेने बुरशीनाशके वापरू नका.'),
    ],
    expertStrong: true,
    expertNote: L('Seek expert testing before labelling the case.', 'नाव देण्यापूर्वी तज्ज्ञ चाचणी करा.'),
    refs: [],
    scope: 'general_citrus',
    scopeNote: L('Described in general citrus literature. No Nagpur-Mandarin-specific paper in the supplied list.', 'सर्वसाधारण सिट्रस साहित्यात वर्णन आहे. पुरवलेल्या यादीत नागपुरी संत्र्यासाठी विशिष्ट शोधनिबंध नाही.'),
  },
  {
    id: 'mosaic',
    name: L('Citrus mosaic', 'सिट्रस मोझॅक (चट्टे)'),
    scientific: 'Mosaic-type citrus viruses (specific pathogen must be confirmed); nutrient disorders can look similar',
    mgmt: 'no_cure',
    listedInGroups: ['C'],
    parts: ['leaf'],
    summary: L(
      'Patchy yellow-green mosaic patterns on leaves can come from viruses, but also from nutrient deficiencies. The cause must be confirmed before it is called mosaic disease.',
      'पानांवरील पिवळ्या-हिरव्या चट्टेदार नक्षीचे कारण विषाणू असू शकते, पण अन्नद्रव्य कमतरताही असू शकते. मोझॅक रोग म्हणण्यापूर्वी कारण निश्चित करणे आवश्यक.',
    ),
    symptoms: [
      L('Irregular yellow-green patches on leaves.', 'पानांवर अनियमित पिवळे-हिरवे चट्टे.'),
      L('Leaves may be small or distorted.', 'पाने लहान किंवा विकृत असू शकतात.'),
    ],
    spread: [
      L('Some mosaic-type viruses spread by insects and by infected budwood.', 'काही मोझॅक विषाणू किडी व संक्रमित डोळ्यांमुळे पसरतात.'),
    ],
    conditions: L('Depends on the specific virus.', 'विशिष्ट विषाणूवर अवलंबून.'),
    lookalikes: ['hlb', 'ringspot'],
    checks: [
      L('Compare many leaves: nutrient patterns are usually symmetrical, virus patterns often irregular.', 'अनेक पाने तपासा: अन्नद्रव्य कमतरतेची नक्षी सहसा समान असते, विषाणूची अनेकदा अनियमित.'),
      L('Consider a soil and leaf nutrient test.', 'माती व पान अन्नद्रव्य तपासणीचा विचार करा.'),
    ],
    prevention: [
      L('Use pathogen-tested, certified planting material.', 'रोगचाचणी केलेली, प्रमाणित रोपे वापरा.'),
      L('Monitor for sap-sucking insects on new growth.', 'नवीन फुटीवर रस शोषणाऱ्या किडींची देखरेख करा.'),
    ],
    management: [
      L('Rule out nutrient problems first, then seek laboratory confirmation.', 'आधी अन्नद्रव्य समस्या नाकारा, मग प्रयोगशाळा पुष्टी मिळवा.'),
    ],
    curative: L('No curative treatment exists for a virus; nutrient problems can be corrected.', 'विषाणूसाठी इलाज नाही; अन्नद्रव्य समस्या दुरुस्त करता येतात.'),
    dontDo: [
      L('Do not assume a virus before testing for nutrient problems.', 'अन्नद्रव्य समस्यांची तपासणी करण्यापूर्वी विषाणू असे समजू नका.'),
      L('Do not take budwood from affected trees.', 'बाधित झाडांचे डोळे घेऊ नका.'),
    ],
    expertStrong: true,
    expertNote: L('Seek expert testing before labelling the case.', 'नाव देण्यापूर्वी तज्ज्ञ चाचणी करा.'),
    refs: [],
    scope: 'general_citrus',
    scopeNote: L('Described in general citrus literature. No Nagpur-Mandarin-specific paper in the supplied list.', 'सर्वसाधारण सिट्रस साहित्यात वर्णन आहे. पुरवलेल्या यादीत नागपुरी संत्र्यासाठी विशिष्ट शोधनिबंध नाही.'),
  },
];

export const DISEASE_BY_ID: Record<string, Disease> = Object.fromEntries(DISEASES.map((d) => [d.id, d]));
