import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { MarketplaceService } from '../../core/services/marketplace.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="landing-page">
      <!-- Minimal Hero Section -->
      <section class="hero-section">
        <h1 class="hero-title">Turn Crop Residue Into Opportunity.</h1>
        <p class="hero-subtitle">
          Connect farmers and industrial buyers to make agricultural residue valuable through local sourcing, bulk pooling and transparent negotiation.
        </p>

        <div class="hero-actions">
          <a routerLink="/proximity-radar" class="btn-primary">
            <span>📍 Launch 100 km Live Radar</span>
            <app-icon name="arrow-right" [size]="14"></app-icon>
          </a>
          <a routerLink="/role-select" class="btn-secondary">
            <span>Select Role</span>
          </a>
          <a routerLink="/login" class="btn-secondary">
            <span>Direct Sign In</span>
          </a>
        </div>
      </section>

      <!-- Key Platform Metrics Strip -->
      <section class="metrics-strip">
        <div class="metric-item">
          <div class="metric-val">12,500+</div>
          <div class="metric-lbl">Tonnes Traded</div>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-item">
          <div class="metric-val">18,200 t</div>
          <div class="metric-lbl">CO₂ Avoided</div>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-item">
          <div class="metric-val">₹1.4 Cr</div>
          <div class="metric-lbl">Farmer Value Generated</div>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-item">
          <div class="metric-val">320+</div>
          <div class="metric-lbl">Verified Aggregators</div>
        </div>
      </section>

      <div class="section-separator"></div>

      <!-- Four Core Platform USPs -->
      <section class="features-section">
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-num font-mono">USP 1</div>
            <h2 class="feature-title">Intelligent Multi-Farmer Order Optimizer</h2>
            <p class="feature-desc">
              Commercial boilers need 500+ tonnes. The automated optimizer bundles smallholder farmer residues within 100 km into a unified consignment with minimum freight and guaranteed specs.
            </p>
            <a routerLink="/order-optimizer" class="feature-link">
              <span>Launch Optimizer</span>
              <app-icon name="arrow-right" [size]="13"></app-icon>
            </a>
          </div>

          <div class="feature-card">
            <div class="feature-num font-mono">USP 2</div>
            <h2 class="feature-title">Smart Logistics Cost Calculator</h2>
            <p class="feature-desc">
              Accurately model transport freight across 3T pickups to 28T trailers. Factors in diesel rates, NHAI highway tolls, loading fees, and moisture quality penalties.
            </p>
            <a routerLink="/logistics-calculator" class="feature-link">
              <span>Calculate Landed Cost</span>
              <app-icon name="arrow-right" [size]="13"></app-icon>
            </a>
          </div>

          <div class="feature-card">
            <div class="feature-num font-mono">USP 3</div>
            <h2 class="feature-title">Quality-Based Supplier Ranking (AQI)</h2>
            <p class="feature-desc">
              Transparent Agrimech Quality Index (AQI 0-100) scoring suppliers on moisture (&le;12%), GCV calorific energy, low ash (&le;6%), and APMC certified digital weighbridge slips.
            </p>
            <a routerLink="/suppliers" class="feature-link">
              <span>Explore Top AQI Suppliers</span>
              <app-icon name="arrow-right" [size]="13"></app-icon>
            </a>
          </div>

          <div class="feature-card">
            <div class="feature-num font-mono">USP 4</div>
            <h2 class="feature-title">Smart Stock Reservation</h2>
            <p class="feature-desc">
              Exclusive 24-hour stock hold mechanism with countdown timers. Protects buyers while locking 50% advance escrow and arranging truck dispatch, preventing double-booking.
            </p>
            <a routerLink="/suppliers" class="feature-link">
              <span>View Reserved & Active Lots</span>
              <app-icon name="arrow-right" [size]="13"></app-icon>
            </a>
          </div>
        </div>
      </section>

      <div class="section-separator"></div>

      <!-- Available Regional Residue Table -->
      <section class="directory-preview">
        <div class="preview-header">
          <div>
            <h2 class="preview-title">Available Regional Residue</h2>
            <p class="preview-subtitle">Recent listings verified across Bangalore South, Harohalli, Kanakapura & Ramanagara agricultural belts</p>
          </div>
          <a routerLink="/role-select" class="btn-ghost btn-sm">
            <span>Access Marketplace</span>
            <app-icon name="arrow-right" [size]="13"></app-icon>
          </a>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Crop Type</th>
                <th>Location</th>
                <th>Available</th>
                <th>Moisture</th>
                <th>Baling</th>
                <th>Asking Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of marketplaceService.listings().slice(0, 4)">
                <td class="font-medium">{{ item.cropType }}</td>
                <td>{{ item.district }}, {{ item.region }}</td>
                <td>{{ item.quantityTons }} Tonnes</td>
                <td>{{ item.moisturePercent }}%</td>
                <td>{{ item.balingType }}</td>
                <td>₹{{ item.pricePerTon.toLocaleString('en-IN') }}/t</td>
                <td>
                  <a routerLink="/role-select" class="btn-ghost btn-sm">Details</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .landing-page {
      display: flex;
      flex-direction: column;
      gap: 36px;
      padding: 20px 0 60px 0;
    }

    .hero-section {
      max-width: 720px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .hero-title {
      font-size: 34px;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: var(--primary-text);
      line-height: 1.15;
    }

    .hero-subtitle {
      font-size: 16px;
      line-height: 1.6;
      color: var(--secondary-text);
    }

    .hero-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }

    .metrics-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px 24px;
      background-color: var(--sidebar-background);
    }

    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .metric-val {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-text);
      letter-spacing: -0.01em;
    }

    .metric-lbl {
      font-size: 12px;
      color: var(--secondary-text);
    }

    .metric-divider {
      width: 1px;
      height: 28px;
      background-color: var(--border);
    }

    .section-separator {
      height: 1px;
      background-color: var(--border);
      width: 100%;
    }

    .features-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
    }

    .feature-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feature-num {
      font-size: 12px;
      font-weight: 600;
      color: var(--secondary-text);
      font-family: monospace;
    }

    .feature-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-text);
      letter-spacing: -0.01em;
    }

    .feature-desc {
      font-size: 13px;
      color: var(--secondary-text);
      line-height: 1.55;
    }

    .feature-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      color: var(--primary-text);
      margin-top: auto;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .directory-preview {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .preview-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }

    .preview-title {
      font-size: 18px;
      font-weight: 600;
    }

    .preview-subtitle {
      font-size: 13px;
      color: var(--secondary-text);
      margin-top: 2px;
    }

    .font-medium {
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .hero-title {
        font-size: 26px;
      }
      .features-grid {
        grid-template-columns: 1fr;
      }
      .metrics-strip {
        flex-direction: column;
        align-items: flex-start;
        gap: 14px;
      }
      .metric-divider {
        display: none;
      }
    }
  `]
})
export class LandingComponent {
  marketplaceService = inject(MarketplaceService);
}
