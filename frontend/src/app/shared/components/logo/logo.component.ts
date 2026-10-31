import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="agrimech-logo-container"
      [class.centered]="centered"
      [class.has-glow]="glow"
      [class.layout-vertical]="layout === 'vertical'"
    >
      <!-- SVG Emblem: Fusion of Wheat Sheaf, Sprouting Leaf & Bio-Mechanical Cogwheel -->
      <svg
        [attr.width]="size"
        [attr.height]="size"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="logo-svg"
      >
        <defs>
          <!-- Golden Harvest Gradient -->
          <linearGradient id="harvestGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FCD34D" />
            <stop offset="50%" stop-color="#F59E0B" />
            <stop offset="100%" stop-color="#B45309" />
          </linearGradient>

          <!-- Lush Emerald Sprout Gradient -->
          <linearGradient id="sproutGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#34D399" />
            <stop offset="60%" stop-color="#10B981" />
            <stop offset="100%" stop-color="#047857" />
          </linearGradient>

          <!-- Deep Organic Soil Ring Gradient -->
          <linearGradient id="soilBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#15803D" />
            <stop offset="100%" stop-color="#D97706" />
          </linearGradient>

          <!-- Ambient Glow Filter -->
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Outer Mechanical Bio-Energy Gear Ring -->
        <circle
          cx="32"
          cy="32"
          r="29"
          stroke="url(#soilBorder)"
          stroke-width="1.8"
          stroke-dasharray="3 2"
          opacity="0.85"
        />

        <!-- Precision Mechanical Cog Teeth (Representing "Mech") -->
        <g stroke="url(#harvestGold)" stroke-width="2" stroke-linecap="round" opacity="0.9">
          <!-- 8 Radial Gear Teeth Nodes -->
          <line x1="32" y1="2" x2="32" y2="6" />
          <line x1="32" y1="58" x2="32" y2="62" />
          <line x1="2" y1="32" x2="6" y2="32" />
          <line x1="58" y1="32" x2="62" y2="32" />
          <line x1="10.8" y1="10.8" x2="13.6" y2="13.6" />
          <line x1="50.4" y1="50.4" x2="53.2" y2="53.2" />
          <line x1="10.8" y1="53.2" x2="13.6" y2="50.4" />
          <line x1="50.4" y1="13.6" x2="53.2" y2="10.8" />
        </g>

        <!-- Inner Dark Soil Disc for High Contrast Badge -->
        <circle cx="32" cy="32" r="24" fill="#0E1911" />

        <!-- Left Sprout Leaf (Agricultural Renewal) -->
        <path
          d="M32 46 C20 44 14 34 18 20 C24 24 28 32 32 46 Z"
          fill="url(#sproutGreen)"
          opacity="0.95"
        />

        <!-- Right Golden Wheat Grains & Sheaf (Agricultural Harvest) -->
        <path
          d="M32 46 C44 44 50 34 46 20 C40 24 36 32 32 46 Z"
          fill="url(#harvestGold)"
          opacity="0.95"
        />

        <!-- Central Sprout Stem / Energy Line -->
        <path
          d="M32 50 L32 12"
          stroke="#FAF7F0"
          stroke-width="2"
          stroke-linecap="round"
        />

        <!-- Wheat Kernels / Grains (Alternating angled grains) -->
        <g stroke="#FAF7F0" stroke-width="1.8" stroke-linecap="round">
          <!-- Wheat Head Tip -->
          <circle cx="32" cy="11" r="1.5" fill="#FCD34D" stroke="none" />
          <!-- Grain Pairs -->
          <line x1="32" y1="18" x2="38" y2="14" />
          <line x1="32" y1="23" x2="26" y2="19" />
          <line x1="32" y1="28" x2="39" y2="24" />
          <line x1="32" y1="33" x2="25" y2="29" />
          <line x1="32" y1="38" x2="38" y2="35" />
        </g>

        <!-- Core Energy Spark -->
        <circle cx="32" cy="46" r="2.5" fill="#F59E0B" />
      </svg>

      <!-- Optional Wordmark & Tagline -->
      <div *ngIf="showText" class="logo-text-group" [class.text-center]="centered">
        <div class="logo-title-row">
          <span class="logo-title font-syne" [ngClass]="'size-' + textSize">AGRIMECH</span>
          <span class="logo-leaf-dot">🌱</span>
        </div>
        <span *ngIf="showTagline" class="logo-tagline font-outfit">
          B2B Biomass & Bio-Energy Marketplace
        </span>
      </div>
    </div>
  `,
  styles: [`
    .agrimech-logo-container {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      user-select: none;
      vertical-align: middle;
    }

    .agrimech-logo-container.centered {
      justify-content: center;
      text-align: center;
    }

    .agrimech-logo-container.layout-vertical {
      flex-direction: column;
      gap: 10px;
    }

    .logo-svg {
      flex-shrink: 0;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      filter: drop-shadow(0 2px 8px rgba(21, 128, 61, 0.25));
    }

    .agrimech-logo-container:hover .logo-svg {
      transform: scale(1.06) rotate(3deg);
    }

    .has-glow .logo-svg {
      filter: drop-shadow(0 0 16px rgba(245, 158, 11, 0.45)) drop-shadow(0 0 30px rgba(16, 185, 129, 0.25));
    }

    .logo-text-group {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .logo-text-group.text-center {
      align-items: center;
    }

    .logo-title-row {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .logo-title {
      font-family: 'Syne', -apple-system, sans-serif;
      font-weight: 900;
      letter-spacing: 0.06em;
      line-height: 1;
      background: linear-gradient(135deg, #10B981 0%, #059669 45%, #D97706 80%, #F59E0B 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .size-sm { font-size: 16px; }
    .size-md { font-size: 20px; }
    .size-lg { font-size: 28px; }
    .size-xl { font-size: 40px; }

    .logo-leaf-dot {
      font-size: 14px;
      line-height: 1;
      display: inline-block;
      animation: floatLeaf 3s ease-in-out infinite alternate;
    }

    @keyframes floatLeaf {
      0% { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(-2px) rotate(8deg); }
    }

    .logo-tagline {
      font-family: 'Outfit', -apple-system, sans-serif;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--secondary-text);
      opacity: 0.9;
    }
  `]
})
export class LogoComponent {
  @Input() size: number = 36;
  @Input() showText: boolean = false;
  @Input() showTagline: boolean = false;
  @Input() textSize: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() centered: boolean = false;
  @Input() layout: 'horizontal' | 'vertical' = 'horizontal';
  @Input() glow: boolean = false;
}
