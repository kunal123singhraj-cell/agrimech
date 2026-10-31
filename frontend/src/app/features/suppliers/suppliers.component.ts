import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MarketplaceService } from '../../core/services/marketplace.service';
import { NegotiationService } from '../../core/services/negotiation.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { LogisticsModalComponent } from '../../shared/components/logistics-modal/logistics-modal.component';
import { QualityRankingService, QualityScorecard } from '../../core/services/quality-ranking.service';
import { Listing } from '../../core/models/marketplace.model';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, BadgeComponent, LogisticsModalComponent],
  template: `
    <div class="suppliers-page">
      <!-- Page Header -->
      <div class="suppliers-header">
        <div>
          <h2 class="page-title">Find Suppliers</h2>
          <p class="page-subtitle">Source crop residue directly from verified farmers and regional aggregators</p>
        </div>
        <div class="header-count">
          <span class="count-val">{{ marketplaceService.filteredListings().length }}</span>
          <span class="count-label">Listings Matched</span>
        </div>
      </div>

      <!-- Search & Filters Strip -->
      <div class="filters-card">
        <div class="search-input-wrapper">
          <app-icon name="search" [size]="15"></app-icon>
          <input
            type="text"
            placeholder="Search crop, farmer name, district, or region..."
            [ngModel]="marketplaceService.searchQuery()"
            (ngModelChange)="marketplaceService.searchQuery.set($event)"
            class="main-search-input"
          />
        </div>

        <div class="filter-controls-row">
          <div class="filter-select-group">
            <label>Crop</label>
            <select
              [ngModel]="marketplaceService.selectedCrop()"
              (ngModelChange)="marketplaceService.selectedCrop.set($event)"
            >
              <option value="all">All Crops</option>
              <option value="ragi">Ragi Straw (ರಾಗಿ ಹುಲ್ಲು)</option>
              <option value="mulberry">Mulberry Dried Stems (ರೇಷ್ಮೆ)</option>
              <option value="coconut">Coconut Shell & Coir</option>
              <option value="sugarcane">Sugarcane Bagasse</option>
              <option value="paddy">Sona Masoori Paddy Straw</option>
              <option value="maize">Maize Stover</option>
            </select>
          </div>

          <div class="filter-select-group">
            <label>Moisture</label>
            <select
              [ngModel]="marketplaceService.selectedMoisture()"
              (ngModelChange)="marketplaceService.selectedMoisture.set($event)"
            >
              <option value="all">All Levels</option>
              <option value="low">Low (&lt;12% Boiler Ready)</option>
              <option value="medium">Medium (12–18%)</option>
              <option value="high">High (&gt;18%)</option>
            </select>
          </div>

          <div class="filter-select-group">
            <label>Baling</label>
            <select
              [ngModel]="marketplaceService.selectedBaling()"
              (ngModelChange)="marketplaceService.selectedBaling.set($event)"
            >
              <option value="all">All Formats</option>
              <option value="square">Square Baled</option>
              <option value="round">Round Baled</option>
              <option value="loose">Loose Straw</option>
              <option value="pellets">Densified Pellets</option>
            </select>
          </div>

          <div class="filter-slider-group">
            <div class="slider-header">
              <label>Radius</label>
              <span class="slider-val">{{ marketplaceService.maxDistance() >= 2000 ? 'Pan-India' : marketplaceService.maxDistance() + ' km' }}</span>
            </div>
            <input
              type="range"
              min="20"
              max="2500"
              step="20"
              [ngModel]="marketplaceService.maxDistance()"
              (ngModelChange)="marketplaceService.maxDistance.set($event)"
            />
          </div>

          <div class="filter-select-group">
            <label>Sort By</label>
            <select
              [ngModel]="marketplaceService.sortBy()"
              (ngModelChange)="marketplaceService.sortBy.set($event)"
            >
              <option value="quality-desc">⭐ Quality Ranking: Highest AQI First (USP 3)</option>
              <option value="distance">Distance: Nearest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="quantity-desc">Quantity: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Supplier Listings Grid -->
      <div *ngIf="marketplaceService.filteredListings().length > 0; else noListings" class="listings-grid">
        <div *ngFor="let item of marketplaceService.filteredListings()" class="supplier-card" [class.is-reserved]="item.status === 'reserved'">
          <!-- Real Crop Image Banner -->
          <div class="card-thumb" *ngIf="item.imageUrl">
            <img [src]="item.imageUrl" [alt]="item.cropType" loading="lazy" class="card-img" />
            <span class="weighbridge-tag" *ngIf="item.verified">
              <app-icon name="check" [size]="10"></app-icon>
              <span>APMC Verified</span>
            </span>

            <!-- USP 3 AQI Quality Badge on Image -->
            <button
              class="aqi-card-badge"
              (click)="openScorecardModal(item); $event.stopPropagation()"
              title="Click to view full Quality Scorecard breakdown"
            >
              <span class="aqi-star">★</span>
              <span>{{ item.aqiScore || 88 }}/100 AQI</span>
            </button>
          </div>

          <!-- USP 4: Smart Stock Reservation Status Strip -->
          <div *ngIf="item.status === 'reserved'" class="reservation-status-strip">
            <span class="lock-icon">🔒</span>
            <span class="res-text">
              Stock Reserved (24h Hold)
              <ng-container *ngIf="isReservedByMe(item)">&bull; Held exclusively for you</ng-container>
            </span>
            <button
              *ngIf="isReservedByMe(item)"
              class="btn-cancel-res"
              (click)="releaseStock(item)"
              title="Release reserved stock back to open market"
            >
              Release
            </button>
          </div>

          <div class="card-header">
            <div>
              <div class="crop-header">
                <h3 class="crop-name">{{ item.cropType }}</h3>
                <app-badge [showDot]="true">{{ item.qualityGrade }}</app-badge>
              </div>
              <div class="location-text">
                <app-icon name="map-pin" [size]="12"></app-icon>
                <span>{{ item.district }}, {{ item.region }} &bull; {{ item.distanceKm }} km away</span>
              </div>
            </div>

            <div class="price-box">
              <div class="price-val">₹{{ item.pricePerTon.toLocaleString('en-IN') }}</div>
              <div class="price-unit">per tonne</div>
            </div>
          </div>

          <div class="specs-grid">
            <div class="spec-cell">
              <span class="spec-label">Available</span>
              <span class="spec-value">{{ item.quantityTons }} Tonnes</span>
            </div>
            <div class="spec-cell">
              <span class="spec-label">Moisture</span>
              <span class="spec-value">{{ item.moisturePercent }}% ({{ item.moistureLevel | uppercase }})</span>
            </div>
            <div class="spec-cell">
              <span class="spec-label">Baling Format</span>
              <span class="spec-value">{{ item.balingType }}</span>
            </div>
            <div class="spec-cell">
              <span class="spec-label">Calorific Value</span>
              <span class="spec-value">{{ item.calorificValue }}</span>
            </div>
          </div>

          <p class="description-text">{{ item.description }}</p>

          <div class="card-footer">
            <div class="farmer-info">
              <span class="farmer-name">{{ item.farmerName }}</span>
              <span class="farmer-meta">Rating: {{ item.rating }} &bull; {{ item.dealsCompleted }} deals</span>
            </div>

            <div class="card-actions">
              <!-- USP 4: Reserve Stock Button -->
              <button
                *ngIf="item.status !== 'reserved'"
                class="btn-reserve btn-sm"
                (click)="reserveStock(item)"
                title="Lock stock exclusively for 24 hours"
              >
                <span>🔒 Reserve (24h)</span>
              </button>

              <button class="btn-secondary btn-sm" (click)="openLogisticsModal(item)" title="Calculate Freight & Value">
                <app-icon name="truck" [size]="13"></app-icon>
                <span>Logistics</span>
              </button>

              <button class="btn-primary btn-sm" (click)="startNegotiation(item)">
                <app-icon name="message" [size]="13"></app-icon>
                <span>Negotiate</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ng-template #noListings>
        <div class="empty-state-box">
          <app-icon name="search" [size]="28"></app-icon>
          <div class="empty-title">No listings match your criteria</div>
          <p class="empty-desc">Try widening the radius slider or resetting crop and moisture filters.</p>
          <div style="display: flex; gap: 8px; justify-content: center; margin-top: 10px; flex-wrap: wrap;">
            <button class="btn-primary btn-sm" (click)="resetFilters()">Show All Pan-India Listings</button>
            <button class="btn-secondary btn-sm" (click)="resetFilters()">Reset All Filters</button>
          </div>
        </div>
      </ng-template>

      <!-- Logistics Calculator Modal -->
      <app-logistics-modal
        *ngIf="selectedListingForModal"
        [listing]="selectedListingForModal"
        (closed)="selectedListingForModal = undefined"
      ></app-logistics-modal>

      <!-- USP 3 Quality Scorecard Breakdown Modal -->
      <div *ngIf="selectedListingForScorecard" class="modal-backdrop" (click)="selectedListingForScorecard = undefined">
        <div class="scorecard-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="modal-badge font-outfit">USP 3: QUALITY-BASED SUPPLIER RANKING</span>
              <h3 class="modal-title font-syne">{{ selectedListingForScorecard.cropType }} Scorecard</h3>
              <p class="modal-subtitle font-outfit">
                Supplier: {{ selectedListingForScorecard.farmerName }} &bull; {{ selectedListingForScorecard.district }}, {{ selectedListingForScorecard.region }}
              </p>
            </div>
            <button class="btn-close" (click)="selectedListingForScorecard = undefined">&times;</button>
          </div>

          <div class="modal-body font-outfit" *ngIf="getScorecard(selectedListingForScorecard) as sc">
            <div class="score-hero" [style.borderColor]="sc.badgeColor">
              <div class="score-num font-syne" [style.color]="sc.badgeColor">{{ sc.aqiScore }}</div>
              <div class="score-max font-outfit">/ 100 AQI</div>
              <div class="score-tier font-outfit" [style.background]="sc.badgeColor + '20'" [style.color]="sc.badgeColor">
                {{ sc.grade }}
              </div>
            </div>

            <div class="criteria-list">
              <div class="criterion-item">
                <div class="crit-head">
                  <span>Moisture Index (&le;12% Boiler Spec)</span>
                  <span class="crit-score font-bold">{{ sc.breakdown.moistureScore }} / 30 pts</span>
                </div>
                <div class="progress-bar">
                  <div class="bar-fill" [style.width.%]="(sc.breakdown.moistureScore / 30) * 100"></div>
                </div>
                <div class="crit-detail">{{ selectedListingForScorecard.moisturePercent }}% Farm-Gate Moisture</div>
              </div>

              <div class="criterion-item">
                <div class="crit-head">
                  <span>Gross Calorific Energy (GCV)</span>
                  <span class="crit-score font-bold">{{ sc.breakdown.calorificScore }} / 25 pts</span>
                </div>
                <div class="progress-bar">
                  <div class="bar-fill" [style.width.%]="(sc.breakdown.calorificScore / 25) * 100"></div>
                </div>
                <div class="crit-detail">{{ selectedListingForScorecard.calorificValue }}</div>
              </div>

              <div class="criterion-item">
                <div class="crit-head">
                  <span>Ash Content (&le;6% Low Slagging)</span>
                  <span class="crit-score font-bold">{{ sc.breakdown.ashScore }} / 15 pts</span>
                </div>
                <div class="progress-bar">
                  <div class="bar-fill" [style.width.%]="(sc.breakdown.ashScore / 15) * 100"></div>
                </div>
                <div class="crit-detail">{{ selectedListingForScorecard.ashPercent || 6 }}% Lab Analyzed Ash Content</div>
              </div>

              <div class="criterion-item">
                <div class="crit-head">
                  <span>APMC Weighbridge Verification</span>
                  <span class="crit-score font-bold">{{ sc.breakdown.verificationScore }} / 15 pts</span>
                </div>
                <div class="progress-bar">
                  <div class="bar-fill" [style.width.%]="(sc.breakdown.verificationScore / 15) * 100"></div>
                </div>
                <div class="crit-detail">{{ selectedListingForScorecard.verified ? 'Verified Digital Weighbridge Scale Slip' : 'Self-declared tonnage' }}</div>
              </div>

              <div class="criterion-item">
                <div class="crit-head">
                  <span>Baling Format & Density</span>
                  <span class="crit-score font-bold">{{ sc.breakdown.balingScore }} / 15 pts</span>
                </div>
                <div class="progress-bar">
                  <div class="bar-fill" [style.width.%]="(sc.breakdown.balingScore / 15) * 100"></div>
                </div>
                <div class="crit-detail">{{ selectedListingForScorecard.balingType }} (High Truck Packing Density)</div>
              </div>
            </div>

            <div class="modal-footer-actions">
              <button class="btn-primary" (click)="startNegotiation(selectedListingForScorecard); selectedListingForScorecard = undefined">
                <app-icon name="message" [size]="14"></app-icon>
                <span>Initiate Negotiation with Supplier</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .suppliers-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .suppliers-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
    }

    .page-title {
      font-size: 20px;
      font-weight: 600;
    }

    .page-subtitle {
      font-size: 13px;
      color: var(--secondary-text);
      margin-top: 2px;
    }

    .header-count {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .count-val {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-text);
    }

    .count-label {
      font-size: 11px;
      color: var(--secondary-text);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .filters-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      background-color: var(--sidebar-background);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .search-input-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
      background-color: var(--background);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 6px 12px;
    }

    .main-search-input {
      flex: 1;
      border: none;
      padding: 0;
      background: transparent;
      outline: none;
    }

    .filter-controls-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      align-items: flex-end;
    }

    .filter-select-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .filter-select-group label {
      font-size: 11px;
      font-weight: 500;
      color: var(--secondary-text);
    }

    .filter-select-group select {
      width: 100%;
      padding: 6px 8px;
      font-size: 12px;
    }

    .filter-slider-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .slider-header label {
      font-size: 11px;
      font-weight: 500;
      color: var(--secondary-text);
    }

    .slider-val {
      font-size: 11px;
      font-weight: 600;
      color: var(--primary-text);
    }

    .listings-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .supplier-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
      background-color: var(--card-background);
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: border-color 120ms ease;
    }

    .supplier-card:hover {
      border-color: var(--primary-text);
    }

    .card-thumb {
      margin: -18px -18px 0 -18px;
      height: 135px;
      overflow: hidden;
      position: relative;
      background-color: var(--sidebar-background);
      border-bottom: 1px solid var(--border);
    }

    .card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 180ms ease;
    }

    .supplier-card:hover .card-img {
      transform: scale(1.03);
    }

    .weighbridge-tag {
      position: absolute;
      bottom: 8px;
      left: 8px;
      background-color: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      color: #fff;
      font-size: 10px;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .crop-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .crop-name {
      font-size: 16px;
      font-weight: 600;
    }

    .location-text {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--secondary-text);
      margin-top: 4px;
    }

    .price-box {
      text-align: right;
    }

    .price-val {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-text);
      letter-spacing: -0.01em;
    }

    .price-unit {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .specs-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      padding: 10px 12px;
      background-color: var(--sidebar-background);
      border-radius: 6px;
      border: 1px solid var(--border);
    }

    .spec-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .spec-label {
      font-size: 10px;
      color: var(--secondary-text);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .spec-value {
      font-size: 12px;
      font-weight: 600;
      color: var(--primary-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .description-text {
      font-size: 13px;
      line-height: 1.5;
      color: var(--secondary-text);
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--border);
      padding-top: 12px;
      margin-top: auto;
    }

    .farmer-info {
      display: flex;
      flex-direction: column;
    }

    .farmer-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text);
    }

    .farmer-meta {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .empty-state-box {
      border: 1px dashed var(--border);
      border-radius: 8px;
      padding: 48px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      text-align: center;
      color: var(--secondary-text);
    }

    .empty-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--primary-text);
    }

    .empty-desc {
      font-size: 13px;
      max-width: 400px;
    }

    .supplier-card.is-reserved {
      border-color: rgba(217, 119, 6, 0.4);
      background: linear-gradient(180deg, var(--surface-card) 92%, rgba(217, 119, 6, 0.05) 100%);
    }

    .aqi-card-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(11, 20, 13, 0.85);
      backdrop-filter: blur(4px);
      border: 1px solid #10B981;
      color: #10B981;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }

    .aqi-card-badge:hover {
      background: #10B981;
      color: #FFFFFF;
      transform: translateY(-1px);
    }

    .reservation-status-strip {
      background: rgba(217, 119, 6, 0.12);
      border-bottom: 1px solid rgba(217, 119, 6, 0.25);
      padding: 6px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11.5px;
      font-weight: 600;
      color: #D97706;
    }

    .btn-cancel-res {
      background: none;
      border: 1px solid #D97706;
      color: #D97706;
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-reserve {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #059669;
      font-weight: 600;
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-reserve:hover {
      background: #10B981;
      color: #FFFFFF;
    }

    .scorecard-modal {
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      width: 100%;
      max-width: 520px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .modal-badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 2px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
    }

    .score-hero {
      background: var(--hover-background);
      border: 2px solid;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .score-num {
      font-size: 44px;
      font-weight: 900;
      line-height: 1;
    }

    .score-max {
      font-size: 13px;
      color: var(--secondary-text);
      font-weight: 600;
    }

    .score-tier {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      padding: 3px 12px;
      border-radius: 9999px;
      margin-top: 4px;
    }

    .criteria-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .criterion-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .crit-head {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--primary-text);
    }

    .progress-bar {
      height: 6px;
      background: var(--border);
      border-radius: 9999px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: #10B981;
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    .crit-detail {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 24px;
      color: var(--secondary-text);
      cursor: pointer;
    }

    @media (max-width: 1024px) {
      .listings-grid {
        grid-template-columns: 1fr;
      }
      .filter-controls-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .specs-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .filter-controls-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SuppliersComponent implements OnInit {
  marketplaceService = inject(MarketplaceService);
  private negotiationService = inject(NegotiationService);
  private qualityRankingService = inject(QualityRankingService);
  private authService = inject(AuthService);
  private router = inject(Router);

  selectedListingForModal?: Listing;
  selectedListingForScorecard?: Listing;

  ngOnInit(): void {
    this.marketplaceService.fetchBackendListings();
  }

  openLogisticsModal(item: Listing): void {
    this.selectedListingForModal = item;
  }

  openScorecardModal(item: Listing): void {
    this.selectedListingForScorecard = item;
  }

  getScorecard(item: Listing): QualityScorecard {
    return this.qualityRankingService.calculateAqi(item);
  }

  isReservedByMe(item: Listing): boolean {
    const myId = this.authService.currentUser()?.id || 'buyer_1';
    return item.reservedBy?.buyerId === myId;
  }

  async reserveStock(item: Listing): Promise<void> {
    const user = this.authService.currentUser();
    const buyerInfo = {
      id: user?.id || 'buyer_1',
      name: user?.name || 'Industrial Procurement',
      phone: user?.phone || '+91 9279211804'
    };
    await this.marketplaceService.reserveStock(item.id, item.quantityTons, buyerInfo);
  }

  async releaseStock(item: Listing): Promise<void> {
    await this.marketplaceService.cancelReservation(item.id);
  }

  startNegotiation(item: Listing): void {
    const threadId = this.negotiationService.startNegotiationWithListing(
      item,
      this.authService.currentUser()?.name || 'Buyer Procurement'
    );
    this.router.navigate(['/negotiations']);
  }

  resetFilters(): void {
    this.marketplaceService.searchQuery.set('');
    this.marketplaceService.selectedCrop.set('all');
    this.marketplaceService.selectedMoisture.set('all');
    this.marketplaceService.selectedBaling.set('all');
    this.marketplaceService.maxDistance.set(2500);
    this.marketplaceService.sortBy.set('quality-desc');
  }
}
