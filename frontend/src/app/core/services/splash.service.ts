import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SplashService {
  isVisible = signal<boolean>(false);
  isTransitioningOut = signal<boolean>(false);

  constructor() {
    // Only show on first launch in the tab session if not previously seen
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const seen = sessionStorage.getItem('agrimech_intro_seen');
      if (seen !== 'true') {
        this.isVisible.set(true);
      }
    }
  }

  show(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('agrimech_intro_seen');
    }
    this.isVisible.set(true);
    this.isTransitioningOut.set(false);
  }

  hide(): void {
    this.isTransitioningOut.set(true);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('agrimech_intro_seen', 'true');
    }
    setTimeout(() => {
      this.isVisible.set(false);
      this.isTransitioningOut.set(false);
    }, 650);
  }
}
