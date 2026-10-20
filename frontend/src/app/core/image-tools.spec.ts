import { MAX_RAW_BYTES, MAX_SIDE, targetSize, validateFile } from './image-tools';

describe('image tools', () => {
  it('accepts JPEG and PNG and rejects other types', () => {
    expect(validateFile({ type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(validateFile({ type: 'image/png', size: 1000 })).toBeNull();
    expect(validateFile({ type: 'image/gif', size: 1000 })).toBe('unsupported_type');
    expect(validateFile({ type: 'application/pdf', size: 1000 })).toBe('unsupported_type');
  });

  it('rejects empty and oversized files', () => {
    expect(validateFile({ type: 'image/jpeg', size: 0 })).toBe('corrupt_image');
    expect(validateFile({ type: 'image/jpeg', size: MAX_RAW_BYTES + 1 })).toBe('file_too_large');
  });

  it('never upscales and shrinks large photos to the maximum side', () => {
    expect(targetSize(800, 600)).toEqual({ w: 800, h: 600 });
    const big = targetSize(4000, 3000);
    expect(Math.max(big.w, big.h)).toBe(MAX_SIDE);
    expect(big.w / big.h).toBeCloseTo(4 / 3, 1);
  });
});
