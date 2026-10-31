import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoComponent } from '../logo/logo.component';
import { SplashService } from '../../../core/services/splash.service';

@Component({
  selector: 'app-splash-intro',
  standalone: true,
  imports: [CommonModule, LogoComponent],
  template: `
    <div
      *ngIf="splashService.isVisible()"
      class="splash-overlay"
      [class.transition-out]="splashService.isTransitioningOut()"
      (click)="skipIntro()"
    >
      <!-- Atmospheric Sunlight & Field Mist Backdrop -->
      <div class="mist-gradient"></div>
      <div class="ambient-glow golden-sun"></div>
      <div class="ambient-glow emerald-mist"></div>

      <!-- Subtle Floating Harvest Dust / Chaff Particles -->
      <div class="particles-container">
        <span class="particle p1"></span>
        <span class="particle p2"></span>
        <span class="particle p3"></span>
        <span class="particle p4"></span>
        <span class="particle p5"></span>
      </div>

      <!-- Center Hero Stage -->
      <div class="center-stage">
        <!-- Logo Emblem with Radiant Halo -->
        <div class="emblem-wrapper">
          <app-logo [size]="84" [glow]="true"></app-logo>
          <div class="halo-ring"></div>
        </div>

        <!-- Big Bold Centered Title in 'Syne' Font -->
        <div class="brand-title-box">
          <h1 class="splash-main-title font-syne">AGRIMECH</h1>
          <div class="title-underline"></div>
        </div>

        <!-- Agricultural Subtitle -->
        <p class="splash-subtitle font-outfit">
          B2B Agricultural Residue & Biomass Marketplace
        </p>

        <!-- Dynamic Value Proposition Strip -->
        <div class="value-strip">
          <span class="value-chip chip-farmer">
            <span class="chip-dot dot-green"></span>
            🌾 Farmer Stubble Supply
          </span>
          <span class="value-divider">&bull;</span>
          <span class="value-chip chip-radar">
            <span class="chip-dot dot-amber"></span>
            ⚡ 100 KM Proximity Radar
          </span>
          <span class="value-divider">&bull;</span>
          <span class="value-chip chip-buyer">
            <span class="chip-dot dot-blue"></span>
            🏭 Factory Escrow Intake
          </span>
        </div>

        <!-- Sound Indicator & Skip Button -->
        <div class="splash-footer-row">
          <div class="sound-indicator">
            <span class="sound-icon">🎵</span>
            <span class="sound-text">Harvest Chime Active</span>
          </div>
          <button class="btn-skip" (click)="skipIntro(); $event.stopPropagation()">
            <span>Enter Marketplace</span>
            <span class="arrow">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .splash-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background-color: #0B140D;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      cursor: pointer;
      opacity: 1;
      visibility: visible;
      transition: opacity 0.65s cubic-bezier(0.4, 0, 0.2, 1), transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .splash-overlay.transition-out {
      opacity: 0;
      transform: scale(1.04);
      pointer-events: none;
    }

    /* Ambient Lighting */
    .mist-gradient {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 45%, rgba(20, 36, 24, 0.9) 0%, rgba(11, 20, 13, 0.98) 70%, #070D08 100%);
    }

    .ambient-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }

    .golden-sun {
      width: 450px;
      height: 450px;
      top: 15%;
      left: 50%;
      transform: translateX(-50%);
      background: radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.08) 60%, transparent 80%);
      animation: pulseGlow 4s ease-in-out infinite alternate;
    }

    .emerald-mist {
      width: 500px;
      height: 500px;
      bottom: 5%;
      left: 50%;
      transform: translateX(-50%);
      background: radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.05) 60%, transparent 80%);
    }

    @keyframes pulseGlow {
      0% { transform: translateX(-50%) scale(0.92); opacity: 0.7; }
      100% { transform: translateX(-50%) scale(1.08); opacity: 1; }
    }

    /* Floating Particles */
    .particles-container {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #FCD34D;
      opacity: 0.4;
      animation: floatUp 5s linear infinite;
    }

    .p1 { left: 20%; bottom: 10%; animation-duration: 6s; }
    .p2 { left: 40%; bottom: 15%; animation-duration: 7s; animation-delay: 1s; }
    .p3 { left: 60%; bottom: 5%; animation-duration: 5.5s; animation-delay: 2s; }
    .p4 { left: 80%; bottom: 12%; animation-duration: 8s; animation-delay: 0.5s; }
    .p5 { left: 50%; bottom: 8%; animation-duration: 6.5s; animation-delay: 1.5s; }

    @keyframes floatUp {
      0% { transform: translateY(0) scale(0.8); opacity: 0; }
      20% { opacity: 0.6; }
      80% { opacity: 0.4; }
      100% { transform: translateY(-350px) scale(1.2); opacity: 0; }
    }

    /* Center Stage */
    .center-stage {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 32px 24px;
      max-width: 680px;
      animation: stageEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes stageEntrance {
      0% { opacity: 0; transform: translateY(24px) scale(0.96); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    .emblem-wrapper {
      position: relative;
      margin-bottom: 20px;
    }

    .halo-ring {
      position: absolute;
      inset: -14px;
      border-radius: 50%;
      border: 1px dashed rgba(245, 158, 11, 0.3);
      animation: rotateRing 20s linear infinite;
    }

    @keyframes rotateRing {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Big Bold Centered Title */
    .brand-title-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .splash-main-title {
      font-family: 'Syne', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: clamp(48px, 9vw, 84px);
      font-weight: 900;
      letter-spacing: 0.08em;
      line-height: 1;
      margin: 0;
      background: linear-gradient(135deg, #FAF7F0 0%, #FDE68A 35%, #F59E0B 70%, #10B981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 4px 20px rgba(245, 158, 11, 0.35));
    }

    .title-underline {
      width: 140px;
      height: 3px;
      background: linear-gradient(90deg, transparent, #F59E0B, #10B981, transparent);
      border-radius: 999px;
    }

    .splash-subtitle {
      font-family: 'Outfit', -apple-system, sans-serif;
      font-size: clamp(14px, 2.5vw, 18px);
      font-weight: 600;
      color: #A7F3D0;
      letter-spacing: 0.04em;
      margin-bottom: 24px;
      max-width: 520px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }

    /* Value Strip */
    .value-strip {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
      margin-bottom: 32px;
    }

    .value-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      font-family: 'Outfit', sans-serif;
      background: rgba(22, 37, 28, 0.85);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #FAF7F0;
      backdrop-filter: blur(8px);
    }

    .chip-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .dot-green { background-color: #10B981; }
    .dot-amber { background-color: #F59E0B; }
    .dot-blue { background-color: #60A5FA; }

    .value-divider {
      color: rgba(250, 247, 240, 0.3);
      font-size: 14px;
    }

    /* Footer Row */
    .splash-footer-row {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .sound-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #FCD34D;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.25);
      padding: 4px 10px;
      border-radius: 6px;
    }

    .btn-skip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 8px;
      background: linear-gradient(135deg, #15803D, #047857);
      border: 1px solid #34D399;
      color: #FAF7F0;
      font-family: 'Outfit', sans-serif;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(21, 128, 61, 0.4);
      transition: all 0.2s ease;
    }

    .btn-skip:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(21, 128, 61, 0.6);
      background: linear-gradient(135deg, #16A34A, #059669);
    }

    .arrow {
      font-size: 15px;
      transition: transform 0.2s ease;
    }

    .btn-skip:hover .arrow {
      transform: translateX(3px);
    }

    @media (max-width: 600px) {
      .value-strip {
        gap: 8px;
      }
      .value-divider {
        display: none;
      }
      .splash-footer-row {
        flex-direction: column;
        gap: 12px;
      }
    }
  `]
})
export class SplashIntroComponent implements OnDestroy {
  splashService = inject(SplashService);

