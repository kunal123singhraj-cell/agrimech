import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode = signal<boolean>(false);

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const savedTheme = localStorage.getItem('agrimech-theme');
    if (savedTheme) {
      this.setTheme(savedTheme === 'dark');
    } else {
      // Default to the warm farmer-coded aesthetic (light mode)
      this.setTheme(false);
    }
  }

  toggleTheme(): void {
    this.setTheme(!this.isDarkMode());
  }

  setTheme(dark: boolean): void {
    this.isDarkMode.set(dark);
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('agrimech-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('agrimech-theme', 'light');
    }
  }
}
