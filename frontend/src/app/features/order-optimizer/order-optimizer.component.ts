import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MarketplaceService } from '../../core/services/marketplace.service';
import { OrderOptimizerService, OptimizationResult } from '../../core/services/order-optimizer.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CropKey } from '../../core/models/marketplace.model';

@Component({
  selector: 'app-order-optimizer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="optimizer-page">
      <!-- Ambient Sunburst -->
      <div class="ambient-glow"></div>

      <!-- Hero Header -->
      <div class="optimizer-header">
        <div class="header-left">
          <div class="usp-badge font-outfit">
            <span class="usp-dot"></span>
            USP 1: INTELLIGENT MULTI-FARMER ORDER OPTIMIZER
          </div>
          <h1 class="page-title font-syne">Automated Multi-Farmer Residue Sourcing</h1>
          <p class="page-subtitle font-outfit">
            Bundle smallholder harvests within your regional radius into a single commercial consignment with minimized freight, guaranteed boiler specs, and locked 50% advance escrow.
          </p>
        </div>

        <div class="header-hub-indicator">
          <div class="hub-radar-dot"></div>
          <div>
            <div class="hub-label">Active Reference Hub</div>
            <div class="hub-name font-outfit">{{ marketplaceService.currentHub().shortName }}</div>
          </div>
        </div>
      </div>

      <!-- Interactive Optimization Control Panel -->
      <div class="control-card">
        <div class="control-grid">
          <!-- Target Tonnage Slider & Quick Presets -->
          <div class="control-col">
            <div class="col-header">
              <label class="control-label">Target Procurement Quota</label>
              <span class="target-val-badge font-outfit">{{ targetTons() }} Tonnes</span>
            </div>
            <input
              type="range"
              min="20"
              max="1500"
              step="10"
              [ngModel]="targetTons()"
              (ngModelChange)="targetTons.set($event); runOptimization()"
              class="range-slider"
            />
            <div class="preset-pills">
              <button
                *ngFor="let preset of [50, 150, 250, 500, 1000]"
                class="pill-btn"
                [class.active]="targetTons() === preset"
                (click)="targetTons.set(preset); runOptimization()"
              >
                {{ preset }}T
              </button>
            </div>
          </div>

          <!-- Crop Selection -->
          <div class="control-col">
            <label class="control-label">Residue Feedstock Type</label>
            <select
              [ngModel]="selectedCrop()"
              (ngModelChange)="selectedCrop.set($event); runOptimization()"
              class="form-select"
            >
              <option value="all">🌾 All Compatible Crops (Multi-Crop Blend)</option>
              <option value="paddy">Paddy Straw (Sona Masoori / Basmati)</option>
              <option value="wheat">Wheat Stubble</option>
              <option value="sugarcane">Sugarcane Bagasse Pellets</option>
              <option value="ragi">Ragi Straw (ರಾಗಿ ಹುಲ್ಲು)</option>
              <option value="mulberry">Mulberry Dried Stems (ರೇಷ್ಮೆ)</option>
              <option value="coconut">Coconut Shell & Coir</option>
              <option value="maize">Maize Stover</option>
            </select>
          </div>

          <!-- Optimization Objective / Priority -->
          <div class="control-col">
            <label class="control-label">Optimization Algorithm Goal</label>
            <select
              [ngModel]="selectedPriority()"
              (ngModelChange)="selectedPriority.set($event); runOptimization()"
              class="form-select"
            >
              <option value="optimal_landed_cost">💰 Lowest Landed Cost (Min Freight + Price)</option>
              <option value="highest_aqi_quality">⭐ Highest Quality (Max AQI Score, &lt;12% Moisture)</option>
              <option value="nearest_proximity">📍 Shortest Proximity Radius (Fastest Dispatch)</option>
            </select>
          </div>

          <!-- Radius Scope -->
          <div class="control-col">
            <div class="col-header">
              <label class="control-label">Max Transit Radius</label>
              <span class="radius-val font-outfit">{{ maxRadius() >= 1000 ? 'Pan-India' : maxRadius() + ' km' }}</span>
            </div>
            <input
              type="range"
              min="25"
              max="1000"
              step="25"
              [ngModel]="maxRadius()"
              (ngModelChange)="maxRadius.set($event); runOptimization()"
              class="range-slider"
            />
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div *ngIf="optimizationResult() as res" class="kpi-grid">
        <div class="kpi-card highlight-green">
          <div class="kpi-icon">🌾</div>
          <div class="kpi-body">
            <div class="kpi-title">Consolidated Tonnage</div>
            <div class="kpi-value font-syne">{{ res.allocatedTonnage }} / {{ res.targetTonnage }} T</div>
            <div class="kpi-sub">
              <span class="kpi-badge font-outfit">{{ res.fulfillmentPercent }}% Fulfilled</span>
              <span>across {{ res.farmersCount }} farms</span>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">🚚</div>
          <div class="kpi-body">
            <div class="kpi-title">Weighted Landed Rate</div>
            <div class="kpi-value font-syne">₹{{ res.landedPricePerTon.toLocaleString('en-IN') }} <span class="unit">/ tonne</span></div>
            <div class="kpi-sub">
              <span>Ex-farm: ₹{{ res.weightedAvgPricePerTon }}</span> &bull; 
              <span>Avg Dist: {{ res.weightedAvgDistanceKm }} km</span>
            </div>
          </div>
        </div>

        <div class="kpi-card highlight-amber">
          <div class="kpi-icon">💎</div>
          <div class="kpi-body">
            <div class="kpi-title">Consolidated Savings</div>
            <div class="kpi-value font-syne">₹{{ res.estimatedSavingsInr.toLocaleString('en-IN') }}</div>
            <div class="kpi-sub">vs. unoptimized spot freight rates</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">⭐</div>
          <div class="kpi-body">
            <div class="kpi-title">Avg Quality AQI</div>
            <div class="kpi-value font-syne">{{ res.avgAqiScore }} <span class="unit">/ 100</span></div>
            <div class="kpi-sub">
              <span class="aqi-pill font-outfit">{{ res.avgAqiScore >= 90 ? 'Boiler Premium' : 'Factory Grade' }}</span>
              <span>&bull; {{ res.trucksTotal }} trucks</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bundled Farmers Manifest Table -->
      <div *ngIf="optimizationResult() as res" class="manifest-card">
        <div class="manifest-header">
          <div>
            <h3 class="manifest-title font-syne">Optimized Farmer Sourcing Basket ({{ res.bundles.length }} Verified Lots)</h3>
            <p class="manifest-subtitle font-outfit">
              Algorithm selected the optimal combination of smallholder farmers to satisfy {{ res.allocatedTonnage }} tonnes with lowest transit footprint.
            </p>
          </div>

          <div class="manifest-actions">
            <button
              class="btn-reserve-bundle"
              [disabled]="isReserving() || res.bundles.length === 0"
              (click)="reserveAllBundledLots()"
            >
              <span class="lock-icon">🔒</span>
              <span>{{ isReserving() ? 'Locking 24h Stock...' : 'Reserve All Bundled Lots (24h Hold)' }}</span>
            </button>
          </div>
        </div>

        <div *ngIf="reservationSuccessMessage()" class="reservation-alert-banner">
          <span class="alert-icon">✓</span>
          <span>{{ reservationSuccessMessage() }}</span>
        </div>

        <div class="bundles-table-wrapper">
          <table class="bundles-table font-outfit">
            <thead>
              <tr>
                <th>FARMER & ORIGIN</th>
                <th>CROP LOT</th>
                <th>ALLOCATED / AVAILABLE</th>
                <th>AQI QUALITY</th>
                <th>DISTANCE</th>
                <th>EX-FARM RATE</th>
                <th>EST. FREIGHT</th>
                <th>LANDED COST</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of res.bundles; let i = index">
                <td>
                  <div class="farmer-cell">
                    <div class="farmer-avatar">{{ item.farmerName.substring(0, 1) }}</div>
                    <div>
                      <div class="farmer-name">{{ item.farmerName }}</div>
                      <div class="farmer-sub">{{ item.district }}, {{ item.state }} &bull; {{ item.farmerPhone }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="crop-tag">{{ item.cropType }}</span>
                </td>
                <td>
                  <div class="ton-cell">
                    <span class="alloc-tons">{{ item.allocatedTonnage }} T</span>
                    <span class="avail-tons">of {{ item.availableTonnage }} T</span>
                  </div>
                </td>
                <td>
                  <span
                    class="score-pill"
                    [style.background]="item.scorecard.badgeColor + '20'"
                    [style.color]="item.scorecard.badgeColor"
                    [style.borderColor]="item.scorecard.badgeColor"
                  >
                    ★ {{ item.scorecard.aqiScore }}/100
                  </span>
                </td>
                <td>
                  <span class="dist-val">{{ item.distanceKm }} km</span>
                </td>
                <td>
                  <span class="price-val">₹{{ item.pricePerTon.toLocaleString('en-IN') }}/t</span>
                </td>
                <td>
                  <span class="freight-val">₹{{ item.freightCostPerTon }}/t</span>
                </td>
                <td>
                  <span class="landed-val">₹{{ item.landedCostPerTon.toLocaleString('en-IN') }}/t</span>
                </td>
                <td>
                  <span class="bundle-status-badge">Selected #{{ i + 1 }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Dispatch Plan Banner -->
        <div class="dispatch-banner font-outfit">
          <div class="dispatch-icon">🚛</div>
          <div class="dispatch-text">
            <strong>Consolidated Dispatch Plan:</strong> Requires approximately <strong>{{ res.trucksTotal }} trucks</strong> (16-Tonne standard MCV fleet). 
            Total avoided CO₂: <strong>{{ res.co2AvoidedTons }} tonnes</strong>. 
            All {{ res.bundles.length }} farmers are located within a <strong>{{ res.weightedAvgDistanceKm }} km</strong> weighted transit radius.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .optimizer-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      position: relative;
    }

    .ambient-glow {
      position: absolute;
      top: -60px;
      left: 10%;
      width: 480px;
      height: 240px;
      background: radial-gradient(circle, rgba(217, 119, 6, 0.12) 0%, rgba(16, 185, 129, 0.08) 50%, transparent 75%);
      pointer-events: none;
      z-index: 0;
      filter: blur(40px);
    }

    .optimizer-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      position: relative;
      z-index: 1;
    }

    .usp-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(217, 119, 6, 0.12);
      border: 1px solid rgba(217, 119, 6, 0.35);
      color: var(--color-amber-600);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 8px;
    }

    .usp-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-amber-500);
      box-shadow: 0 0 8px var(--color-amber-500);
    }

    .page-title {
      font-size: 26px;
      font-weight: 800;
      color: var(--primary-text);
      letter-spacing: -0.02em;
      margin: 0 0 6px 0;
    }

    .page-subtitle {
      font-size: 13.5px;
      color: var(--secondary-text);
      max-width: 680px;
      line-height: 1.5;
      margin: 0;
    }

    .header-hub-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--surface-card);
      border: 1px solid var(--border);
      padding: 8px 14px;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .hub-radar-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 10px #10B981;
    }

    .hub-label {
      font-size: 10px;
      color: var(--secondary-text);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .hub-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text);
    }

    .control-card {
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }

    .control-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }

    .control-col {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .col-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .control-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--secondary-text);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .target-val-badge {
      background: var(--color-emerald-500);
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }

    .radius-val {
      font-size: 12px;
      font-weight: 700;
      color: var(--color-amber-600);
    }

    .range-slider {
      width: 100%;
      accent-color: var(--color-emerald-600);
      cursor: pointer;
    }

    .preset-pills {
      display: flex;
      gap: 6px;
      margin-top: 4px;
    }

    .pill-btn {
      flex: 1;
      background: var(--hover-background);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 4px 0;
      font-size: 11px;
      font-weight: 600;
      color: var(--secondary-text);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .pill-btn:hover, .pill-btn.active {
      background: var(--color-emerald-600);
      color: #FFFFFF;
      border-color: var(--color-emerald-600);
    }

    .form-select {
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      color: var(--primary-text);
      outline: none;
      transition: border-color 0.15s;
    }

    .form-select:focus {
      border-color: var(--color-emerald-500);
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      gap: 14px;
      align-items: flex-start;
      position: relative;
      overflow: hidden;
    }

    .kpi-card.highlight-green {
      border-color: rgba(16, 185, 129, 0.4);
      background: linear-gradient(135deg, var(--surface-card) 70%, rgba(16, 185, 129, 0.08) 100%);
    }

    .kpi-card.highlight-amber {
      border-color: rgba(217, 119, 6, 0.4);
      background: linear-gradient(135deg, var(--surface-card) 70%, rgba(217, 119, 6, 0.08) 100%);
    }

    .kpi-icon {
      font-size: 24px;
      background: var(--hover-background);
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--secondary-text);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .kpi-value {
      font-size: 20px;
      font-weight: 800;
      color: var(--primary-text);
      margin: 4px 0 2px 0;
    }

    .kpi-value .unit {
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text);
    }

    .kpi-sub {
      font-size: 11px;
      color: var(--secondary-text);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .kpi-badge {
      background: rgba(16, 185, 129, 0.15);
      color: #059669;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .aqi-pill {
      background: rgba(217, 119, 6, 0.15);
      color: #D97706;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
    }

    .manifest-card {
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .manifest-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }

    .manifest-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-text);
      margin: 0 0 4px 0;
    }

    .manifest-subtitle {
      font-size: 13px;
      color: var(--secondary-text);
      margin: 0;
    }

    .btn-reserve-bundle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #10B981;
      color: #FFFFFF;
      border: none;
      border-radius: 10px;
      padding: 10px 18px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
      transition: all 0.2s ease;
    }

    .btn-reserve-bundle:hover:not(:disabled) {
      background: #059669;
      transform: translateY(-1px);
    }

    .btn-reserve-bundle:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .reservation-alert-banner {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #047857;
      padding: 10px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 600;
    }

    .bundles-table-wrapper {
      overflow-x: auto;
    }

    .bundles-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .bundles-table th {
      text-align: left;
      padding: 10px 12px;
      color: var(--secondary-text);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border);
    }

    .bundles-table td {
      padding: 12px;
      border-bottom: 1px solid var(--border);
      color: var(--primary-text);
    }

    .farmer-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .farmer-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.15);
      color: #059669;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
    }

    .farmer-name {
      font-weight: 600;
      color: var(--primary-text);
    }

    .farmer-sub {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .crop-tag {
      background: var(--hover-background);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }

    .ton-cell {
      display: flex;
      flex-direction: column;
    }

    .alloc-tons {
      font-weight: 700;
      color: #10B981;
    }

    .avail-tons {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .score-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 6px;
      border: 1px solid;
      display: inline-block;
    }

    .bundle-status-badge {
      background: rgba(217, 119, 6, 0.12);
      color: #D97706;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
    }

    .dist-val, .price-val, .freight-val, .landed-val {
      font-weight: 600;
    }

    .landed-val {
      color: #059669;
    }

    .dispatch-banner {
      background: var(--hover-background);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12.5px;
      color: var(--primary-text);
    }

    .dispatch-icon {
      font-size: 20px;
    }
  `]
})
export class OrderOptimizerComponent implements OnInit {
  marketplaceService = inject(MarketplaceService);
  private optimizerService = inject(OrderOptimizerService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  targetTons = signal<number>(250);
  selectedCrop = signal<CropKey | 'all'>('all');
  selectedPriority = signal<'optimal_landed_cost' | 'highest_aqi_quality' | 'nearest_proximity'>('optimal_landed_cost');
  maxRadius = signal<number>(100);

  optimizationResult = signal<OptimizationResult | null>(null);
  isReserving = signal<boolean>(false);
  reservationSuccessMessage = signal<string | null>(null);

  ngOnInit(): void {
    // Ensure real listings are loaded from MongoDB Atlas
    this.marketplaceService.fetchBackendListings();

    this.route.queryParams.subscribe(params => {
      if (params['crop']) {
        this.selectedCrop.set(params['crop'] as any);
      }
      if (params['targetTons']) {
        const t = Number(params['targetTons']);
        if (!isNaN(t) && t > 0) {
          this.targetTons.set(t);
        }
      }
    });

    setTimeout(() => {
      this.runOptimization();
    }, 200);
  }

  runOptimization(): void {
    const listings = this.marketplaceService.listings();
    const result = this.optimizerService.optimize(
      listings,
      this.targetTons(),
      this.selectedCrop(),
      this.selectedPriority(),
      this.maxRadius()
    );
    this.optimizationResult.set(result);
  }

  async reserveAllBundledLots(): Promise<void> {
    const res = this.optimizationResult();
    if (!res || res.bundles.length === 0) return;

    this.isReserving.set(true);
    const currentUser = this.authService.currentUser();
    const buyerInfo = {
      id: currentUser?.id || 'buyer_1',
      name: currentUser?.name || 'Industrial Procurement Dept',
      phone: currentUser?.phone || '+91 9279211804'
    };

    let reservedCount = 0;
    for (const b of res.bundles) {
      const ok = await this.marketplaceService.reserveStock(b.listingId, b.allocatedTonnage, buyerInfo);
      if (ok) reservedCount++;
    }

    this.isReserving.set(false);
    this.reservationSuccessMessage.set(
      `✓ Successfully locked 24-hour stock reservation across ${reservedCount} farmer lots (${res.allocatedTonnage} tonnes total). Stock is exclusively held for your account!`
    );

    this.notificationService.addNotification({
      title: '🔒 Multi-Farmer Stock Reserved (24h Hold)',
      message: `Reserved ${res.allocatedTonnage} tonnes from ${reservedCount} nearby farmers at avg landed rate ₹${res.landedPricePerTon}/tonne.`,
      timestamp: new Date().toLocaleTimeString(),
      read: false,
      type: 'order',
      link: '/orders'
    });

    // Re-run optimizer so statuses refresh
    this.runOptimization();
  }
}
