import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LogisticsService, LogisticsCalculationResult, VehicleTypeKey, VehicleOption } from '../../core/services/logistics.service';
import { MarketplaceService } from '../../core/services/marketplace.service';
import { CropKey } from '../../core/models/marketplace.model';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-logistics-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="calculator-page">
      <!-- Ambient Field Mist Glow -->
      <div class="ambient-glow"></div>

      <!-- Hero Header -->
      <div class="calculator-header">
        <div>
          <div class="usp-badge font-outfit">
            <span class="usp-dot"></span>
            USP 2: SMART LOGISTICS COST CALCULATOR
          </div>
          <h1 class="page-title font-syne">Commercial Freight & Landed Price Calculator</h1>
          <p class="page-subtitle font-outfit">
            Accurately model transport freight, fleet capacities, diesel volatility surcharges, highway tolls, and moisture quality penalties for agricultural residue consignments.
          </p>
        </div>

        <div class="hub-pill font-outfit">
          <span class="hub-dot"></span>
          <span>Hub: {{ marketplaceService.currentHub().shortName }}</span>
        </div>
      </div>

      <!-- Main Calculator Grid -->
      <div class="calculator-grid">
        <!-- Controls Column -->
        <div class="control-panel-card">
          <h3 class="panel-title font-syne">1. Consignment & Fleet Parameters</h3>

          <div class="form-group">
            <label class="form-label">Crop Residue Feedstock</label>
            <select [(ngModel)]="selectedCrop" (change)="recalculate()" class="form-control">
              <option value="paddy">Sona Masoori Paddy Straw (₹2,150/t base)</option>
              <option value="wheat">Wheat Stubble (₹1,950/t base)</option>
              <option value="sugarcane">Sugarcane Bagasse Pellets (₹1,950/t base)</option>
              <option value="ragi">Ragi Straw (₹2,600/t base)</option>
              <option value="mulberry">Mulberry Dried Stems (₹2,300/t base)</option>
              <option value="coconut">Coconut Shell & Coir (₹3,100/t base)</option>
              <option value="maize">Maize Stover (₹1,750/t base)</option>
              <option value="cotton">Cotton Stalks (₹2,800/t base)</option>
              <option value="mustard">Mustard Husk (₹1,850/t base)</option>
            </select>
          </div>

          <!-- Commercial Fleet Selector Cards -->
          <div class="form-group">
            <label class="form-label">Select Commercial Vehicle Fleet</label>
            <div class="vehicle-cards-grid">
              <div
                *ngFor="let v of vehicleFleet"
                class="vehicle-card"
                [class.selected]="selectedVehicleKey === v.key"
                (click)="selectedVehicleKey = v.key; recalculate()"
              >
                <div class="vehicle-head">
                  <span class="vehicle-icon">🚚</span>
                  <span class="vehicle-cap font-outfit">{{ v.capacityTons }}T Capacity</span>
                </div>
                <div class="vehicle-name">{{ v.name }}</div>
                <div class="vehicle-rate font-outfit">₹{{ v.ratePerKm }}/km</div>
              </div>
            </div>
          </div>

          <!-- Quantity Slider -->
          <div class="form-group">
            <div class="slider-header">
              <label class="form-label">Consignment Volume</label>
              <span class="slider-value font-outfit">{{ quantityTons }} Tonnes</span>
            </div>
            <input
              type="range"
              min="5"
              max="400"
              step="5"
              [(ngModel)]="quantityTons"
              (input)="recalculate()"
              class="range-slider"
            />
          </div>

          <!-- Transit Distance Slider -->
          <div class="form-group">
            <div class="slider-header">
              <label class="form-label">Transit Distance (One-Way)</label>
              <span class="slider-value font-outfit">{{ distanceKm }} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="250"
              step="5"
              [(ngModel)]="distanceKm"
              (input)="recalculate()"
              class="range-slider"
            />
          </div>

          <!-- Moisture Level Slider with Penalty Indicator -->
          <div class="form-group">
            <div class="slider-header">
              <label class="form-label">Moisture Level at Farm Gate</label>
              <span
                class="moisture-badge font-outfit"
                [class.warning]="moisturePercent > 14"
              >
                {{ moisturePercent }}% {{ moisturePercent <= 12 ? '(Boiler Ideal)' : moisturePercent <= 14 ? '(Acceptable)' : '(Penalty Active)' }}
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="25"
              step="1"
              [(ngModel)]="moisturePercent"
              (input)="recalculate()"
              class="range-slider"
            />
            <div *ngIf="moisturePercent > 14" class="moisture-note font-outfit">
              ⚠️ Moisture exceeds 14% commercial boiler baseline. Penalty of ₹{{ (moisturePercent - 14) * 50 }}/tonne applies.
            </div>
          </div>

          <!-- Additional Logistics Toggles -->
          <div class="toggles-row font-outfit">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="includeBaling" (change)="recalculate()" />
              <span>Include On-Farm High-Density Baling (+₹450/tonne)</span>
            </label>

            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="includeTolls" (change)="recalculate()" />
              <span>Include NHAI Highway Tolls (~₹185 per 60 km)</span>
            </label>
          </div>
        </div>

        <!-- Output & Cost Breakdown Column -->
        <div *ngIf="result" class="results-panel-card">
          <h3 class="panel-title font-syne">2. Landed Cost & Freight Ledger</h3>

          <!-- Prominent Landed Factory Rate Hero -->
          <div class="landed-hero-box">
            <div class="landed-label font-outfit">FINAL LANDED PRICE AT FACTORY GATE</div>
            <div class="landed-rate font-syne">
              ₹{{ result.landedCostPerTon?.toLocaleString('en-IN') }}
              <span class="unit font-outfit">/ tonne</span>
            </div>
            <div class="landed-total font-outfit">
              Total Consignment Landed Value: <strong>₹{{ result.landedCostTotal?.toLocaleString('en-IN') }}</strong>
            </div>
          </div>

          <!-- Transparent Breakdown Ledger -->
          <div class="breakdown-ledger font-outfit">
            <div class="ledger-row">
              <span class="ledger-item">
                <span class="dot green"></span>
                Ex-Farm Biomass Value ({{ result.quantityTons }}T)
              </span>
              <span class="ledger-val">₹{{ result.baseResidueValue.toLocaleString('en-IN') }}</span>
            </div>

            <div *ngIf="includeBaling" class="ledger-row">
              <span class="ledger-item">
                <span class="dot amber"></span>
                Mechanical Baling Service Fee
              </span>
              <span class="ledger-val">+ ₹{{ result.balingCost.toLocaleString('en-IN') }}</span>
            </div>

            <div class="ledger-row">
              <span class="ledger-item">
                <span class="dot blue"></span>
                Road Transport Freight ({{ result.trucksRequired }}x {{ result.vehicleSelected?.capacityTons }}T {{ result.vehicleSelected?.key | uppercase }})
              </span>
              <span class="ledger-val">+ ₹{{ result.roadFreight.toLocaleString('en-IN') }}</span>
            </div>

            <div class="ledger-row">
              <span class="ledger-item">
                <span class="dot gray"></span>
                Loading & APMC Weighbridge Handling
              </span>
              <span class="ledger-val">+ ₹{{ result.loadingCost.toLocaleString('en-IN') }}</span>
            </div>

            <div *ngIf="includeTolls && result.tollCharges" class="ledger-row">
              <span class="ledger-item">
                <span class="dot gray"></span>
                NHAI Highway Toll Plaza Charges
              </span>
              <span class="ledger-val">+ ₹{{ result.tollCharges.toLocaleString('en-IN') }}</span>
            </div>

            <div class="ledger-row">
              <span class="ledger-item">
                <span class="dot amber"></span>
                Regional Diesel Volatility Surcharge (8%)
              </span>
              <span class="ledger-val">+ ₹{{ result.dieselSurcharge?.toLocaleString('en-IN') }}</span>
            </div>

            <div *ngIf="result.totalMoistureDeduction && result.totalMoistureDeduction > 0" class="ledger-row deduction-row">
              <span class="ledger-item">
                <span class="dot red"></span>
                Excess Moisture Quality Deduction ({{ moisturePercent }}%)
              </span>
              <span class="ledger-val">- ₹{{ result.totalMoistureDeduction.toLocaleString('en-IN') }}</span>
            </div>

            <div class="ledger-divider"></div>

            <div class="ledger-row net-farmer-row">
              <span class="ledger-item font-semibold">Net Farmer Farm-Gate Revenue</span>
              <span class="ledger-val font-bold">₹{{ result.farmerNetEarning.toLocaleString('en-IN') }}</span>
            </div>
          </div>

          <!-- Environmental Impact Card -->
          <div class="eco-impact-box font-outfit">
            <div class="eco-head">
              <span class="eco-leaf">🌱</span>
              <span class="eco-title">Decarbonization & Clean Air Contribution</span>
            </div>
            <div class="eco-grid">
              <div class="eco-stat">
                <div class="eco-stat-val">{{ result.co2AvoidedTons }} t</div>
                <div class="eco-stat-lbl">CO₂ Emissions Abated</div>
              </div>
              <div class="eco-stat">
                <div class="eco-stat-val">{{ result.pm25AvoidedKg }} kg</div>
                <div class="eco-stat-lbl">PM2.5 Smog Prevented</div>
              </div>
              <div class="eco-stat">
                <div class="eco-stat-val">₹{{ result.carbonCreditsInr.toLocaleString('en-IN') }}</div>
                <div class="eco-stat-lbl">Carbon Credit Value</div>
              </div>
            </div>
          </div>

          <!-- Call to Action -->
          <div class="action-row">
            <a routerLink="/suppliers" class="btn-source-suppliers">
              <span>Find Nearby Suppliers for this Consignment</span>
              <span>&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .calculator-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      position: relative;
    }

    .ambient-glow {
      position: absolute;
      top: -60px;
      right: 10%;
      width: 480px;
      height: 240px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(217, 119, 6, 0.08) 50%, transparent 75%);
      pointer-events: none;
      z-index: 0;
      filter: blur(40px);
    }

    .calculator-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      position: relative;
      z-index: 1;
    }

    .usp-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #059669;
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
      background: #10B981;
      box-shadow: 0 0 8px #10B981;
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

    .hub-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--surface-card);
      border: 1px solid var(--border);
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      color: var(--primary-text);
      flex-shrink: 0;
    }

    .hub-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
    }

    .calculator-grid {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 24px;
    }

    @media (max-width: 900px) {
      .calculator-grid {
        grid-template-columns: 1fr;
      }
    }

    .control-panel-card, .results-panel-card {
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }

    .panel-title {
      font-size: 17px;
      font-weight: 700;
      color: var(--primary-text);
      margin: 0;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--secondary-text);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .form-control {
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13.5px;
      color: var(--primary-text);
      outline: none;
    }

    .vehicle-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .vehicle-card {
      background: var(--hover-background);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .vehicle-card:hover {
      border-color: var(--color-emerald-500);
    }

    .vehicle-card.selected {
      background: rgba(16, 185, 129, 0.1);
      border-color: #10B981;
      box-shadow: 0 0 0 1px #10B981;
    }

    .vehicle-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .vehicle-cap {
      font-size: 11px;
      font-weight: 700;
      background: #10B981;
      color: #FFFFFF;
      padding: 1px 6px;
      border-radius: 4px;
    }

    .vehicle-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--primary-text);
      line-height: 1.3;
    }

    .vehicle-rate {
      font-size: 11px;
      font-weight: 700;
      color: #D97706;
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .slider-value {
      font-size: 12px;
      font-weight: 700;
      background: var(--hover-background);
      border: 1px solid var(--border);
      padding: 2px 8px;
      border-radius: 6px;
      color: var(--primary-text);
    }

    .range-slider {
      width: 100%;
      accent-color: var(--color-emerald-600);
      cursor: pointer;
    }

    .moisture-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(16, 185, 129, 0.15);
      color: #059669;
    }

    .moisture-badge.warning {
      background: rgba(239, 68, 68, 0.15);
      color: #DC2626;
    }

    .moisture-note {
      font-size: 11.5px;
      color: #DC2626;
      background: rgba(239, 68, 68, 0.08);
      border-radius: 6px;
      padding: 6px 10px;
    }

    .toggles-row {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 6px;
      border-top: 1px solid var(--border);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12.5px;
      color: var(--primary-text);
      cursor: pointer;
    }

    .landed-hero-box {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(217, 119, 6, 0.08) 100%);
      border: 1.5px solid #10B981;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }

    .landed-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #059669;
      margin-bottom: 4px;
    }

    .landed-rate {
      font-size: 32px;
      font-weight: 900;
      color: var(--primary-text);
      line-height: 1.1;
    }

    .landed-rate .unit {
      font-size: 14px;
      font-weight: 500;
      color: var(--secondary-text);
    }

    .landed-total {
      font-size: 12.5px;
      color: var(--secondary-text);
      margin-top: 6px;
    }

    .breakdown-ledger {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 12.5px;
    }

    .ledger-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--primary-text);
    }

    .ledger-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .dot.green { background: #10B981; }
    .dot.amber { background: #D97706; }
    .dot.blue { background: #3B82F6; }
    .dot.gray { background: #94A3B8; }
    .dot.red { background: #EF4444; }

    .deduction-row {
      color: #DC2626;
    }

    .ledger-divider {
      height: 1px;
      background: var(--border);
      margin: 4px 0;
    }

    .net-farmer-row {
      font-size: 13.5px;
      color: #059669;
    }

    .eco-impact-box {
      background: var(--hover-background);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
    }

    .eco-head {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #059669;
      margin-bottom: 8px;
    }

    .eco-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      text-align: center;
    }

    .eco-stat-val {
      font-size: 14px;
      font-weight: 700;
      color: var(--primary-text);
    }

    .eco-stat-lbl {
      font-size: 10.5px;
      color: var(--secondary-text);
    }

    .btn-source-suppliers {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #10B981;
      color: #FFFFFF;
      padding: 11px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      transition: background 0.15s;
    }

    .btn-source-suppliers:hover {
      background: #059669;
    }
  `]
})
export class LogisticsCalculatorComponent implements OnInit {
  private logisticsService = inject(LogisticsService);
  marketplaceService = inject(MarketplaceService);

  vehicleFleet: VehicleOption[] = [];
  selectedCrop: CropKey = 'paddy';
  selectedVehicleKey: VehicleTypeKey = 'mcv';
  quantityTons: number = 80;
  distanceKm: number = 45;
  moisturePercent: number = 11;
  includeBaling: boolean = true;
  includeTolls: boolean = true;

  result: LogisticsCalculationResult | null = null;

  ngOnInit(): void {
    this.vehicleFleet = this.logisticsService.getVehicleFleet();
    this.recalculate();
  }

  recalculate(): void {
    this.result = this.logisticsService.calculateSmartLogistics({
      crop: this.selectedCrop,
      quantityTons: this.quantityTons,
      distanceKm: this.distanceKm,
      includeBaling: this.includeBaling,
      vehicleKey: this.selectedVehicleKey,
      moisturePercent: this.moisturePercent,
      includeTolls: this.includeTolls
    });
  }
}
