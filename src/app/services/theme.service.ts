import { DestroyRef, inject, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private destroyRef = inject(DestroyRef);

  readonly currentTheme = signal<Theme>(this.detectTheme());

  constructor() {
    const observer = new MutationObserver(() => {
      this.currentTheme.set(this.detectTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-bs-theme'],
    });

    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private detectTheme(): Theme {
    return document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
  }
}
