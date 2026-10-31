import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppLayoutComponent } from './layout/app-layout.component';
import { SplashIntroComponent } from './shared/components/splash-intro/splash-intro.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AppLayoutComponent, SplashIntroComponent],
  template: `
    <app-splash-intro></app-splash-intro>
    <app-layout></app-layout>
  `
})
export class AppComponent {}
