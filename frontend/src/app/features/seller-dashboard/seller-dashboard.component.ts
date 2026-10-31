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
import { BulkRequirement } from '../../core/models/marketplace.model';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, BadgeComponent],
  template: `
    <div class="dashboard-page">
      <!-- Proximity Live Hub Header Strip -->
      <div class="seller-gps-strip">
        <div class="gps-strip-left">
          <span class="live-beacon"></span>
          <span class="gps-tag">SELLER RADAR INTELLIGENCE</span>
          <span class="gps-hub-name">
            Your Farm Center: <strong>{{ marketplaceService.currentHub().name }}</strong>
          </span>
          <span class="gps-scope-badge">
            📍 {{ displayedBuyers().length }} Industrial Biomass Demands Active
          </span>
        </div>
        <div class="gps-strip-right">
          <button class="btn-refresh" (click)="refreshData()" title="Fetch latest data from MongoDB Atlas">
            <app-icon name="refresh" [size]="13"></app-icon>
            <span>🔄 Refresh Live Data</span>
          </button>
          <a routerLink="/proximity-radar" class="btn-radar-link">
            <app-icon name="radar" [size]="13"></app-icon>
            <span>Open 100 km Visual Radar Map</span>
          </a>
        </div>
      </div>

      <!-- Main Header -->
      <div class="dashboard-header">
        <div>
          <div class="role-flag">🌾 Farmer & Residue Seller Workspace</div>
          <h2 class="dashboard-title">Seller Dashboard</h2>
          <p class="dashboard-subtitle">Track nearby factory procurement demand, incoming buyer orders, and residue inventory.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/residue-categories" class="btn-secondary">
            <app-icon name="grid" [size]="14"></app-icon>
            <span>Residue Categories</span>
          </a>
          <a routerLink="/new-listing" class="btn-primary">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Create Residue Listing</span>
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
              AgriMech 50% Milestone Escrow Guarantee Active
            </div>
            <div class="escrow-banner-sub">
              Buyers must deposit 50% advance into neutral AgriMech Vault before truck loading. Remaining 50% auto-released upon weighbridge tare clearance. Zero payment default risk.
            </div>
          </div>
        </div>
        <a routerLink="/orders" class="btn-vault-link">
          <span>View Vault Orders</span>
          <app-icon name="arrow-right" [size]="12"></app-icon>
        </a>
      </div>

      <!-- Summary Statistics (4 items) -->
      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-label">Active Stubble Listings</div>
          <div class="stat-value">{{ sellerListings().length }}</div>
          <div class="stat-hint">{{ totalAvailableTonnes() }} Tonnes in stock</div>
        </div>
        <div class="stat-box highlight-box">
          <div class="stat-label">Nearby Industrial Buyers</div>
          <div class="stat-value font-mono">{{ nearbyBuyers().length }} Plants</div>
          <div class="stat-hint">Within 100 km of your farm</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Total Factory Demand Quota</div>
          <div class="stat-value font-mono">{{ totalBuyerDemandTonnes().toLocaleString('en-IN') }} t</div>
          <div class="stat-hint">Thermal boilers & refineries</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Plant Inquiries & Orders</div>
          <div class="stat-value">{{ sellerThreads().length }}</div>
          <div class="stat-hint">{{ pendingOffersCount() }} active price offers</div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- SECTION 1: NEARBY INDUSTRIAL BUYERS (WITHIN 100 KM OF SELLER)     -->
      <!-- ================================================================= -->
      <div class="section-container">
        <div class="section-header">
          <div>
            <div class="section-tag-row">
              <span class="badge-nearby font-mono font-bold">🏭 INDUSTRIAL BIOMASS DEMANDS</span>
              <h3 class="section-title">Nearby Industrial Buyers Wanting Crop Residue</h3>
            </div>
            <p class="section-subtitle">
              Commercial boilers, paper mills, and 2G bio-refineries looking to procure agricultural residues.
            </p>
          </div>
          <div class="scope-controls">
            <button
              class="scope-btn"
              [class.active]="buyerScopeFilter() === 'all'"
              (click)="buyerScopeFilter.set('all')"
            >
              All India Quotas ({{ allBuyers().length }})
            </button>
            <button
              class="scope-btn"
              [class.active]="buyerScopeFilter() === 'nearby'"
              (click)="buyerScopeFilter.set('nearby')"
            >
              📍 Within 100 km ({{ nearbyBuyers().length }})
            </button>
            <a routerLink="/bulk-requirements" class="btn-ghost btn-sm">
              <span>View All</span>
              <app-icon name="arrow-right" [size]="13"></app-icon>
            </a>
          </div>
        </div>

        <div class="buyers-proximity-grid">
          <div *ngIf="displayedBuyers().length === 0" class="empty-state-card">
            <span class="empty-icon">🏭</span>
            <div class="empty-title">
              {{ buyerScopeFilter() === 'nearby' ? 'No Industrial Quotas Active within 100 km' : 'No Industrial Quotas in Marketplace' }}
            </div>
            <p class="empty-desc">
              {{ buyerScopeFilter() === 'nearby'
                  ? 'Switch to "All India Quotas" above to view active procurement demand across other regions.'
                  : 'Industrial buyers and boilers have not posted demand pools yet. Publish your residue listing to let buyers discover your lot!' }}
            </p>
            <button *ngIf="buyerScopeFilter() === 'nearby' && allBuyers().length > 0" class="btn-primary btn-sm mt-3" (click)="buyerScopeFilter.set('all')">
              Show All {{ allBuyers().length }} Pan-India Quotas
            </button>
            <a *ngIf="allBuyers().length === 0" routerLink="/new-listing" class="btn-primary btn-sm mt-3">+ Create Residue Listing</a>
          </div>

          <div *ngFor="let buyer of displayedBuyers()" class="buyer-proximity-card">
            <!-- Top Line: Plant Name & Distance -->
            <div class="card-top-bar">
              <div class="plant-name-group">
                <span class="factory-icon">🏭</span>
                <span class="plant-name">{{ buyer.buyerOrg }}</span>
              </div>
              <span class="distance-badge font-mono font-bold">
                📍 {{ buyer.distanceKm }} km away
              </span>
            </div>

            <!-- Title & Location -->
            <div class="card-title">{{ buyer.title }}</div>
            <div class="card-location text-xs text-secondary">
              Plant Location: <strong>{{ buyer.region }}</strong>
            </div>

            <!-- Residue Specs -->
            <div class="specs-pill-row">
              <span class="spec-pill">🌾 {{ buyer.cropType }}</span>
              <span class="spec-pill">🎯 Offered: ₹{{ buyer.targetPricePerTon.toLocaleString('en-IN') }}/Ton</span>
            </div>

            <!-- Quota Fulfillment Bar -->
            <div class="quota-progress-section">
              <div class="quota-labels">
                <span class="quota-text">Intake Quota: <strong>{{ buyer.requiredTons }} Tonnes</strong></span>
                <span class="quota-percent font-mono">{{ ((buyer.pooledTons / buyer.requiredTons) * 100).toFixed(0) }}% Pooled</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="(buyer.pooledTons / buyer.requiredTons) * 100"></div>
              </div>
            </div>

            <!-- Actions -->
            <div class="card-action-row">
              <a routerLink="/bulk-requirements" class="btn-primary btn-sm flex-1">
                <span>Supply to this Plant</span>
                <app-icon name="arrow-right" [size]="12"></app-icon>
              </a>
              <a routerLink="/negotiations" class="btn-secondary btn-sm">
                <span>Chat / Inquire</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- SECTION 2: INCOMING INQUIRIES & ORDERS (WITH BUYER DISTANCE)       -->
      <!-- ================================================================= -->
      <div class="section-container">
        <div class="section-header">
          <div>
            <div class="section-tag-row">
              <span class="badge-incoming font-mono font-bold">📥 INCOMING BUYER ORDERS</span>
              <h3 class="section-title">Plant Inquiries & Price Offers From Buyers</h3>
            </div>
            <p class="section-subtitle">
              Verify how far the buyer's plant is located, estimated highway transit time, and freight rates.
            </p>
          </div>
          <a routerLink="/negotiations" class="btn-ghost btn-sm">
            <span>Open Negotiation Desk</span>
            <app-icon name="arrow-right" [size]="13"></app-icon>
          </a>
        </div>

        <div class="table-container">
          <table *ngIf="sellerThreads().length > 0; else emptyThreads">
            <thead>
              <tr>
                <th>Inquiry ID</th>
                <th>Buyer Plant & Destination</th>
                <th>Distance from Farm</th>
                <th>Residue Lot</th>
                <th>Volume</th>
                <th>Offer Rate</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let thread of sellerThreads()">
                <td class="font-mono text-xs">{{ thread.id }}</td>
                <td>
                  <div class="buyer-cell">
                    <span class="font-medium buyer-name">🏭 {{ thread.counterpartyName }}</span>
                    <span class="text-secondary text-xs">{{ thread.buyerLocation || 'Direct Plant Delivery' }}</span>
                  </div>
                </td>
                <td>
                  <div class="dist-cell">
                    <span class="dist-pill font-mono font-bold">📍 {{ thread.distanceKm || 35 }} km away</span>
                    <span class="text-secondary text-xs">{{ thread.transitTime || '~1 hr highway transit' }}</span>
                  </div>
                </td>
                <td class="font-medium">{{ thread.cropType }}</td>
                <td class="font-mono">{{ thread.quantityTons }} Tonnes</td>
                <td>
                  <span class="font-mono font-bold text-primary">
                    ₹{{ (thread.currentOffer?.offeredPricePerTon || thread.askingPricePerTon).toLocaleString('en-IN') }}/t
                  </span>
                </td>
                <td>
                  <app-badge [variant]="thread.status === 'accepted' ? 'solid' : 'default'">
                    {{ thread.status | titlecase }}
                  </app-badge>
                </td>
                <td>
                  <a routerLink="/negotiations" class="btn-primary btn-sm">
                    <span>Respond</span>
                  </a>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #emptyThreads>
            <div class="empty-state">
              <app-icon name="message-square" [size]="24"></app-icon>
              <div class="empty-text">No incoming plant inquiries or price offers yet. When buyers within 100 km explore your listed biomass, incoming offers will appear here.</div>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- SECTION 3: ACTIVE SELLER INVENTORY                                -->
      <!-- ================================================================= -->
      <div class="section-container">
        <div class="section-header">
          <div>
            <h3 class="section-title">Active Residue Inventory</h3>
            <p class="section-subtitle">Real-time listings visible to buyers within your 100 km dispatch perimeter</p>
          </div>
          <div class="filter-box">
            <input
              type="text"
              placeholder="Filter inventory..."
              [ngModel]="searchFilter()"
              (ngModelChange)="searchFilter.set($event)"
              class="search-input"
            />
          </div>
        </div>

        <div class="table-container">
          <table *ngIf="filteredSellerListings().length > 0; else emptyListings">
            <thead>
              <tr>
                <th>Lot ID</th>
                <th>Crop Type</th>
                <th>Stock</th>
                <th>Moisture</th>
                <th>Storage Location</th>
                <th>Asking Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredSellerListings()">
                <td class="font-mono text-xs">{{ item.id }}</td>
                <td class="font-medium">{{ item.cropType }}</td>
                <td>{{ item.quantityTons }} Tonnes</td>
                <td>{{ item.moisturePercent }}%</td>
                <td>{{ item.district }} ({{ item.storageType }})</td>
                <td class="font-mono font-bold">₹{{ item.pricePerTon.toLocaleString('en-IN') }}/t</td>
                <td>
                  <app-badge [showDot]="true" *ngIf="item.status !== 'reserved'">Active on Radar</app-badge>
                  <span *ngIf="item.status === 'reserved'" class="seller-reserved-badge font-outfit">
                    🔒 Reserved ({{ item.reservedBy?.buyerName || 'Industrial Buyer' }})
                  </span>
                </td>
                <td>
                  <div class="action-cell">
                    <button class="btn-ghost btn-sm" (click)="deleteListing(item.id)" title="Remove Listing">
                      <app-icon name="x" [size]="13"></app-icon>
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #emptyListings>
            <div class="empty-state">
              <app-icon name="layers" [size]="24"></app-icon>
              <div class="empty-text">
                {{ sellerListings().length === 0 ? "You haven't listed any crop residue yet. Click '+ Create Residue Listing' to broadcast your biomass across 100 km!" : "No active listings match your search filter." }}
              </div>
              <a routerLink="/new-listing" class="btn-primary btn-sm">
                <app-icon name="plus" [size]="12"></app-icon>
                <span>+ Create Residue Listing</span>
              </a>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .seller-gps-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background-color: var(--sidebar-background);
      gap: 12px;
      flex-wrap: wrap;
    }

    .gps-strip-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .live-beacon {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--primary-text);
      display: inline-block;
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.5; }
      100% { transform: scale(0.95); opacity: 1; }
    }

    .gps-tag {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: var(--primary-text);
      color: var(--card-background);
    }

    .gps-hub-name {
      font-size: 13px;
      color: var(--primary-text);
    }

    .gps-scope-badge {
      font-size: 11px;
      font-weight: 600;
      color: var(--primary-text);
      background-color: var(--badge-bg);
      border: 1px solid var(--border);
      padding: 2px 8px;
      border-radius: 4px;
    }

    .btn-radar-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background-color: var(--background);
      color: var(--primary-text);
      text-decoration: none;
      transition: background-color 0.15s;
    }

    .btn-radar-link:hover {
      background-color: var(--border);
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
      flex-wrap: wrap;
    }

    .dashboard-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin: 0;
    }

    .dashboard-subtitle {
      font-size: 13px;
      color: var(--secondary-text);
      margin-top: 4px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      border: 1px solid var(--border);
      background-color: var(--background);
      color: var(--primary-text);
      text-decoration: none;
      transition: background-color 0.15s;
    }

    .btn-secondary:hover {
      background-color: var(--sidebar-background);
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

    .badge-nearby {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      background-color: var(--primary-text);
      color: var(--card-background);
    }

    .badge-incoming {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      background-color: var(--badge-bg);
      border: 1px solid var(--border);
      color: var(--primary-text);
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

    .buyers-proximity-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 14px;
    }

    .buyer-proximity-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      background-color: var(--card-background);
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .buyer-proximity-card:hover {
      border-color: var(--primary-text);
      box-shadow: 0 4px 14px rgba(0,0,0,0.04);
    }

    .card-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .plant-name-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .factory-icon {
      font-size: 14px;
    }

    .plant-name {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary-text);
    }

    .distance-badge {
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 4px;
      background-color: var(--badge-bg);
      border: 1px solid var(--border);
      color: var(--primary-text);
      white-space: nowrap;
    }

    .card-title {
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
    }

    .card-location {
      font-size: 11px;
    }

    .specs-pill-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .spec-pill {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      color: var(--primary-text);
    }

    .quota-progress-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 4px;
    }

    .quota-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--secondary-text);
    }

    .progress-track {
      height: 6px;
      background-color: var(--border);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background-color: var(--primary-text);
      border-radius: 3px;
    }

    .card-action-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
    }

    .flex-1 {
      flex: 1;
    }

    .buyer-cell, .dist-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .buyer-name {
      font-size: 13px;
    }

    .dist-pill {
      font-size: 11px;
      display: inline-block;
      width: fit-content;
      padding: 1px 6px;
      border-radius: 4px;
      background-color: var(--badge-bg);
      border: 1px solid var(--border);
    }

    .search-input {
      padding: 6px 10px;
      font-size: 13px;
      width: 220px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background-color: var(--background);
      color: var(--primary-text);
      outline: none;
    }

    .seller-reserved-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(217, 119, 6, 0.15);
      border: 1px solid rgba(217, 119, 6, 0.4);
      color: #D97706;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .action-cell {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .font-mono { font-family: monospace; }
    .font-medium { font-weight: 500; }
    .font-bold { font-weight: 700; }
    .text-xs { font-size: 11px; }
    .text-secondary { color: var(--secondary-text); }
    .text-primary { color: var(--primary-text); }

    .empty-state {
      padding: 36px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      color: var(--secondary-text);
    }

    .empty-text {
      font-size: 13px;
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

    @media (max-width: 960px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
      .buyers-proximity-grid {
        grid-template-columns: 1fr;
      }
      .dashboard-header {
        flex-direction: column;
        align-items: stretch;
      }
      .section-header {
        flex-direction: column;
        align-items: stretch;
      }
      .search-input {
        width: 100%;
      }
    }
  `]
})
export class SellerDashboardComponent implements OnInit {
  marketplaceService = inject(MarketplaceService);
  negotiationService = inject(NegotiationService);
  orderService = inject(OrderService);
  authService = inject(AuthService);