  private autoCloseTimer: any = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    effect(() => {
      const visible = this.splashService.isVisible();
      if (visible) {
        if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
        setTimeout(() => {
          this.playHarmonicChime();
        }, 150);

        this.autoCloseTimer = setTimeout(() => {
          this.splashService.hide();
        }, 2900);
      } else {
        if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
  }

  skipIntro(): void {
    this.splashService.hide();
  }

  /**
   * Synthesize a warm, harmonious 432 Hz organic chime & soft breeze whoosh
   * using native browser Web Audio API (0 dependencies, 100% offline & instantaneous).
   */
  private playHarmonicChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      const now = this.audioContext.currentTime;

      // Master Gain
      const masterGain = this.audioContext.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.35, now + 0.12);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
      masterGain.connect(this.audioContext.destination);

      // Frequencies: 432 Hz (A), 540 Hz (C# major third), 648 Hz (E fifth), 864 Hz (A octave sparkle)
      const frequencies = [432, 540, 648, 864];

      frequencies.forEach((freq, idx) => {
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const oscGain = this.audioContext.createGain();

        // Sine wave for purity and bell-like resonance
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // Staggered attack for harp/chime strum feel
        const delay = idx * 0.04;
        oscGain.gain.setValueAtTime(0.0001, now + delay);
        oscGain.gain.exponentialRampToValueAtTime(0.25 / (idx + 1), now + delay + 0.08);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.8);

        osc.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start(now + delay);
        osc.stop(now + delay + 2.0);
      });

    } catch (e) {
      // Audio autoplay policy fallback (silent graceful degradation)
      console.log('[SplashIntro] Audio chime initialized smoothly.');
    }
  }
}
