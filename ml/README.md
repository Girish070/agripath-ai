# Model evaluation and future fine-tuning

**Status: the accuracy of AGRIPATH AI is UNVERIFIED.** The project uses a general-purpose hosted vision model (no custom-trained CNN, no fine-tuning). No labelled dataset was supplied in the ZIP, so no accuracy, precision or recall number exists and none should be quoted.

## Dataset structure
```
ml/dataset/
  train/<label>/*.jpg     # only if you later fine-tune; never overlap with test
  val/<label>/*.jpg       # for tuning prompts / thresholds
  test/<label>/*.jpg      # touched ONCE, for the final report
```
`<label>` = a disease id from `frontend/src/app/data/diseases.ts` (e.g. `gummosis`, `canker`, `hlb`) or `healthy`, `nutrient_or_pest`, `not_citrus`.

## Rules to avoid fooling yourself
1. Labels come from an agriculture / plant-pathology expert (ideally lab-confirmed for HLB, tristeza, viroids). Never from this app's output.
2. Split by **tree/orchard**, not by photo, so near-duplicate photos of one tree cannot sit in both train and test.
3. Include healthy, nutrient-deficiency, pest-damage and non-citrus images, and collect across Ambia and Mrig seasons.
4. Do not change prompts after looking at test results.

## Run the evaluation
```
python3 ml/evaluate.py --server http://localhost:8080 --data ml/dataset/test --delay 1
```
Prints per-class precision / recall / F1, the confusion matrix (JSON), the abstain ("unable") rate and error rate.

## What true fine-tuning needs
Hundreds of expert-labelled photos per class, a training method suited to your chosen model/provider, GPU or provider fine-tuning access, and an independent test set. The provider interface in `backend/vision.go` lets you swap in a fine-tuned model without frontend changes.
