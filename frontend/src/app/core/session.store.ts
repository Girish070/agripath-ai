import { Injectable, signal } from '@angular/core';
import { DetectResponse } from './api.service';

/**
 * Holds the current photo and analysis IN MEMORY ONLY, so the person can
 * switch language or browse the disease library and come back to the result
 * without re-uploading. Nothing is written to disk or localStorage; a page
 * reload clears it (privacy by default).
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  readonly previewUrl = signal<string | null>(null);
  readonly result = signal<DetectResponse | null>(null);

  setPreview(url: string | null): void {
    const old = this.previewUrl();
    if (old && old !== url) URL.revokeObjectURL(old);
    this.previewUrl.set(url);
  }

  clear(): void {
    this.setPreview(null);
    this.result.set(null);
  }
}
