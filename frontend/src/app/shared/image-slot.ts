import { Component, inject, input, signal } from '@angular/core';
import { I18n } from '../core/i18n.service';

/**
 * A captioned photo that falls back to a clear "add photo" placeholder when
 * the file does not exist yet - never a fabricated example image.
 */
@Component({
  selector: 'app-image-slot',
  template: `
    <figure class="slot">
      @if (src() && !failed()) {
        <img [src]="src()" [alt]="caption()" loading="lazy" decoding="async" (error)="failed.set(true)" />
      } @else {
        <div class="slot-empty" role="img" [attr.aria-label]="caption()">
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M19 7h-1.2l-1.2-2H7.4L6.2 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Zm-7 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"/></svg>
          <span>{{ i18n.t('gallery.empty') }}</span>
          @if (hint()) {<code>{{ hint() }}</code>}
        </div>
      }
      <figcaption>
        {{ caption() }}
        @if (credit() && src() && !failed()) {<small>{{ credit() }}</small>}
      </figcaption>
    </figure>
  `,
})
export class ImageSlotComponent {
  readonly i18n = inject(I18n);
  readonly src = input<string | null>(null);
  readonly caption = input.required<string>();
  readonly credit = input('');
  readonly hint = input('');
  readonly failed = signal(false);
}
