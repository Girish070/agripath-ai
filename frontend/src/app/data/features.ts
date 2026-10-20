import { L } from './types';

/**
 * Controlled vocabulary the backend lets the AI model choose from
 * (backend/taxonomy.go -> FeatureCodes). Because the model returns CODES, every
 * label is shown in reviewed local wording - no live translation is needed.
 */
export const FEATURE_LABELS: Record<string, L> = {
  gum_oozing: L('Gum or resin oozing', 'डिंकासारखा स्राव'),
  bark_lesion: L('Bark lesion or patch', 'सालीवर डाग / जखम'),
  bark_cracking_scaling: L('Bark cracking or scaling', 'साल तडकणे / खपल्या निघणे'),
  raised_corky_lesions: L('Raised, corky lesions', 'उंचावलेले, कॉर्कसारखे डाग'),
  dark_raised_specks: L('Tiny dark raised specks', 'लहान गडद उंचावलेले ठिपके'),
  yellow_halo_lesions: L('Lesions with a yellow halo', 'भोवती पिवळ्या कडेचे डाग'),
  water_soaked_margins: L('Oily or water-soaked margins', 'तेलकट / पाणथळ कडा'),
  blotchy_leaf_mottle: L('Blotchy leaf mottling', 'पानांवर चट्टेदार पिवळसरपणा'),
  yellow_shoots: L('Yellow shoots', 'पिवळे कोंब'),
  misshapen_small_fruit: L('Small or lopsided fruit', 'लहान / वाकडेतिकडे फळ'),
  brown_leathery_fruit_rot: L('Brown, leathery fruit rot', 'फळावर तपकिरी, चिवट सड'),
  sunken_fruit_lesions: L('Sunken fruit lesions', 'फळावर खोलगट डाग'),
  leaf_spots: L('Leaf spots', 'पानांवर ठिपके'),
  leaf_yellowing_general: L('General leaf yellowing', 'पाने सर्वत्र पिवळी पडणे'),
  leaf_drop: L('Leaf drop', 'पानगळ'),
  twig_dieback: L('Twig dieback', 'फांद्यांचे शेंडे वाळणे'),
  sparse_canopy: L('Thin or sparse canopy', 'विरळ झालेला पर्णसंभार'),
  ring_or_line_patterns: L('Ring or line patterns', 'वलय / रेषांसारखी नक्षी'),
  mosaic_pattern: L('Mosaic-like patches', 'मोझॅकसारखे चट्टे'),
  stunted_growth: L('Stunted growth', 'खुंटलेली वाढ'),
  leaf_miner_trails: L('Leaf-miner trails', 'पाने पोखरणाऱ्या अळीच्या नागमोडी रेषा'),
  white_or_grey_mould_on_fruit: L('White or grey mould on fruit', 'फळावर पांढरी / राखाडी बुरशी'),
  healthy_green_foliage: L('Normal green foliage', 'सामान्य हिरवी पाने'),
  healthy_fruit_skin: L('Normal fruit skin', 'फळाची साल सामान्य'),
};

/** Codes for image-quality concerns (backend QualityCodes). */
export const QUALITY_LABELS: Record<string, L> = {
  blurry: L('The photo looks blurry', 'फोटो अस्पष्ट दिसत आहे'),
  too_dark: L('The photo is dark', 'फोटो अंधारा आहे'),
  overexposed: L('The photo is overexposed', 'फोटोमध्ये जास्त प्रकाश आहे'),
  too_far: L('The subject is too far away', 'झाडाचा भाग खूप दूर आहे'),
  partial_view: L('Only part of the problem is visible', 'समस्येचा फक्त काही भाग दिसतो'),
  single_leaf_only: L('Only one leaf is shown', 'फक्त एकच पान दिसत आहे'),
  multiple_plants: L('Several plants are mixed in the frame', 'चौकटीत अनेक झाडे आहेत'),
};
