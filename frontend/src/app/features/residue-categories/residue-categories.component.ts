import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MarketplaceService } from '../../core/services/marketplace.service';
import { NegotiationService } from '../../core/services/negotiation.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Listing, BulkRequirement, CropKey } from '../../core/models/marketplace.model';

interface CropCategoryMeta {
  key: CropKey;
  name: string;
  hindiName: string;
  icon: string;
  description: string;
  primaryIndustrialUse: string;
  moistureStandard: string;
  calorificBenchmark: string;
  benchmarkPriceRange: string;
  localHubBelts: string;
}

@Component({
  selector: 'app-residue-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="categories-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="breadcrumb-strip">
            <span class="badge-cat font-mono">SEPARATE CROP COMMODITY SECTIONS</span>
            <span class="text-secondary text-xs">&bull; Independent Regional Data & Benchmarks</span>
          </div>
          <h2 class="page-title">Categorized Residue Explorer</h2>
          <p class="page-subtitle">
            Every agricultural residue is managed in its own dedicated section with separated quality benchmarks, pricing, and active 100 km trade pools.
          </p>
        </div>
        <a routerLink="/proximity-radar" class="btn-radar-link">
          <app-icon name="radar" [size]="14"></app-icon>
          <span>View 100 km Radar Map</span>
        </a>
      </div>

      <!-- Category Selector Tabs (Separated Crop Residues) -->
      <div class="category-tabs-bar">
        <button
          *ngFor="let cat of cropCategories"
          type="button"
          class="cat-tab-btn"
          [class.active]="selectedCategory() === cat.key"
          (click)="selectedCategory.set(cat.key)"
        >
          <span class="cat-icon">{{ cat.icon }}</span>
          <div class="cat-names">
            <span class="cat-primary-name">{{ cat.name }}</span>
            <span class="cat-hindi-name">{{ cat.hindiName }}</span>
          </div>
          <span class="cat-count font-mono">{{ getCategoryListingsCount(cat.key) }}</span>
        </button>
      </div>

      <!-- Active Category Detail Banner -->
      <div class="active-category-card">
        <div class="cat-hero-left">
          <div class="cat-header-row">
            <span class="cat-badge-pill font-mono">STANDARDIZED COMMODITY SPECIFICATION</span>
            <span class="cat-hub-pill">📍 Scanned Range: 100 km Belt</span>
          </div>
          <h3 class="cat-hero-title">{{ currentMeta().icon }} {{ currentMeta().name }} ({{ currentMeta().hindiName }})</h3>
          <p class="cat-hero-desc">{{ currentMeta().description }}</p>

          <div class="cat-belts-row">
            <span class="belt-lbl">Major Harvesting Belts:</span>
            <span class="belt-val font-medium">{{ currentMeta().localHubBelts }}</span>
          </div>
        </div>

        <div class="cat-metrics-grid">
          <div class="cat-metric-box">
            <span class="metric-lbl">Market Benchmark Rate</span>
            <span class="metric-val font-mono">{{ currentMeta().benchmarkPriceRange }}</span>
            <span class="metric-sub">Direct farm-gate loading</span>
          </div>
          <div class="cat-metric-box">
            <span class="metric-lbl">Safe Moisture Spec</span>
            <span class="metric-val font-mono">{{ currentMeta().moistureStandard }}</span>
            <span class="metric-sub">Guaranteed boiler ready</span>
          </div>
          <div class="cat-metric-box">
            <span class="metric-lbl">Calorific Energy</span>
            <span class="metric-val font-mono">{{ currentMeta().calorificBenchmark }}</span>
            <span class="metric-sub">Net heating value</span>
          </div>
          <div class="cat-metric-box">
            <span class="metric-lbl">Primary Industrial Use</span>
            <span class="metric-val font-medium text-xs">{{ currentMeta().primaryIndustrialUse }}</span>
            <span class="metric-sub">Commercial demand</span>
          </div>
        </div>
      </div>

      <!-- 2-Column Section: Available Seller Inventory vs Industrial Buyer Demand -->
      <div class="dual-columns-grid">
        <!-- Left Column: Available Lots in this Category -->
        <div class="column-panel">
          <div class="column-header">
            <div>
              <span class="col-tag tag-sellers font-mono font-bold">🌾 AVAILABLE SELLER LOTS</span>
              <h4 class="col-title">{{ currentMeta().name }} in Your 100 KM Belt</h4>
            </div>
            <span class="col-counter font-mono">{{ activeListings().length }} Lots</span>
          </div>

          <div *ngIf="activeListings().length > 0; else noListings" class="lots-list">
            <div *ngFor="let item of activeListings()" class="lot-card">
              <div class="lot-top">
                <div>
                  <h5 class="lot-crop">{{ item.cropType }}</h5>
                  <div class="lot-farmer text-secondary text-xs">
                    {{ item.farmerName }} &bull; {{ item.district }}
                  </div>
                </div>
                <span class="lot-dist font-mono font-bold">📍 {{ item.distanceKm }} km away</span>
              </div>

              <div class="lot-specs">
                <span class="spec-tag font-mono">{{ item.quantityTons }} Tonnes in Stock</span>
                <span class="spec-tag font-mono">{{ item.moisturePercent }}% Moisture</span>
                <span class="spec-tag font-mono">{{ item.balingType }}</span>
              </div>

              <div class="lot-bottom">
                <div class="lot-price font-mono font-bold">₹{{ item.pricePerTon.toLocaleString('en-IN') }}/Ton</div>
                <button class="btn-primary btn-sm" (click)="openNegotiation(item)">
                  <span>Negotiate & Settle</span>
                  <app-icon name="arrow-right" [size]="12"></app-icon>
                </button>
              </div>
            </div>
          </div>

          <ng-template #noListings>
            <div class="empty-box">
              <app-icon name="layers" [size]="20"></app-icon>
              <span>No current seller listings for {{ currentMeta().name }} in this active 100 km hub.</span>
              <a routerLink="/new-listing" class="btn-secondary btn-sm">List {{ currentMeta().name }}</a>
            </div>
          </ng-template>
        </div>

        <!-- Right Column: Industrial Buyers Demanding this Category -->
        <div class="column-panel">
          <div class="column-header">
            <div>
              <span class="col-tag tag-buyers font-mono font-bold">🏭 FACTORY INTAKE DEMAND</span>
              <h4 class="col-title">Industrial Plants Procuring {{ currentMeta().name }}</h4>
            </div>
            <span class="col-counter font-mono">{{ activeRequirements().length }} Plants</span>
          </div>

          <div *ngIf="activeRequirements().length > 0; else noRequirements" class="lots-list">
            <div *ngFor="let buyer of activeRequirements()" class="lot-card buyer-lot-card">
              <div class="lot-top">
                <div>
                  <h5 class="lot-crop">🏭 {{ buyer.buyerOrg }}</h5>
                  <div class="lot-farmer text-secondary text-xs">{{ buyer.region }}</div>
                </div>
                <span class="lot-dist font-mono font-bold">📍 {{ buyer.distanceKm }} km away</span>
              </div>

              <div class="lot-title-desc text-xs">{{ buyer.title }}</div>

              <div class="lot-specs">
                <span class="spec-tag font-mono">Quota: {{ buyer.requiredTons }} Tonnes</span>
                <span class="spec-tag font-mono">{{ ((buyer.pooledTons / buyer.requiredTons) * 100).toFixed(0) }}% Pooled</span>
                <span class="spec-tag font-mono">Status: {{ buyer.status }}</span>
              </div>

              <div class="lot-bottom">
                <div class="lot-price font-mono font-bold">Offered: ₹{{ buyer.targetPricePerTon.toLocaleString('en-IN') }}/Ton</div>
                <a routerLink="/bulk-requirements" class="btn-primary btn-sm">
                  <span>Supply to Quota</span>
                  <app-icon name="arrow-right" [size]="12"></app-icon>
                </a>
              </div>
            </div>
          </div>

          <ng-template #noRequirements>
            <div class="empty-box">
              <app-icon name="shield" [size]="20"></app-icon>
              <span>No active bulk procurement demand for {{ currentMeta().name }} in this 100 km radius.</span>
              <a routerLink="/bulk-requirements" class="btn-secondary btn-sm">Post Intake Quota</a>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .categories-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
    }

    .breadcrumb-strip {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .badge-cat {
      font-size: 10px;
      padding: 2px 6px;
      background-color: var(--primary-text);
      color: var(--card-background);
      border-radius: 3px;
    }

    .page-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin: 0;
    }

    .page-subtitle {
      font-size: 13px;
      color: var(--secondary-text);
      margin: 4px 0 0 0;
    }

    .btn-radar-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background-color: var(--sidebar-background);
      color: var(--primary-text);
      text-decoration: none;
      transition: background-color 0.15s;
    }

    .btn-radar-link:hover {
      background-color: var(--border);
    }

    .category-tabs-bar {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
    }

    .cat-tab-btn {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background-color: var(--sidebar-background);
      cursor: pointer;
      text-align: left;
      position: relative;
      transition: all 0.15s ease;
    }

    .cat-tab-btn:hover {
      border-color: var(--primary-text);
    }

    .cat-tab-btn.active {
      border-color: var(--primary-text);
      background-color: var(--card-background);
      box-shadow: 0 3px 10px rgba(0,0,0,0.04);
    }

    .cat-icon {
      font-size: 16px;
    }

    .cat-names {
      display: flex;
      flex-direction: column;
    }

    .cat-primary-name {
      font-size: 12px;
      font-weight: 700;
      color: var(--primary-text);
    }

    .cat-hindi-name {
      font-size: 10px;
      color: var(--secondary-text);
    }

    .cat-count {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 10px;
      background-color: var(--badge-bg);
      border: 1px solid var(--border);
      color: var(--primary-text);
    }

    .active-category-card {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 20px;
      background-color: var(--card-background);
      gap: 20px;
    }

    .cat-hero-left {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .cat-header-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cat-badge-pill {
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 3px;
      background-color: var(--badge-bg);
      border: 1px solid var(--border);
      color: var(--primary-text);
    }

    .cat-hub-pill {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .cat-hero-title {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
    }

    .cat-hero-desc {
      font-size: 13px;
      color: var(--secondary-text);
      line-height: 1.5;
      margin: 0;
    }

    .cat-belts-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      margin-top: 4px;
    }

    .belt-lbl {
      color: var(--secondary-text);
    }

    .cat-metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .cat-metric-box {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 14px;
      background-color: var(--sidebar-background);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .metric-lbl {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .metric-val {
      font-size: 16px;
      font-weight: 700;
      color: var(--primary-text);
    }

    .metric-sub {
      font-size: 10px;
      color: var(--secondary-text);
    }

    .dual-columns-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .column-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .col-tag {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .tag-sellers {
      background-color: var(--badge-bg);
      border: 1px solid var(--border);
      color: var(--primary-text);
    }

    .tag-buyers {
      background-color: var(--primary-text);
      color: var(--card-background);
    }

    .col-title {
      font-size: 15px;
      font-weight: 700;
      margin: 2px 0 0 0;
    }

    .col-counter {
      font-size: 12px;
      color: var(--secondary-text);
    }

    .lots-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .lot-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      background-color: var(--card-background);
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 0.15s;
    }

    .lot-card:hover {
      border-color: var(--primary-text);
    }

    .buyer-lot-card {
      border-left: 3px solid var(--primary-text);
    }

    .lot-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }

    .lot-crop {
      font-size: 14px;
      font-weight: 700;
      margin: 0;
    }

    .lot-dist {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: var(--badge-bg);
      border: 1px solid var(--border);
      white-space: nowrap;
    }

    .lot-specs {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .spec-tag {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      color: var(--primary-text);
    }

    .lot-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
      padding-top: 8px;
      border-top: 1px solid var(--border);
    }

    .lot-price {
      font-size: 14px;
    }

    .empty-box {
      border: 1px dashed var(--border);
      border-radius: 8px;
      padding: 32px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--secondary-text);
      font-size: 12px;
      text-align: center;
    }

    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .font-medium { font-weight: 500; }
    .text-xs { font-size: 11px; }
    .text-secondary { color: var(--secondary-text); }

    @media (max-width: 960px) {
      .category-tabs-bar {
        grid-template-columns: repeat(2, 1fr);
      }
      .active-category-card {
        grid-template-columns: 1fr;
      }
      .dual-columns-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ResidueCategoriesComponent {
  marketplaceService = inject(MarketplaceService);
  private negotiationService = inject(NegotiationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  selectedCategory = signal<CropKey>('paddy');

  readonly cropCategories: CropCategoryMeta[] = [
    {
      key: 'paddy',
      name: 'Paddy Straw',
      hindiName: 'धान की पराली',
      icon: '🌾',
      description: 'High-cellulose cereal crop residue mechanically baled. Essential for 2G Bio-Ethanol plants and thermal power plant co-firing.',
      primaryIndustrialUse: 'NTPC Boiler Pellets & IOCL 2G Bio-Ethanol Refineries',
      moistureStandard: '< 11.0% Mandatory',
      calorificBenchmark: '3,350 kcal/kg',
      benchmarkPriceRange: '₹2,100 - ₹2,350/t',
      localHubBelts: 'Sonipat, Murthal, Panipat, Karnal & Halagur Arkavathi'
    },
    {
      key: 'wheat',
      name: 'Wheat Stubble',
      hindiName: 'गेहूं का भूसा / तुड़ी',
      icon: '🌾',
      description: 'Compressed round and square stubble bales. High fiber suitable for corrugated kraft paper packaging mills and dairy feed.',
      primaryIndustrialUse: 'Eco-Kraft Paper Mill Boards & Commercial Dairy Fodder',
      moistureStandard: '< 9.5% Dry Certified',
      calorificBenchmark: '3,450 kcal/kg',
      benchmarkPriceRange: '₹1,950 - ₹2,050/t',
      localHubBelts: 'Bahadurgarh, Jhajjar, Rohtak & Western Haryana Belt'
    },
    {
      key: 'mustard',
      name: 'Mustard Husk',
      hindiName: 'सरसों का ढूंड व ब्रिकेट्स',
      icon: '🌾',
      description: 'Dense 90mm cylindrical biomass briquettes made from compressed mustard stalk chaff. Zero-smoke high-calorific coal replacement.',
      primaryIndustrialUse: 'Industrial Heat Furnaces, Glass Works & Dye Boilers',
      moistureStandard: '< 8.5% Low Moisture',
      calorificBenchmark: '3,900 kcal/kg',
      benchmarkPriceRange: '₹1,750 - ₹1,850/t',
      localHubBelts: 'Manesar, Gurugram, Rewari, Palwal & Alwar Border'
    },
    {
      key: 'sugarcane',
      name: 'Sugarcane Bagasse',
      hindiName: 'गन्ने की खोई व पैलेट्स',
      icon: '🎋',
      description: 'Fibrous residue from sugar juice extraction, compressed into 10mm fuel pellets. Standardized biomass co-generation fuel.',
      primaryIndustrialUse: 'Sugar Mill Cogeneration Boilers & Fiber Packaging Mills',
      moistureStandard: '< 12.0% Pelleted',
      calorificBenchmark: '3,800 kcal/kg',
      benchmarkPriceRange: '₹1,850 - ₹2,100/t',
      localHubBelts: 'Modinagar, Meerut, Muzaffarnagar & Channapatna'
    },
    {
      key: 'ragi',
      name: 'Ragi Straw',
      hindiName: 'रागी हुल्लु / मडुआ',
      icon: '🌾',
      description: 'MR-1 finger millet straw compressed into square bales. Highly palatable cattle fodder and Harohalli KIADB industrial boiler fuel.',
      primaryIndustrialUse: 'Harohalli Green Energy Boilers & Taluk Dairy Co-ops',
      moistureStandard: '< 10.5% Farm Tested',
      calorificBenchmark: '3,450 kcal/kg',
      benchmarkPriceRange: '₹2,400 - ₹2,600/t',
      localHubBelts: 'Harohalli KIADB, Jakkasandra, Kanakapura & Ramanagara'
    },
    {
      key: 'mulberry',
      name: 'Mulberry Stems',
      hindiName: 'रेशम सूखी डंडी',
      icon: '🌿',
      description: 'Dense dried hardwood silk stalks from sericulture prunings. Burns with intense long-lasting coals with minimal ash residue.',
      primaryIndustrialUse: 'Silk Reeling Steam Boilers & Industrial Biomass Heat',
      moistureStandard: '< 9.0% Sun Dried',
      calorificBenchmark: '4,100 kcal/kg',
      benchmarkPriceRange: '₹2,250 - ₹2,350/t',
      localHubBelts: 'Kanakapura Silk City, Halagur & Channapatna Mandi'
    }
  ];

  currentMeta = computed(() => {
    const key = this.selectedCategory();
    return this.cropCategories.find(c => c.key === key) || this.cropCategories[0];
  });

  activeListings = computed(() => {
    const key = this.selectedCategory();
    return this.marketplaceService.listings().filter(item => item.cropKey === key && item.distanceKm <= 100);
  });

  activeRequirements = computed(() => {
    const meta = this.currentMeta();
    const qName = meta.name.toLowerCase();
    const qKey = meta.key.toLowerCase();

    return this.marketplaceService.bulkRequirements().filter(req => {
      const matchCrop = req.cropType.toLowerCase().includes(qKey) ||
                        req.cropType.toLowerCase().includes(qName) ||
                        req.title.toLowerCase().includes(qKey);
      const inRadius = (req.distanceKm ?? 999) <= 100;
      return matchCrop && inRadius;
    });
  });

  getCategoryListingsCount(key: CropKey): number {
    return this.marketplaceService.listings().filter(l => l.cropKey === key && l.distanceKm <= 100).length;
  }

  openNegotiation(item: Listing): void {
    this.negotiationService.startNegotiationWithListing(
      item,
      this.authService.currentUser()?.name || 'Verified Buyer'
    );
    this.router.navigate(['/negotiations']);
  }
}
