import { Component, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { I18n } from './core/i18n.service';

interface NavItem {
  path: string;
  key: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  readonly i18n = inject(I18n);
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);
  readonly nav: NavItem[] = [
    { path: '/detect', key: 'nav.detect' },
    { path: '/diseases', key: 'nav.diseases' },
    { path: '/seasons', key: 'nav.seasons' },
    { path: '/care', key: 'nav.care' },
    { path: '/research', key: 'nav.research' },
    { path: '/weather', key: 'nav.weather' },
    { path: '/about', key: 'nav.about' },
    { path: '/help', key: 'nav.help' },
  ];

  private readonly titleKey = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => {
        let r = this.router.routerState.snapshot.root;
        while (r.firstChild) r = r.firstChild;
        return (r.data['titleKey'] as string | undefined) ?? 'nav.home';
      }),
    ),
    { initialValue: 'nav.home' },
  );

  constructor() {
    // Keep the browser tab title in the chosen language.
    effect(() => {
      document.title = `${this.i18n.t(this.titleKey())} · AGRIPATH AI`;
    });
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.menuOpen.set(false));
  }

  readonly year = new Date().getFullYear();
}
