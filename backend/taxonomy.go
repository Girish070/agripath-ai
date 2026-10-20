package main

import (
	"fmt"
	"strings"
)

// PromptVersion is part of the cache key: change it whenever the prompt or
// taxonomy changes so old cached answers are never reused.
const PromptVersion = "2026-10-v1"

// DiseaseCue is one entry of the closed disease list the model may choose
// from. The IDs MUST match frontend/src/app/data/diseases.ts.
type DiseaseCue struct {
	ID  string
	Cue string // what the condition typically looks like (used only in the prompt)
}

var Diseases = []DiseaseCue{
	{"gummosis", "gum/resin oozing, bark lesions or cracking at the trunk base near the soil"},
	{"brown_rot", "firm brown leathery rot on fruit, usually on fruit low in the canopy"},
	{"melanose", "many tiny dark-brown raised specks giving a rough sandpaper look, sometimes in tear-stain or mud-cake patterns on leaves or fruit"},
	{"scab", "raised corky wart-like lesions (pinkish-grey to brown) on leaves, twigs or fruit, sometimes with distorted leaves"},
	{"anthracnose", "twig dieback, leaf spots, or sunken dark fruit lesions and fruit/leaf drop"},
	{"canker", "raised corky lesions with an oily water-soaked margin and a yellow halo on leaves, twigs or fruit"},
	{"hlb", "blotchy asymmetrical yellow mottling of leaves, yellow shoots, small lopsided fruit that stays green at the base (Huanglongbing / greening)"},
	{"tristeza", "stunting, vein clearing, leaf yellowing and tree decline (rarely diagnosable from a photo)"},
	{"decline", "general canopy thinning, dieback or yellowing with no single specific cause visible"},
	{"nematode", "stunted trees with thin canopy and small fruit (the cause is in the roots and not visible in a leaf photo)"},
	{"exocortis", "bark scaling or cracking on the rootstock below the bud union with stunting"},
	{"ringspot", "ring or line patterns on leaves or fruit rind"},
	{"mosaic", "mosaic-like patchy mottle of leaves"},
}

// Observed-feature codes: a controlled vocabulary the model must choose from.
// Using codes (not free text) means the Marathi UI can show every feature in
// reviewed local wording with no live translation.
var FeatureCodes = []string{
	"gum_oozing", "bark_lesion", "bark_cracking_scaling", "raised_corky_lesions",
	"dark_raised_specks", "yellow_halo_lesions", "water_soaked_margins",
	"blotchy_leaf_mottle", "yellow_shoots", "misshapen_small_fruit",
	"brown_leathery_fruit_rot", "sunken_fruit_lesions", "leaf_spots",
	"leaf_yellowing_general", "leaf_drop", "twig_dieback", "sparse_canopy",
	"ring_or_line_patterns", "mosaic_pattern", "stunted_growth", "leaf_miner_trails",
	"white_or_grey_mould_on_fruit", "healthy_green_foliage", "healthy_fruit_skin",
}

var healthyFeatureCodes = map[string]bool{"healthy_green_foliage": true, "healthy_fruit_skin": true}

var QualityCodes = []string{"blurry", "too_dark", "overexposed", "too_far", "partial_view", "single_leaf_only", "multiple_plants"}

var PlantParts = []string{"leaf", "fruit", "trunk", "branch", "whole_tree", "root", "other", "unclear"}

var Categories = []string{"disease", "healthy", "nutrient_or_pest", "not_citrus", "unable"}

func setOf(items []string) map[string]bool {
	m := make(map[string]bool, len(items))
	for _, s := range items {
		m[s] = true
	}
	return m
}

var (
	diseaseIDs = func() map[string]bool {
		m := map[string]bool{}
		for _, d := range Diseases {
			m[d.ID] = true
		}
		return m
	}()
	featureSet  = setOf(FeatureCodes)
	qualitySet  = setOf(QualityCodes)
	partSet     = setOf(PlantParts)
	categorySet = setOf(Categories)
)

// BuildPrompt creates the instruction text. The model is asked ONLY to
// describe visible features and choose from the closed lists. It is told not
// to give treatment advice - all advice shown to farmers comes from the
// curated, bilingual disease library in the frontend, not from model text.
func BuildPrompt() string {
	var b strings.Builder
	b.WriteString("You are a careful visual screening assistant for Nagpur Mandarin (citrus) orchards in India. ")
	b.WriteString("Look at the photo and report ONLY what is visibly present. Do NOT give treatment, dosage or pesticide advice. ")
	b.WriteString("A photo can never confirm a pathogen, so when unsure you must answer category \"unable\".\n\n")
	b.WriteString("Closed list of disease ids with typical visual cues:\n")
	for _, d := range Diseases {
		fmt.Fprintf(&b, "- %s: %s\n", d.ID, d.Cue)
	}
	b.WriteString("\nAllowed observed_features codes: ")
	b.WriteString(strings.Join(FeatureCodes, ", "))
	b.WriteString("\n")
	b.WriteString("Allowed category values: disease, healthy, nutrient_or_pest, not_citrus, unable\n\n")
	b.WriteString("Rules:\n")
	b.WriteString("- If the image does not show a citrus plant (leaf, fruit, trunk, branch or tree), use is_citrus_plant \"no\" and category \"not_citrus\".\n")
	b.WriteString("- Use category \"disease\" only if you can name at least one observed feature that supports it; primary_id must be an id from the list.\n")
	b.WriteString("- Use \"healthy\" only if the visible plant part looks normal; use \"nutrient_or_pest\" for deficiency-like yellowing, insect damage, or leaf-miner trails that do not match a listed disease.\n")
	b.WriteString("- alternative_ids: up to 3 other listed ids that look similar. Never invent ids, features or numbers.\n")
	b.WriteString("- Do not output probabilities or confidence percentages.\n\n")
	b.WriteString("Return ONLY one JSON object, no markdown, no extra text, with exactly these keys:\n")
	b.WriteString(`{"is_citrus_plant":"yes|no|unsure","plant_part":"...","category":"...","primary_id":"id or null","alternative_ids":[],"observed_features":[],"multiple_problems":false,"image_quality_concerns":[]}`)
	return b.String()
}
