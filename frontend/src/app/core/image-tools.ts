export const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
export const MAX_RAW_BYTES = 20 * 1024 * 1024; // before resizing
export const MIN_SIDE = 224;
export const MAX_SIDE = 1280;

/** Quick synchronous checks on the chosen file. Returns an `err.<code>` key or null. */
export function validateFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'unsupported_type';
  if (file.size > MAX_RAW_BYTES) return 'file_too_large';
  if (file.size === 0) return 'corrupt_image';
  return null;
}

/** Target size: never upscale, longest side at most MAX_SIDE. */
export function targetSize(w: number, h: number): { w: number; h: number } {
  const long = Math.max(w, h);
  if (long <= MAX_SIDE) return { w, h };
  const s = MAX_SIDE / long;
  return { w: Math.round(w * s), h: Math.round(h * s) };
}

export interface PreparedImage {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Downscales and re-encodes the photo as JPEG in the browser. This (1) speeds up
 * slow mobile uploads and (2) strips EXIF metadata such as GPS location,
 * because a canvas never carries the original metadata.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('corrupt_image'));
      i.src = url;
    });
    if (Math.min(img.naturalWidth, img.naturalHeight) < MIN_SIDE) throw new Error('image_too_small');
    const { w, h } = targetSize(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('corrupt_image');
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
    if (!blob) throw new Error('corrupt_image');
    return { blob, width: w, height: h };
  } finally {
    URL.revokeObjectURL(url);
  }
}
