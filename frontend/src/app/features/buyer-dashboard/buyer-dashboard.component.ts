import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MarketplaceService } from '../../core/services/marketplace.service';
import { NegotiationService } from '../../core/services/negotiation.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { Listing } from '../../core/models/marketplace.model';

@Component({
  selector: 'app-buyer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, BadgeComponent],
  template: `
    <div class="dashboard-page">
      <!-- Top Proximity Hub Strip -->
      <div class="buyer-gps-strip">
        <div class="gps-strip-left">
          <span class="live-beacon"></span>
          <span class="gps-tag">BUYER SOURCING RADAR</span>
          <span class="gps-hub-name">
            Factory Gate Hub: <strong>{{ marketplaceService.currentHub().name }}</strong>
          </span>
          <span class="gps-scope-badge">
            📍 {{ nearbyResidueListings().length }} Farmer Lots Available within 100 km
          </span>
        </div>
        <div class="gps-strip-right">
          <button class="btn-refresh" (click)="refreshData()" title="Fetch latest listings from MongoDB Atlas">
            <app-icon name="refresh" [size]="13"></app-icon>
            <span>🔄 Refresh Live Data</span>
          </button>
          <a routerLink="/proximity-radar" class="btn-radar-link">
            <app-icon name="radar" [size]="13"></app-icon>
            <span>Open 100 km Radar Map</span>
          </a>
        </div>
      </div>

      <!-- Header -->
      <div class="dashboard-header">
        <div>
          <div class="role-flag">🏭 Industrial Biomass Procurement Workspace</div>
          <h2 class="dashboard-title">Buyer Dashboard</h2>
          <p class="dashboard-subtitle">Direct factory feedstock sourcing: view live crop stubble listings from verified farmers, manage bulk quotas, and track weighbridge shipments.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/suppliers" class="btn-secondary">
            <app-icon name="search" [size]="14"></app-icon>
            <span>Find Suppliers</span>
          </a>
          <a routerLink="/bulk-requirements" class="btn-primary">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Post 100 KM Intake Quota</span>
          </a>
        </div>
      </div>

      <!-- Escrow Guarantee Trust Banner -->
      <div class="escrow-banner-strip">
        <div class="escrow-banner-left">
          <span class="escrow-icon-box">
            <app-icon name="shield" [size]="16"></app-icon>
          </span>
          <div>
            <div class="escrow-banner-title">
              AgriMech 50% Escrow Fraud & Moisture Lab Clearance Active
            </div>
            <div class="escrow-banner-sub">
              Your 50% advance deposit is safely locked in neutral AgriMech Trust Vault. Funds will NOT disburse until gross weighbridge tare and moisture clearance at your factory gate. 100% money-back if inspection fails.
            </div>
          </div>
        </div>
        <a routerLink="/orders" class="btn-vault-link">
          <span>Track Vault Orders</span>
          <app-icon name="arrow-right" [size]="12"></app-icon>
        </a>
      </div>

      <!-- Summary Statistics (4 items) -->
      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-label">My Posted Quotas</div>
          <div class="stat-value font-mono">{{ myRequirements().length }}</div>
          <div class="stat-hint">{{ totalQuotasTonnes().toLocaleString('en-IN') }} t total demand</div>
        </div>
        <div class="stat-box highlight-box">
          <div class="stat-label">Available Biomass Lots</div>
          <div class="stat-value font-mono">{{ marketplaceService.listings().length }} Lots</div>
          <div class="stat-hint">{{ totalAvailableSupplyTonnes().toLocaleString('en-IN') }} Tonnes in market</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Nearby Within 100 KM</div>
          <div class="stat-value font-mono">{{ nearbyResidueListings().length }} Farms</div>
          <div class="stat-hint">Local transport radius</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Active Orders & Vaults</div>
          <div class="stat-value font-mono">{{ activeOrdersCount() }}</div>
          <div class="stat-hint">{{ incomingOffersCount() }} active supplier offers</div>
        </div>
      </div>

      <!-- Satellite Supply Intelligence Callout Banner -->
      <div class="satellite-callout-banner">
        <div class="satellite-callout-left">
          <div class="sat-badge font-outfit">
            <span class="sat-dot"></span>
            NEW: SATELLITE SUPPLY INTELLIGENCE
          </div>
          <h3 class="sat-title font-syne">Predict untapped crop residue before farmers register on AgriMech.</h3>
          <p class="sat-desc font-outfit">
            Scan multispectral Sentinel-2 estimation layers, model village-level residue yields, and discover high-potential biomass clusters beyond registered farm listings.
          </p>
        </div>
        <div class="satellite-callout-right">
          <a routerLink="/satellite-intelligence" class="btn-sat-launch font-outfit">
            <app-icon name="satellite" [size]="15"></app-icon>
            <span>Explore Satellite Intelligence</span>
            <span>&rarr;</span>
          </a>
        </div>
      </div>

      <!-- USP 1: Intelligent Multi-Farmer Optimizer Callout Banner -->
      <div class="optimizer-callout-banner">
        <div class="optimizer-callout-left">
          <div class="opt-badge font-outfit">
            <span class="opt-dot"></span>
            USP 1: MULTI-FARMER ORDER OPTIMIZER
          </div>
          <h3 class="opt-title font-syne">Fulfill commercial intake quotas by bundling multiple nearby farmers.</h3>
          <p class="opt-desc font-outfit">
            Need 100 to 1,000 tonnes of boiler biomass? The intelligent optimizer automatically bundles smallholder farmers to guarantee minimum landed freight and verified AQI specs.
          </p>
        </div>
        <div class="optimizer-callout-right">
          <a routerLink="/order-optimizer" class="btn-opt-launch font-outfit">
            <span>⚡ Launch Multi-Farmer Optimizer</span>
            <span>&rarr;</span>
          </a>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- SECTION 1: AVAILABLE CROP RESIDUE LOTS FROM SELLERS (CRITICAL)   -->
      <!-- ================================================================= -->
      <div class="section-container">
        <div class="section-header">
          <div>
            <div class="section-tag-row">
              <span class="badge-supply font-mono font-bold">🌾 DIRECT FARM-GATE SUPPLY</span>
              <h3 class="section-title">Available Crop Residue Lots (Seller Listings)</h3>
            </div>
            <p class="section-subtitle">
              Live post-harvest biomass listed by farmers and FPOs. Connect directly, initiate price negotiation, or deposit escrow.
            </p>
          </div>
          <div class="scope-controls">
            <button
              class="scope-btn"
              [class.active]="scopeFilter() === 'all'"
              (click)="scopeFilter.set('all')"
            >
              All India Lots ({{ marketplaceService.listings().length }})
            </button>
            <button
              class="scope-btn"
              [class.active]="scopeFilter() === 'nearby'"
              (click)="scopeFilter.set('nearby')"
            >
              📍 Within 100 km ({{ nearbyResidueListings().length }})
            </button>
            <a routerLink="/suppliers" class="btn-ghost btn-sm">
              <span>Filter All</span>
              <app-icon name="arrow-right" [size]="13"></app-icon>
            </a>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="displayedListings().length === 0" class="empty-state-card">
          <span class="empty-icon">🌾</span>
          <div class="empty-title">
            {{ scopeFilter() === 'nearby' ? 'No Farmer Lots within 100 km of current center' : 'No Biomass Listings in Marketplace' }}
          </div>
          <p class="empty-desc">
            {{ scopeFilter() === 'nearby'
                ? 'Try clicking "All India Lots" above to view available crop residue lots across all regions.'
                : 'Farmers are currently preparing their harvest lots. Post an intake quota to notify regional suppliers!' }}
          </p>
          <button *ngIf="scopeFilter() === 'nearby' && marketplaceService.listings().length > 0" class="btn-primary btn-sm mt-3" (click)="scopeFilter.set('all')">
            Show All {{ marketplaceService.listings().length }} Pan-India Lots
          </button>
        </div>

        <!-- Listings Grid -->
        <div *ngIf="displayedListings().length > 0" class="listings-grid">
          <div *ngFor="let item of displayedListings()" class="listing-card">
            <!-- Top Bar -->
            <div class="card-top-bar">
              <div class="crop-badge-group">
                <span class="crop-title font-bold">{{ item.cropType }}</span>
                <span class="weighbridge-tag font-mono text-xs" *ngIf="item.verified">
                  <app-icon name="check" [size]="10"></app-icon>
                  <span>APMC Verified</span>
                </span>
                <!-- USP 3 AQI Tag -->
                <span class="aqi-score-badge font-outfit">★ {{ item.aqiScore || 88 }}/100 AQI</span>
              </div>
              <span class="distance-pill font-mono" [class.local-pill]="item.distanceKm <= 100">
                📍 {{ item.distanceKm }} km away
              </span>
            </div>

            <!-- Price and Quantity Highlight -->
            <div class="price-tonnage-strip">
              <div class="rate-box">
                <span class="rate-val">₹{{ item.pricePerTon.toLocaleString('en-IN') }}</span>
                <span class="rate-sub">per tonne</span>
              </div>
              <div class="tonnage-box">
                <span class="tonnage-val">{{ item.quantityTons }} t</span>
                <span class="tonnage-sub">Available Lot</span>
              </div>
            </div>

            <!-- Specs Grid -->
            <div class="specs-pill-row">
              <span class="spec-pill">💧 {{ item.moisturePercent }}% Moisture ({{ item.moistureLevel | uppercase }})</span>
              <span class="spec-pill">📦 {{ item.balingType }}</span>
              <span class="spec-pill" *ngIf="item.storageType">🏠 {{ item.storageType }}</span>
            </div>

            <!-- Farmer Contact & Location -->
            <div class="card-farmer-info">
              <div class="farmer-name-row">
                <span class="farmer-label">Farmer Seller:</span>
                <span class="farmer-name font-medium">{{ item.farmerName }}</span>
              </div>
              <div class="farmer-loc-row text-xs text-secondary">
                <span>📍 {{ item.district }}, {{ item.region }}</span>
                <span *ngIf="item.farmerPhone" class="farmer-phone font-mono font-medium">📞 {{ item.farmerPhone }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="card-action-footer">
              <!-- USP 4: Reserve Stock Button -->
              <button
                *ngIf="item.status !== 'reserved'"
                class="btn-reserve btn-sm action-btn"
                (click)="reserveLot(item)"
                title="Lock stock exclusively for 24 hours"
              >
                <span>🔒 Reserve (24h)</span>
              </button>
              <span *ngIf="item.status === 'reserved'" class="reserved-tag-pill font-outfit">
                🔒 Stock Reserved (24h)
              </span>

              <button class="btn-secondary btn-sm action-btn" (click)="startNegotiationWithSeller(item)">
                <app-icon name="message" [size]="13"></app-icon>
                <span>Negotiate Rate</span>
              </button>
              <button class="btn-primary btn-sm action-btn" (click)="sourceFromListing(item)">
                <app-icon name="shopping-bag" [size]="13"></app-icon>
                <span>Source Feedstock</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- SECTION 2: MY INDUSTRIAL PROCUREMENT POOLS (BUYER'S OWN QUOTAS)  -->
      <!-- ================================================================= -->
      <div class="section-container">
        <div class="section-header">
          <div>
            <div class="section-tag-row">
              <span class="badge-quota font-mono font-bold">🏭 MY FACTORY QUOTAS</span>
              <h3 class="section-title">My Industrial Procurement Pools</h3>
            </div>
            <p class="section-subtitle">Aggregated feedstock requirements published by your organization for commercial intake</p>
          </div>
          <a routerLink="/bulk-requirements" class="btn-ghost btn-sm">
            <span>Manage Pools</span>
            <app-icon name="arrow-right" [size]="13"></app-icon>
          </a>
        </div>

        <div class="table-container">
          <table *ngIf="myRequirements().length > 0; else emptyRequirements">
            <thead>
              <tr>
                <th>RFQ ID</th>
                <th>Requirement Title</th>
                <th>Crop Residue</th>
                <th>Target Quota</th>
                <th>Aggregated</th>
                <th>Target Offered Rate</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let pool of myRequirements()">
                <td class="font-mono text-xs">{{ pool.id }}</td>
                <td class="font-medium">{{ pool.title }}</td>
                <td>{{ pool.cropType }}</td>
                <td>{{ pool.requiredTons }} t</td>
                <td>
                  <span class="font-bold">{{ pool.pooledTons }} t</span>
                  <span class="text-secondary text-xs"> ({{ ((pool.pooledTons / pool.requiredTons) * 100).toFixed(0) }}%)</span>
                </td>
                <td>₹{{ pool.targetPricePerTon.toLocaleString('en-IN') }}/t</td>
                <td>
                  <app-badge [variant]="pool.status === 'Fulfilled' ? 'solid' : 'default'">
                    {{ pool.status }}
                  </app-badge>
                </td>
                <td>
                  <a routerLink="/bulk-requirements" class="btn-secondary btn-sm">Inspect Pool</a>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #emptyRequirements>
            <div class="empty-state">
              <app-icon name="layers" [size]="24"></app-icon>
              <div class="empty-text">
                You haven't posted any biomass intake quotas yet. Broadcast a 100 KM Quota to alert all verified farmers within 100 km of your plant gate!
              </div>
              <a routerLink="/bulk-requirements" class="btn-primary btn-sm">
                <app-icon name="plus" [size]="12"></app-icon>
                <span>+ Broadcast 100 KM Quota</span>
              </a>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- SECTION 3: ACTIVE CONSIGNMENTS & TRUCK SHIPMENTS                  -->
      <!-- ================================================================= -->
      <div class="section-container">
        <div class="section-header">
          <div>
            <h3 class="section-title">Active Consignments & Dispatches</h3>
            <p class="section-subtitle">Real-time status of truck dispatch and weighbridge clearings</p>
          </div>
          <a routerLink="/orders" class="btn-ghost btn-sm">
            <span>View All Orders</span>
            <app-icon name="arrow-right" [size]="13"></app-icon>
          </a>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Supplier</th>
                <th>Crop Type</th>
                <th>Volume</th>
                <th>Total Value</th>
                <th>Logistics Tracking</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="orderService.orders().length === 0">
                <td colspan="7" style="text-align: center; padding: 32px 16px; color: var(--secondary-text);">
                  No active consignments or orders yet. Once a deal is confirmed in Negotiations, real-time weighbridge status will track here.
                </td>
              </tr>
              <tr *ngFor="let order of orderService.orders()">
                <td class="font-mono text-xs">{{ order.id }}</td>
                <td class="font-medium">{{ order.sellerName }}</td>
                <td>{{ order.cropType }}</td>
                <td>{{ order.quantityTons }} Tonnes</td>
                <td>₹{{ order.totalAmount.toLocaleString('en-IN') }}</td>
                <td class="text-secondary text-xs">{{ order.truckDetails }}</td>
                <td>
                  <app-badge [showDot]="true">{{ order.status }}</app-badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .buyer-gps-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 10px 16px;
      border-radius: 8px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      flex-wrap: wrap;
    }

    .gps-strip-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 13px;
    }

    .live-beacon {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.15); }
    }

    .gps-tag {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: var(--badge-bg);
      border: 1px solid var(--border);
    }

    .gps-scope-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background-color: var(--card-background);
      border: 1px solid var(--border);
      color: var(--primary-text);
      font-weight: 600;
    }

    .gps-strip-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background-color: var(--background);
      color: var(--primary-text);
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .btn-refresh:hover {
      background-color: var(--sidebar-background);
    }

    .btn-radar-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background-color: var(--primary-text);
      color: var(--background);
      text-decoration: none;
    }

    .role-flag {
      font-size: 11px;
      font-weight: 600;
      color: var(--secondary-text);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }

    .dashboard-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }

    .dashboard-title {
      font-size: 20px;
      font-weight: 600;
    }

    .dashboard-subtitle {
      font-size: 13px;
      color: var(--secondary-text);
      margin-top: 2px;
      max-width: 780px;
      line-height: 1.4;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .satellite-callout-banner {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(14, 165, 233, 0.12) 100%);
      border: 1.5px solid rgba(16, 185, 129, 0.45);
      border-radius: 12px;
      padding: 18px 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }

    .sat-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.22);
      color: #059669;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
    }

    .sat-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 6px rgba(16, 185, 129, 0.8);
    }

    .sat-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--primary-text);
      margin: 0 0 4px 0;
    }

    .sat-desc {
      font-size: 12.5px;
      color: var(--secondary-text);
      max-width: 640px;
      margin: 0;
      line-height: 1.4;
    }

    .btn-sat-launch {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #059669;
      color: #FFFFFF;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(5, 150, 105, 0.25);
    }

    .btn-sat-launch:hover {
      background: #047857;
      transform: translateY(-1px);
    }

    .optimizer-callout-banner {
      background: linear-gradient(135deg, rgba(217, 119, 6, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%);
      border: 1.5px solid rgba(217, 119, 6, 0.4);
      border-radius: 12px;
      padding: 18px 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .opt-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(217, 119, 6, 0.2);
      color: #D97706;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
    }

    .opt-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #D97706;
    }

    .opt-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--primary-text);
      margin: 0 0 4px 0;
    }

    .opt-desc {
      font-size: 12.5px;
      color: var(--secondary-text);
      max-width: 640px;
      margin: 0;
      line-height: 1.4;
    }

    .btn-opt-launch {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #D97706;
      color: #FFFFFF;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .btn-opt-launch:hover {
      background: #B45309;
      transform: translateY(-1px);
    }

    .aqi-score-badge {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #059669;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
    }

    .reserved-tag-pill {
      background: rgba(217, 119, 6, 0.12);
      border: 1px solid rgba(217, 119, 6, 0.35);
      color: #D97706;
      font-size: 11px;
      font-weight: 700;
      padding: 5px 10px;
      border-radius: 6px;
    }

    .escrow-banner-strip {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 16px;
      background-color: var(--sidebar-background);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .escrow-banner-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .escrow-icon-box {
      width: 34px;
      height: 34px;
      border-radius: 6px;
      background-color: var(--primary-text);
      color: var(--background);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .escrow-banner-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary-text);
    }

    .escrow-banner-sub {
      font-size: 11px;
      color: var(--secondary-text);
      margin-top: 2px;
      line-height: 1.4;
    }

    .btn-vault-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 600;
      color: var(--primary-text);
      text-decoration: none;
      white-space: nowrap;
      padding: 6px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background-color: var(--background);
      transition: background-color 0.15s;
    }

    .btn-vault-link:hover {
      background-color: var(--border);
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }

    .stat-box {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 16px;
      background-color: var(--sidebar-background);
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .highlight-box {
      border-color: var(--primary-text);
    }

    .stat-label {
      font-size: 12px;
      color: var(--secondary-text);
      font-weight: 600;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--primary-text);
      letter-spacing: -0.02em;
    }

    .stat-hint {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .section-container {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .section-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
    }

    .section-tag-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 2px;
    }

    .badge-supply {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      background-color: #059669;
      color: #ffffff;
    }

    .badge-quota {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      background-color: var(--primary-text);
      color: var(--card-background);
    }

    .section-title {
      font-size: 17px;
      font-weight: 700;
      margin: 0;
    }

    .section-subtitle {
      font-size: 12px;
      color: var(--secondary-text);
      margin: 2px 0 0 0;
    }

    .scope-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .scope-btn {
      font-size: 11px;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background-color: var(--background);
      color: var(--secondary-text);
      cursor: pointer;
      transition: all 0.15s;
    }

    .scope-btn.active {
      background-color: var(--primary-text);
      color: var(--background);
      border-color: var(--primary-text);
    }

    .listings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 14px;
    }

    .listing-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      background-color: var(--card-background);
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .listing-card:hover {
      border-color: var(--primary-text);
      box-shadow: 0 4px 14px rgba(0,0,0,0.04);
    }

    .card-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }

    .crop-badge-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .crop-title {
      font-size: 15px;
      color: var(--primary-text);
    }

    .weighbridge-tag {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      color: #059669;
      background-color: rgba(5, 150, 105, 0.1);
      padding: 1px 5px;
      border-radius: 4px;
      width: fit-content;
    }

    .distance-pill {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 4px;
      background-color: var(--badge-bg);
      border: 1px solid var(--border);
      white-space: nowrap;
    }

    .local-pill {
      background-color: rgba(34, 197, 94, 0.12);
      border-color: rgba(34, 197, 94, 0.4);
      color: #15803d;
      font-weight: 700;
    }

    .price-tonnage-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background-color: var(--sidebar-background);
      border-radius: 6px;
      border: 1px solid var(--border);
    }

    .rate-box, .tonnage-box {
      display: flex;
      flex-direction: column;
    }

    .rate-val {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-text);
    }

    .tonnage-val {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-text);
      text-align: right;
    }

    .rate-sub, .tonnage-sub {
      font-size: 10px;
      color: var(--secondary-text);
      text-transform: uppercase;
    }

    .specs-pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .spec-pill {
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 4px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      color: var(--secondary-text);
    }

    .card-farmer-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
      border-top: 1px dashed var(--border);
      padding-top: 8px;
      font-size: 12px;
    }

    .farmer-name-row {
      display: flex;
      gap: 6px;
    }

    .farmer-label {
      color: var(--secondary-text);
    }

    .farmer-loc-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .farmer-phone {
      color: var(--primary-text);
    }

    .card-action-footer {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 4px;
    }

    .action-btn {
      width: 100%;
      justify-content: center;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .empty-state-card {
      border: 1px dashed var(--border);
      border-radius: 8px;
      padding: 36px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      background-color: var(--sidebar-background);
    }

    .empty-icon {
      font-size: 32px;
    }

    .empty-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-text);
    }

    .empty-desc {
      font-size: 12px;
      color: var(--secondary-text);
      max-width: 440px;
      margin: 0;
    }

    .font-mono {
      font-family: monospace;
    }

    .font-medium {
      font-weight: 500;
    }

    .font-bold {
      font-weight: 700;
    }

    .text-xs {
      font-size: 11px;
    }

    .text-secondary {
      color: var(--secondary-text);
    }

    .empty-state {
      padding: 36px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      color: var(--secondary-text);
      text-align: center;
    }

    .empty-text {
      font-size: 13px;
      max-width: 480px;
      line-height: 1.5;
    }

    .mt-3 {
      margin-top: 12px;
    }

    @media (max-width: 960px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
      .listings-grid {
        grid-template-columns: 1fr;
      }
      .dashboard-header {
        flex-direction: column;
        align-items: stretch;
      }
      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }
      .section-header {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class BuyerDashboardComponent implements OnInit {
  marketplaceService = inject(MarketplaceService);
  negotiationService = inject(NegotiationService);
  orderService = inject(OrderService);
  authService = inject(AuthService);
  private router = inject(Router);

  scopeFilter = signal<'all' | 'nearby'>('all');

  currentUser = computed(() => this.authService.currentUser());

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData(): void {
    this.marketplaceService.fetchBackendListings();
    this.marketplaceService.fetchBackendPools();
    this.orderService.fetchBackendOrders();
  }

  private normalizePhone(phone?: string): string {
    return (phone || '').replace(/\D/g, '').slice(-10);
  }

  // Real User Scoping: Show requirements posted by the logged-in buyer ONLY!
  myRequirements = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    const userPhone = this.normalizePhone(user.phone);

    return this.marketplaceService.bulkRequirements().filter(b => {
      if (userPhone && b.buyerPhone && this.normalizePhone(b.buyerPhone) === userPhone) return true;
      if (user.id && b.buyerId && b.buyerId === user.id) return true;
      if (user.organization && b.buyerOrg && b.buyerOrg.toLowerCase().trim() === user.organization.toLowerCase().trim()) return true;
      return false;
    });
  });

  totalQuotasTonnes = computed(() =>
    this.myRequirements().reduce((acc, curr) => acc + curr.requiredTons, 0)
  );

  // All crop residue listings from sellers in the marketplace
  nearbyResidueListings = computed(() => {
    return this.marketplaceService.listings().filter(l => (l.distanceKm ?? 999) <= 100);
  });

  displayedListings = computed(() => {
    const filter = this.scopeFilter();
    if (filter === 'nearby') {
      return this.nearbyResidueListings();
    }
    // 'all' returns all active listings, sorted nearest first
    return [...this.marketplaceService.listings()].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  });

  totalAvailableSupplyTonnes = computed(() =>
    this.marketplaceService.listings().reduce((acc, curr) => acc + curr.quantityTons, 0)
  );

  activeRequirementsCount = computed(() => this.myRequirements().length);
  matchingSuppliersCount = computed(() => this.nearbyResidueListings().length);

  myBuyerThreads = computed(() => {
    const user = this.currentUser();
    if (!user) return [];

    return this.negotiationService.threads().filter(t => {
      if (user.role === 'buyer' && t.counterpartyRole === 'Seller') return true;
      return false;
    });
  });

  incomingOffersCount = computed(() => this.myBuyerThreads().length);

  activeOrdersCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    const userPhone = this.normalizePhone(user.phone);

    return this.orderService.orders().filter(o => {
      if (o.status === 'Delivered') return false;
      if (userPhone && o.buyerPhone && this.normalizePhone(o.buyerPhone) === userPhone) return true;
      return false;
    }).length;
  });

  startNegotiationWithSeller(listing: Listing): void {
    const user = this.currentUser();
    const buyerName = user?.name || user?.organization || 'Industrial Procurement Head';

    this.negotiationService.startNegotiationWithListing(listing, buyerName);
    this.router.navigate(['/negotiations']);
  }

  sourceFromListing(listing: Listing): void {
    this.router.navigate(['/suppliers']);
  }

  async reserveLot(item: Listing): Promise<void> {
    const user = this.currentUser();
    const buyerInfo = {
      id: user?.id || 'buyer_1',
      name: user?.name || user?.organization || 'Industrial Procurement Head',
      phone: user?.phone || '+91 9279211804'
    };
    await this.marketplaceService.reserveStock(item.id, item.quantityTons, buyerInfo);
  }
}
