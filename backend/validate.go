package main

import (
	"bytes"
	"image"
	"image/jpeg"
	"image/png"
	"net/http"
)

// ImageError is a user-facing validation failure. Code is translated by the
// frontend into English or Marathi.
type ImageError struct {
	Code    string
	Message string
	Status  int
}

func (e *ImageError) Error() string { return e.Code }

// ImageReport records what the server actually measured.
type ImageReport struct {
	Mime      string
	Width     int
	Height    int
	MeanLuma  float64 // 0 (black) .. 255 (white)
	Sharpness float64 // variance of the Laplacian on a downscaled grey copy
	Concerns  []string
}

// Heuristic thresholds. IMPORTANT: these are simple, UNCALIBRATED rules of
// thumb chosen to catch obviously unusable photos (black frames, heavy blur).
// They have not been tuned on real Warud orchard photos and should be
// revisited once a labelled dataset exists.
const (
	minShortSide   = 224
	maxPixels      = 40_000_000
	darkHard       = 30.0
	darkSoft       = 55.0
	brightHard     = 248.0
	brightSoft     = 232.0
	sharpHard      = 6.0
	sharpSoft      = 18.0
	analysisMaxDim = 512
)

// InspectImage validates format, size and basic quality using only the Go
// standard library (JPEG and PNG).
func InspectImage(data []byte) (ImageReport, *ImageError) {
	var rep ImageReport
	rep.Mime = http.DetectContentType(data)
	if rep.Mime != "image/jpeg" && rep.Mime != "image/png" {
		return rep, &ImageError{"unsupported_type", "Only JPG and PNG images are supported.", http.StatusUnsupportedMediaType}
	}
	cfg, _, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return rep, &ImageError{"corrupt_image", "The image could not be read.", http.StatusBadRequest}
	}
	rep.Width, rep.Height = cfg.Width, cfg.Height
	if cfg.Width*cfg.Height > maxPixels {
		return rep, &ImageError{"image_too_large", "The image dimensions are too large.", http.StatusRequestEntityTooLarge}
	}
	if min(cfg.Width, cfg.Height) < minShortSide {
		return rep, &ImageError{"image_too_small", "The image is too small. Use a clearer, closer photo.", http.StatusUnprocessableEntity}
	}

	var img image.Image
	if rep.Mime == "image/jpeg" {
		img, err = jpeg.Decode(bytes.NewReader(data))
	} else {
		img, err = png.Decode(bytes.NewReader(data))
	}
	if err != nil {
		return rep, &ImageError{"corrupt_image", "The image could not be read.", http.StatusBadRequest}
	}

	grey, w, h := greyDownscale(img, analysisMaxDim)
	rep.MeanLuma = mean(grey)
	rep.Sharpness = laplacianVariance(grey, w, h)

	switch {
	case rep.MeanLuma < darkHard:
		return rep, &ImageError{"image_too_dark", "The photo is too dark. Take it in daylight.", http.StatusUnprocessableEntity}
	case rep.MeanLuma > brightHard:
		return rep, &ImageError{"image_overexposed", "The photo is overexposed. Avoid direct glare.", http.StatusUnprocessableEntity}
	case rep.Sharpness < sharpHard:
		return rep, &ImageError{"image_blurry", "The photo is too blurry. Hold the phone steady and focus.", http.StatusUnprocessableEntity}
	}
	if rep.MeanLuma < darkSoft {
		rep.Concerns = append(rep.Concerns, "too_dark")
	}
	if rep.MeanLuma > brightSoft {
		rep.Concerns = append(rep.Concerns, "overexposed")
	}
	if rep.Sharpness < sharpSoft {
		rep.Concerns = append(rep.Concerns, "blurry")
	}
	return rep, nil
}

// greyDownscale samples the image on a coarse grid (nearest neighbour) into
// a luminance array no larger than maxDim on its longest side.
func greyDownscale(img image.Image, maxDim int) ([]float64, int, int) {
	b := img.Bounds()
	sw, sh := b.Dx(), b.Dy()
	scale := 1.0
	if long := max(sw, sh); long > maxDim {
		scale = float64(maxDim) / float64(long)
	}
	w, h := max(1, int(float64(sw)*scale)), max(1, int(float64(sh)*scale))
	out := make([]float64, w*h)
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			r, g, bl, _ := img.At(b.Min.X+int(float64(x)/scale), b.Min.Y+int(float64(y)/scale)).RGBA()
			out[y*w+x] = 0.299*float64(r>>8) + 0.587*float64(g>>8) + 0.114*float64(bl>>8)
		}
	}
	return out, w, h
}

func mean(v []float64) float64 {
	if len(v) == 0 {
		return 0
	}
	s := 0.0
	for _, x := range v {
		s += x
	}
	return s / float64(len(v))
}

func laplacianVariance(g []float64, w, h int) float64 {
	if w < 3 || h < 3 {
		return 0
	}
	vals := make([]float64, 0, (w-2)*(h-2))
	for y := 1; y < h-1; y++ {
		for x := 1; x < w-1; x++ {
			l := g[(y-1)*w+x] + g[(y+1)*w+x] + g[y*w+x-1] + g[y*w+x+1] - 4*g[y*w+x]
			vals = append(vals, l)
		}
	}
	m := mean(vals)
	s := 0.0
	for _, v := range vals {
		s += (v - m) * (v - m)
	}
	return s / float64(len(vals))
}