  searchFilter = signal<string>('');
  buyerScopeFilter = signal<'all' | 'nearby'>('all');

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

  // Real User Scoping: Show ONLY listings owned by the logged-in seller!
  sellerListings = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    const userPhone = this.normalizePhone(user.phone);

    return this.marketplaceService.listings().filter(item => {
      if (userPhone && item.ownerPhone && this.normalizePhone(item.ownerPhone) === userPhone) return true;
      if (userPhone && item.farmerPhone && this.normalizePhone(item.farmerPhone) === userPhone) return true;
      if (user.id && item.ownerId && item.ownerId === user.id) return true;
      return false;
    });
  });

  filteredSellerListings = computed(() => {
    const term = this.searchFilter().toLowerCase().trim();
    if (!term) return this.sellerListings();
    return this.sellerListings().filter(item =>
      item.cropType.toLowerCase().includes(term) ||
      item.id.toLowerCase().includes(term) ||
      item.district.toLowerCase().includes(term)
    );
  });

  // All Industrial Buyers nationwide
  allBuyers = computed(() => {
    return [...this.marketplaceService.bulkRequirements()]
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  });

  // Nearby Industrial Buyers within 100 km of Seller's Active Hub
  nearbyBuyers = computed(() => {
    return this.marketplaceService.bulkRequirements()
      .filter(b => (b.distanceKm ?? 999) <= 100)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  });

  displayedBuyers = computed(() => {
    if (this.buyerScopeFilter() === 'nearby') {
      return this.nearbyBuyers();
    }
    return this.allBuyers();
  });

  totalBuyerDemandTonnes = computed(() => {
    return this.displayedBuyers().reduce((acc, curr) => acc + curr.requiredTons, 0);
  });

  totalAvailableTonnes = computed(() =>
    this.sellerListings().reduce((acc, curr) => acc + curr.quantityTons, 0)
  );

  // Inquiries scoped to this seller's listings
  sellerThreads = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    const myListingsIds = new Set(this.sellerListings().map(l => l.id));

    return this.negotiationService.threads().filter(t => myListingsIds.has(t.listingId));
  });

  pendingOffersCount = computed(() =>
    this.sellerThreads().filter(t => t.status === 'active').length
  );

  completedOrdersCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    const userPhone = this.normalizePhone(user.phone);
    const myListingsIds = new Set(this.sellerListings().map(l => l.id));

    return this.orderService.orders().filter(o =>
      (o.listingId && myListingsIds.has(o.listingId)) ||
      (userPhone && o.sellerPhone && this.normalizePhone(o.sellerPhone) === userPhone)
    ).length;
  });

  deleteListing(id: string): void {
    this.marketplaceService.deleteListing(id);
  }
}
