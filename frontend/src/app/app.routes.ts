import { Routes } from '@angular/router';

/** Every page is lazy-loaded so the first download stays small on slow mobile networks. */
export const routes: Routes = [
  { path: '', data: { titleKey: 'nav.home' }, loadComponent: () => import('./pages/home').then((m) => m.HomePage) },
  { path: 'detect', data: { titleKey: 'nav.detect' }, loadComponent: () => import('./pages/detect').then((m) => m.DetectPage) },
  { path: 'results', data: { titleKey: 'nav.results' }, loadComponent: () => import('./pages/results').then((m) => m.ResultsPage) },
  { path: 'diseases', data: { titleKey: 'nav.diseases' }, loadComponent: () => import('./pages/diseases').then((m) => m.DiseasesPage) },
  { path: 'diseases/:id', data: { titleKey: 'nav.diseases' }, loadComponent: () => import('./pages/disease-detail').then((m) => m.DiseaseDetailPage) },
  { path: 'seasons', data: { titleKey: 'nav.seasons' }, loadComponent: () => import('./pages/seasons').then((m) => m.SeasonsPage) },
  { path: 'care', data: { titleKey: 'nav.care' }, loadComponent: () => import('./pages/care').then((m) => m.CarePage) },
  { path: 'research', data: { titleKey: 'nav.research' }, loadComponent: () => import('./pages/research').then((m) => m.ResearchPage) },
  { path: 'weather', data: { titleKey: 'nav.weather' }, loadComponent: () => import('./pages/weather').then((m) => m.WeatherPage) },
  { path: 'about', data: { titleKey: 'nav.about' }, loadComponent: () => import('./pages/about').then((m) => m.AboutPage) },
  { path: 'help', data: { titleKey: 'nav.help' }, loadComponent: () => import('./pages/help').then((m) => m.HelpPage) },
  { path: '**', redirectTo: '' },
];
