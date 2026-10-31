import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogisticsService, LogisticsCalculationResult } from '../../../core/services/logistics.service';
import { CropKey, Listing } from '../../../core/models/marketplace.model';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-logistics-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Logistics & Value Estimator</h3>
            <p class="modal-subtitle">Direct calculations based on current regional transport freight rates</p>
          </div>
          <button class="btn-ghost btn-sm" (click)="close()" aria-label="Close">
            <app-icon name="x" [size]="16"></app-icon>
          </button>
        </div>

        <!-- Form controls -->
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Crop Residue</label>
              <select [(ngModel)]="selectedCrop" (change)="recalculate()">
                <option value="ragi">Ragi Straw (ರಾಗಿ ಹುಲ್ಲು - ₹2,600/Ton)</option>
                <option value="mulberry">Mulberry Stalks (ರೇಷ್ಮೆ ಕಡ್ಡಿ - ₹2,300/Ton)</option>
                <option value="coconut">Coconut Shell & Coir (ತೆಂಗಿನ ಚಿಪ್ಪು - ₹3,100/Ton)</option>
                <option value="sugarcane">Sugarcane Bagasse Pellets (ಕಬ್ಬಿನ ಸಿಪ್ಪೆ - ₹1,950/Ton)</option>
                <option value="paddy">Sona Masoori Paddy Straw (₹2,150/Ton)</option>
                <option value="maize">Hybrid Maize Stover (₹1,750/Ton)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Quantity: {{ quantityTons }} Tons</label>
              <input
                type="range"
                min="10"
                max="300"
                step="5"
                [(ngModel)]="quantityTons"
                (input)="recalculate()"
              />
            </div>

            <div class="form-group">
              <label>Delivery Distance: {{ distanceKm }} km</label>
              <input
                type="range"
                min="5"
                max="150"
                step="5"
                [(ngModel)]="distanceKm"
                (input)="recalculate()"
              />
            </div>

            <div class="form-group-checkbox">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [(ngModel)]="includeBaling"
                  (change)="recalculate()"
                />
                <span>Include on-farm baling service (+₹450/Ton)</span>
              </label>
            </div>
          </div>

          <!-- Calculation Results -->
          <div *ngIf="result" class="results-panel">
            <div class="result-row primary-row">
              <span class="label">Gross Residue Value</span>
              <span class="val">₹{{ result.baseResidueValue.toLocaleString('en-IN') }}</span>
            </div>

            <div *ngIf="includeBaling" class="result-row">
              <span class="label">Baling Service Fee</span>
              <span class="val">- ₹{{ result.balingCost.toLocaleString('en-IN') }}</span>
            </div>

            <div class="result-row highlight-row">
              <span class="label font-medium">Net Farmer Earnings</span>
              <span class="val font-semibold">₹{{ result.farmerNetEarning.toLocaleString('en-IN') }}</span>
            </div>

            <div class="separator"></div>

            <div class="result-row">
              <span class="label">Transport & Freight (Loading + Road)</span>
              <span class="val">₹{{ result.totalFreight.toLocaleString('en-IN') }}</span>
            </div>

            <div class="result-row">
              <span class="label">Certified CO₂ Emissions Diverted</span>
              <span class="val">{{ result.co2AvoidedTons }} Tons CO₂e</span>
            </div>

            <div class="result-row">
              <span class="label">Particulate PM2.5 Prevented</span>
              <span class="val">{{ result.pm25AvoidedKg.toLocaleString('en-IN') }} kg</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn-secondary" (click)="close()">Close</button>
          <button class="btn-primary" (click)="confirm()">Apply Estimate</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: var(--modal-backdrop);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 16px;
    }
    .modal-content {
      background-color: var(--background);
      border: 1px solid var(--border);
      border-radius: 12px;
      width: 100%;
      max-width: 520px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .modal-title {
      font-size: 16px;
      font-weight: 600;
    }
    .modal-subtitle {
      font-size: 12px;
      color: var(--secondary-text);
      margin-top: 2px;
    }
    .modal-body {
      padding: 20px;
      max-height: 75vh;
      overflow-y: auto;
    }
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group label {
      font-size: 13px;
      font-weight: 500;
      color: var(--primary-text);
    }
    .form-group select {
      width: 100%;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      cursor: pointer;
    }
    .results-panel {
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .result-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .result-row .label {
      color: var(--secondary-text);
    }
    .result-row .val {
      color: var(--primary-text);
    }
    .highlight-row {
      font-size: 14px;
      padding-top: 4px;
    }
    .highlight-row .label, .highlight-row .val {
      color: var(--primary-text);
    }
    .separator {
      height: 1px;
      background-color: var(--border);
      margin: 4px 0;
    }
    .modal-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background-color: var(--sidebar-background);
    }
  `]
})
export class LogisticsModalComponent implements OnInit {
  private logisticsService = inject(LogisticsService);

  @Input() listing?: Listing;
  @Output() closed = new EventEmitter<void>();
  @Output() applied = new EventEmitter<LogisticsCalculationResult>();

  selectedCrop: CropKey = 'ragi';
  quantityTons: number = 75;
  distanceKm: number = 15;
  includeBaling: boolean = false;
  customRate?: number;

  result?: LogisticsCalculationResult;

  ngOnInit(): void {
    if (this.listing) {
      this.selectedCrop = this.listing.cropKey;
      this.quantityTons = this.listing.quantityTons;
      this.distanceKm = this.listing.distanceKm;
      this.customRate = this.listing.pricePerTon;
    }
    this.recalculate();
  }

  recalculate(): void {
    this.result = this.logisticsService.calculate(
      this.selectedCrop,
      this.quantityTons,
      this.distanceKm,
      this.includeBaling,
      this.customRate
    );
  }

  close(): void {
    this.closed.emit();
  }

  confirm(): void {
    if (this.result) {
      this.applied.emit(this.result);
    }
    this.close();
  }
}
