import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MarketplaceService } from '../../core/services/marketplace.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CropKey, BalingKey, MoistureLevel } from '../../core/models/marketplace.model';

@Component({
  selector: 'app-new-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="form-page">
      <div class="form-header">
        <h2 class="form-title">Create Crop Residue Listing</h2>
        <p class="form-subtitle">Make your post-harvest biomass available to bio-energy, paper, and industrial buyers.</p>
      </div>

      <div class="form-layout">
        <form class="main-form" (ngSubmit)="submitForm()">
          <div class="form-section">
            <h3 class="section-heading">Residue Specifications</h3>

            <div class="field-grid-2">
              <div class="form-group">
                <label for="cropSelect">Crop Residue Type *</label>
                <select id="cropSelect" [(ngModel)]="cropKey" name="cropKey" (change)="onCropChange()" required>
                  <option value="ragi">Ragi Straw (ರಾಗಿ ಹುಲ್ಲು - MR-1 Bales)</option>
                  <option value="mulberry">Mulberry Stalks (ರೇಷ್ಮೆ ಕಡ್ಡಿ - Pruned Stems)</option>
                  <option value="coconut">Coconut Shell & Coir Pith (ತೆಂಗಿನ ಚಿಪ್ಪು)</option>
                  <option value="sugarcane">Sugarcane Bagasse Pellets (ಕಬ್ಬಿನ ಸಿಪ್ಪೆ)</option>
                  <option value="paddy">Sona Masoori Paddy Straw (ಭತ್ತದ ಹುಲ್ಲು)</option>
                  <option value="maize">Hybrid Maize Stover (ಮೆಕ್ಕೆಜೋಳ)</option>
                </select>
              </div>

              <div class="form-group">
                <label for="quantity">Available Quantity (Tonnes) *</label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max="1000"
                  [(ngModel)]="quantityTons"
                  name="quantityTons"
                  placeholder="e.g. 75"
                  required
                />
              </div>
            </div>

            <div class="field-grid-3">
              <div class="form-group">
                <label for="moisture">Moisture Content (%) *</label>
                <input
                  id="moisture"
                  type="number"
                  min="5"
                  max="40"
                  step="0.5"
                  [(ngModel)]="moisturePercent"
                  name="moisturePercent"
                  placeholder="e.g. 10.5"
                  required
                />
                <span class="field-hint">Boilers prefer &lt;12% moisture</span>
              </div>

              <div class="form-group">
                <label for="baling">Baling Format *</label>
                <select id="baling" [(ngModel)]="balingKey" name="balingKey" required>
                  <option value="square">Square Baled (High Density)</option>
                  <option value="round">Round Baled</option>
                  <option value="loose">Loose Biomass</option>
                  <option value="pellets">Densified Pellets</option>
                </select>
              </div>

              <div class="form-group">
                <label for="quality">Quality Certification</label>
                <select id="quality" [(ngModel)]="qualityGrade" name="qualityGrade">
                  <option value="Grade A - Boiler Ready">Grade A - Boiler Ready</option>
                  <option value="Lab Tested (Calorific &gt;3200)">Lab Tested (Calorific &gt;3200)</option>
                  <option value="Organic High-Dry Matter">Organic High-Dry Matter</option>
                  <option value="Standard Agro Lot">Standard Agro Lot</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="section-heading-row">
              <h3 class="section-heading">Location & Logistics (100 KM Dispatch Hub)</h3>
              <button type="button" class="btn-locate-gps" (click)="detectGpsLocation()" [disabled]="isDetectingGps">
                <app-icon name="navigation" [size]="12"></app-icon>
                <span>{{ isDetectingGps ? 'Tracking GPS...' : '📍 Auto-Trace Device GPS' }}</span>
              </button>
            </div>

            <div class="field-grid-2">
              <div class="form-group">
                <label for="district">District / Taluk / Village Hub *</label>
                <input
                  id="district"
                  type="text"
                  [(ngModel)]="district"
                  name="district"
                  placeholder="e.g. Harohalli / Sonipat / Ludhiana"
                  required
                />
              </div>

              <div class="form-group">
                <label for="region">State / Region *</label>
                <input
                  id="region"
                  type="text"
                  [(ngModel)]="region"
                  name="region"
                  placeholder="e.g. Karnataka / Haryana / Punjab / Delhi"
                  required
                />
              </div>
            </div>

            <div class="field-grid-2">
              <div class="form-group">
                <label for="storage">Storage Condition *</label>
                <select id="storage" [(ngModel)]="storageType" name="storageType">
                  <option value="Covered Shed">Covered Shed (Protected from Rain)</option>
                  <option value="Open Field Wrapped">Open Field Wrapped Tarpaulin</option>
                  <option value="Aggregator Yard">Aggregator Yard</option>
                  <option value="Warehouse Bags">Warehouse Bags</option>
                </select>
              </div>

              <div class="form-group">
                <label for="distance">Approx Distance to Main Highway (km)</label>
                <input
                  id="distance"
                  type="number"
                  min="1"
                  max="150"
                  [(ngModel)]="distanceKm"
                  name="distanceKm"
                  placeholder="e.g. 15"
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-heading">Pricing & Contact</h3>

            <div class="field-grid-2">
              <div class="form-group">
                <label for="price">Asking Price per Tonne (₹) *</label>
                <input
                  id="price"
                  type="number"
                  min="500"
                  max="10000"
                  step="50"
                  [(ngModel)]="pricePerTon"
                  name="pricePerTon"
                  placeholder="e.g. 2150"
                  required
                />
                <span class="field-hint">Ex-farm gate price before transport freight</span>
              </div>

              <div class="form-group">
                <label for="phone">Contact Phone Number *</label>
                <input
                  id="phone"
                  type="tel"
                  [(ngModel)]="farmerPhone"
                  name="farmerPhone"
                  placeholder="+91 98721 00000"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label for="desc">Lot Notes & Description</label>
              <textarea
                id="desc"
                rows="3"
                [(ngModel)]="description"
                name="description"
                placeholder="Mention harvest combine type, moisture testing equipment, truck access clearance..."
              ></textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="cancel()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="!isValid()">
              <app-icon name="check" [size]="14"></app-icon>
              <span>Publish Listing</span>
            </button>
          </div>
        </form>

        <aside class="summary-sidebar">
          <div class="summary-card">
            <h4 class="summary-title">Listing Projection</h4>

            <div class="summary-row">
              <span class="lbl">Crop</span>
              <span class="val">{{ getCropDisplayName() }}</span>
            </div>
            <div class="summary-row">
              <span class="lbl">Total Quantity</span>
              <span class="val">{{ quantityTons || 0 }} Tonnes</span>
            </div>
            <div class="summary-row">
              <span class="lbl">Asking Rate</span>
              <span class="val">₹{{ (pricePerTon || 0).toLocaleString('en-IN') }}/t</span>
            </div>
            <div class="summary-row highlight">
              <span class="lbl">Total Gross Value</span>
              <span class="val">₹{{ ((quantityTons || 0) * (pricePerTon || 0)).toLocaleString('en-IN') }}</span>
            </div>

            <div class="summary-separator"></div>

            <div class="summary-row">
              <span class="lbl">CO₂ Emissions Diverted</span>
              <span class="val">{{ (((quantityTons || 0) * 1.46)).toFixed(1) }} t CO₂e</span>
            </div>
            <div class="summary-row">
              <span class="lbl">Standard Truckloads</span>
              <span class="val">{{ Math.ceil((quantityTons || 0) / 15) }} trucks (15t ea.)</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .form-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .form-title {
      font-size: 20px;
      font-weight: 600;
    }

    .form-subtitle {
      font-size: 13px;
      color: var(--secondary-text);
    }

    .form-layout {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 28px;
      align-items: flex-start;
    }

    .main-form {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      background-color: var(--card-background);
    }

    .section-heading-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
      gap: 12px;
      flex-wrap: wrap;
    }

    .section-heading {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-text);
      margin: 0;
    }

    .btn-locate-gps {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid var(--primary-text);
      background-color: var(--background);
      color: var(--primary-text);
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .btn-locate-gps:hover:not(:disabled) {
      background-color: var(--sidebar-background);
    }

    .btn-locate-gps:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .field-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .field-grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
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

    .field-hint {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 12px;
    }

    .summary-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
      background-color: var(--sidebar-background);
      display: flex;
      flex-direction: column;
      gap: 10px;
      position: sticky;
      top: 80px;
    }

    .summary-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text);
      margin-bottom: 4px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }

    .summary-row .lbl {
      color: var(--secondary-text);
    }

    .summary-row .val {
      color: var(--primary-text);
      font-weight: 500;
    }

    .summary-row.highlight {
      padding-top: 6px;
      font-weight: 600;
    }

    .summary-row.highlight .lbl, .summary-row.highlight .val {
      color: var(--primary-text);
    }

    .summary-separator {
      height: 1px;
      background-color: var(--border);
      margin: 4px 0;
    }

    @media (max-width: 860px) {
      .form-layout {
        grid-template-columns: 1fr;
      }
      .field-grid-2, .field-grid-3 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class NewListingComponent implements OnInit {
  private marketplaceService = inject(MarketplaceService);
  private authService = inject(AuthService);
  private router = inject(Router);

  Math = Math;

  cropKey: CropKey = 'ragi';
  quantityTons: number = 75;
  moisturePercent: number = 9.5;
  balingKey: BalingKey = 'square';
  qualityGrade: string = 'Grade A - Boiler Ready';
  district: string = 'Harohalli';
  region: string = 'Karnataka';
  storageType: string = 'Covered Shed';
  distanceKm: number = 8;
  pricePerTon: number = 2600;
  farmerName: string = '';
  farmerPhone: string = '';
  description: string = 'Square-baled crop residue from local farm. High dry matter, tied with heavy twine, direct tractor access near main highway.';

  isDetectingGps: boolean = false;
  detectedLat?: number;
  detectedLng?: number;

  ngOnInit(): void {
    const user = this.authService.currentUser();
    const hub = this.marketplaceService.currentHub();
    if (user) {
      this.farmerName = user.name || '';
      this.farmerPhone = user.phone || '';
      if (user.district) this.district = user.district;
      else if (hub.name) this.district = hub.name;
      if (user.state) this.region = user.state;
      else if (hub.state) this.region = hub.state;
    } else {
      this.district = hub.name;
      this.region = hub.state;
    }
  }

  detectGpsLocation(): void {
    if (!navigator.geolocation) {
      alert('Live GPS is not supported by your browser.');
      return;
    }
    this.isDetectingGps = true;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        this.detectedLat = pos.coords.latitude;
        this.detectedLng = pos.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${this.detectedLat}&lon=${this.detectedLng}`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const dist = addr.county || addr.state_district || addr.city || addr.town || addr.village;
            const st = addr.state;
            if (dist) this.district = dist;
            const placeName = dist ? (st ? `${dist}, ${st}` : dist) : 'My Farm';
            this.marketplaceService.setCustomLocation(this.detectedLat, this.detectedLng, placeName);
          }
        } catch {
          // fallback silently
        } finally {
          this.isDetectingGps = false;
        }
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        this.isDetectingGps = false;
      },
      { timeout: 8000 }
    );
  }

  onCropChange(): void {
    const defaults: Record<CropKey, { price: number; name: string }> = {
      ragi: { price: 2600, name: 'Ragi Straw (ರಾಗಿ ಹುಲ್ಲು)' },
      mulberry: { price: 2300, name: 'Mulberry Stalks (ರೇಷ್ಮೆ ಕಡ್ಡಿ)' },
      coconut: { price: 3100, name: 'Coconut Shell & Coir (ತೆಂಗಿನ ಚಿಪ್ಪು)' },
      sugarcane: { price: 1950, name: 'Sugarcane Bagasse (ಕಬ್ಬಿನ ಸಿಪ್ಪೆ)' },
      paddy: { price: 2150, name: 'Paddy Straw (ಭತ್ತದ ಹುಲ್ಲು)' },
      maize: { price: 1750, name: 'Maize Stover (ಮೆಕ್ಕೆಜೋಳ)' },
      wheat: { price: 1950, name: 'Wheat Stubble' },
      cotton: { price: 2800, name: 'Cotton Stalks' },
      mustard: { price: 1850, name: 'Mustard Husk' }
    };
    this.pricePerTon = defaults[this.cropKey]?.price || 2400;
  }

  getCropDisplayName(): string {
    const map: Record<CropKey, string> = {
      ragi: 'Ragi Straw (ರಾಗಿ ಹುಲ್ಲು)',
      mulberry: 'Mulberry Stalks (ರೇಷ್ಮೆ ಕಡ್ಡಿ)',
      coconut: 'Coconut Shell & Coir (ತೆಂಗಿನ ಚಿಪ್ಪು)',
      sugarcane: 'Sugarcane Bagasse (ಕಬ್ಬಿನ ಸಿಪ್ಪೆ)',
      paddy: 'Paddy Straw (ಭತ್ತದ ಹುಲ್ಲು)',
      maize: 'Maize Stover (ಮೆಕ್ಕೆಜೋಳ)',
      wheat: 'Wheat Stubble',
      cotton: 'Cotton Stalks',
      mustard: 'Mustard Husk'
    };
    return map[this.cropKey] || 'Biomass Residue';
  }

  isValid(): boolean {
    return !!(this.quantityTons > 0 && this.pricePerTon > 0 && this.district && this.farmerPhone);
  }

  submitForm(): void {
    if (!this.isValid()) return;

    const user = this.authService.currentUser();
    const moistureLevel: MoistureLevel = this.moisturePercent < 12 ? 'low' : (this.moisturePercent <= 18 ? 'medium' : 'high');
    const balingTypeMap: Record<BalingKey, string> = {
      square: 'Square Baled',
      round: 'Round Baled',
      loose: 'Loose',
      pellets: 'Densified Pellets'
    };

    this.marketplaceService.addListing({
      cropType: this.getCropDisplayName(),
      cropKey: this.cropKey,
      region: this.region,
      district: this.district,
      farmerName: user?.name || this.farmerName || 'Farmer Seller',
      farmerPhone: this.farmerPhone,
      ownerPhone: user?.phone || this.farmerPhone,
      ownerId: user?.id,
      harvestDate: new Date().toISOString().split('T')[0],
      moisturePercent: this.moisturePercent,
      moistureLevel,
      balingType: balingTypeMap[this.balingKey],
      balingKey: this.balingKey,
      qualityGrade: this.qualityGrade,
      quantityTons: this.quantityTons,
      pricePerTon: this.pricePerTon,
      distanceKm: this.distanceKm || 12,
      storageType: this.storageType,
      calorificValue: '3,450 kcal/kg',
      description: this.description,
      ...(this.detectedLat && this.detectedLng ? { lat: this.detectedLat, lng: this.detectedLng } : {})
    } as any);

    this.router.navigate(['/seller-dashboard']);
  }

  cancel(): void {
    this.router.navigate(['/seller-dashboard']);
  }
}
