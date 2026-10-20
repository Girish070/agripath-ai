package main

import (
	"encoding/json"
	"errors"
	"strings"
)

// ModelOutput is what we ask the model to return. It is UNTRUSTED input and
// is always passed through ValidateDetection before reaching the browser.
type ModelOutput struct {
	IsCitrus         string   `json:"is_citrus_plant"`
	PlantPart        string   `json:"plant_part"`
	Category         string   `json:"category"`
	PrimaryID        string   `json:"primary_id"`
	AlternativeIDs   []string `json:"alternative_ids"`
	ObservedFeatures []string `json:"observed_features"`
	MultipleProblems bool     `json:"multiple_problems"`
	QualityConcerns  []string `json:"image_quality_concerns"`
}

// Detection is the validated, schema-stable result sent to the frontend.
// There is deliberately NO confidence number: an LLM's self-reported
// certainty is not a calibrated probability.
type Detection struct {
	Category         string   `json:"category"`
	PrimaryID        string   `json:"primary_id,omitempty"`
	AlternativeIDs   []string `json:"alternative_ids"`
	ObservedFeatures []string `json:"observed_features"`
	PlantPart        string   `json:"plant_part"`
	MultipleProblems bool     `json:"multiple_problems"`
	QualityConcerns  []string `json:"image_quality_concerns"`
	AbstainReason    string   `json:"abstain_reason,omitempty"`
}

var errNoJSON = errors.New("no JSON object in model output")

// ParseModelOutput pulls the first {...} block out of the model text
// (models sometimes wrap JSON in prose or ``` fences) and decodes it.
func ParseModelOutput(raw string) (ModelOutput, error) {
	var mo ModelOutput
	// Strip <think>...</think> blocks if present from reasoning models
	if idx := strings.Index(raw, "</think>"); idx != -1 {
		raw = raw[idx+len("</think>"):]
	}
	end := strings.LastIndex(raw, "}")
	if end < 0 {
		return mo, errNoJSON
	}
	// Walk backwards from the last '}' to find the matching '{'
	for start := strings.LastIndex(raw[:end], "{"); start >= 0; start = strings.LastIndex(raw[:start], "{") {
		if err := json.Unmarshal([]byte(raw[start:end+1]), &mo); err == nil && (mo.Category != "" || mo.IsCitrus != "") {
			return mo, nil
		}
		if start == 0 {
			break
		}
	}
	// Fallback to outer braces
	start := strings.Index(raw, "{")
	if start < 0 || end <= start {
		return mo, errNoJSON
	}
	if err := json.Unmarshal([]byte(raw[start:end+1]), &mo); err != nil {
		return ModelOutput{}, err
	}
	return mo, nil
}

func filterAllowed(in []string, allowed map[string]bool, limit int) []string {
	out := []string{}
	seen := map[string]bool{}
	for _, s := range in {
		s = strings.ToLower(strings.TrimSpace(s))
		if allowed[s] && !seen[s] {
			seen[s] = true
			out = append(out, s)
			if limit > 0 && len(out) == limit {
				break
			}
		}
	}
	return out
}

func unable(reason string, mo ModelOutput) Detection {
	return Detection{
		Category: "unable", AbstainReason: reason,
		AlternativeIDs: []string{}, ObservedFeatures: filterAllowed(mo.ObservedFeatures, featureSet, 0),
		PlantPart: "unclear", QualityConcerns: filterAllowed(mo.QualityConcerns, qualitySet, 0),
	}
}

// ValidateDetection enforces the abstention rules. The model never gets to
// "force" a diagnosis: anything unknown, unsupported or contradictory
// becomes "unable to identify reliably".
func ValidateDetection(mo ModelOutput) Detection {
	cat := strings.ToLower(strings.TrimSpace(mo.Category))
	isCitrus := strings.ToLower(strings.TrimSpace(mo.IsCitrus))
	part := strings.ToLower(strings.TrimSpace(mo.PlantPart))
	if !partSet[part] {
		part = "unclear"
	}
	d := Detection{
		Category: cat, PlantPart: part, MultipleProblems: mo.MultipleProblems,
		AlternativeIDs:   []string{},
		ObservedFeatures: filterAllowed(mo.ObservedFeatures, featureSet, 0),
		QualityConcerns:  filterAllowed(mo.QualityConcerns, qualitySet, 0),
	}

	if isCitrus == "no" || cat == "not_citrus" {
		d.Category, d.AbstainReason = "not_citrus", ""
		d.ObservedFeatures = []string{}
		return d
	}
	if isCitrus == "unsure" && cat != "unable" {
		return unable("not_sure_citrus", mo)
	}
	if !categorySet[cat] {
		return unable("model_unsure", mo)
	}

	switch cat {
	case "disease":
		primary := strings.ToLower(strings.TrimSpace(mo.PrimaryID))
		if !diseaseIDs[primary] {
			return unable("invalid_disease_id", mo)
		}
		if len(d.ObservedFeatures) == 0 {
			return unable("no_supporting_features", mo)
		}
		for _, f := range d.ObservedFeatures {
			if healthyFeatureCodes[f] {
				return unable("conflicting_signals", mo)
			}
		}
		d.PrimaryID = primary
		for _, a := range filterAllowed(mo.AlternativeIDs, diseaseIDs, 0) {
			if a != primary && len(d.AlternativeIDs) < 3 {
				d.AlternativeIDs = append(d.AlternativeIDs, a)
			}
		}
	case "healthy":
		for _, f := range d.ObservedFeatures {
			if !healthyFeatureCodes[f] && f != "leaf_miner_trails" {
				return unable("conflicting_signals", mo)
			}
		}
	case "nutrient_or_pest", "unable":
		if cat == "unable" {
			d.AbstainReason = "model_unsure"
		}
	}
	return d
}
