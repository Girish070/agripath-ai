import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';
import { I18n } from './core/i18n.service';

describe('App shell', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
  });

  it('renders the AGRIPATH AI brand and 8 navigation links', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.brand')?.textContent).toContain('AGRIPATH AI');
    expect(el.querySelectorAll('.nav-desktop a').length).toBe(8);
  });

  it('switches the whole shell to Marathi and back', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll<HTMLButtonElement>('.lang-toggle button');
    buttons[1].click();
    await fixture.whenStable();
    expect(el.querySelector('.nav-desktop a')?.textContent).toContain('रोग ओळखा');
    expect(TestBed.inject(I18n).lang()).toBe('mr');
    buttons[0].click();
    await fixture.whenStable();
    expect(el.querySelector('.nav-desktop a')?.textContent).toContain('Detect disease');
  });
});
