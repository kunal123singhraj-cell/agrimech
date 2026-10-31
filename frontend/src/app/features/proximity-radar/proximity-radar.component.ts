import { Component, inject, signal, computed, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MarketplaceService } from '../../core/services/marketplace.service';
import { NegotiationService } from '../../core/services/negotiation.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Listing, BulkRequirement } from '../../core/models/marketplace.model';

declare var L: any;

export type UnifiedRadarItem =
  | { kind: 'seller'; data: Listing; distanceKm: number }
  | { kind: 'buyer'; data: BulkRequirement; distanceKm: number };

@Component({
  selector: 'app-proximity-radar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="radar-page">
      <!-- Top Live GPS Status Banner -->
      <div class="live-gps-strip">
        <div class="gps-strip-left">
          <span class="live-beacon"></span>
          <span class="gps-tag">SMART GEOSPATIAL RADAR</span>
          <span class="gps-hub-name">
            Center: <strong>{{ marketplaceService.currentHub().name }}</strong>
            ({{ marketplaceService.currentHub().lat.toFixed(3) }}°, {{ marketplaceService.currentHub().lng.toFixed(3) }}°)
          </span>
          <span class="gps-scope-badge">Verified GPS Coordinates</span>
        </div>
        <div class="gps-strip-right">
          <button
            type="button"
            class="btn-gps-trigger"
            (click)="openManualCoordModal()"
            title="Enter exact factory latitude and longitude"
          >
            <app-icon name="edit-2" [size]="13"></app-icon>
            <span>Manual Coordinates</span>
          </button>

          <button
            type="button"
            class="btn-gps-trigger"
            (click)="detectGPSLocation()"
            [disabled]="isDetectingGPS"
            title="Auto-detect coordinates from your phone/browser"
          >
            <app-icon name="map-pin" [size]="13"></app-icon>
            <span>{{ isDetectingGPS ? 'Scanning Satellites...' : 'Detect Exact Live GPS' }}</span>
          </button>
        </div>
      </div>

      <!-- Main Header with View Switcher & Radius Selector -->
      <div class="radar-header">
        <div>
          <h2 class="page-title">Interactive Smart Mapping & Proximity Radar</h2>
          <p class="page-subtitle">
            Visualizing verified farm-gate biomass feedstock and industrial plants within
            {{ selectedRadius() }} km of <strong>{{ marketplaceService.currentHub().shortName }}</strong>.
          </p>
        </div>

        <div class="header-actions-group">
          <!-- View Mode Toggle: Interactive Map vs Radar Sweep -->
          <div class="view-mode-toggle">
            <button
              class="view-toggle-btn"
              [class.active]="viewMode() === 'smart_map'"
              (click)="switchViewMode('smart_map')"
            >
              <span>🗺️ Interactive Smart Map</span>
            </button>
            <button
              class="view-toggle-btn"
              [class.active]="viewMode() === 'radar'"
              (click)="switchViewMode('radar')"
            >
              <span>⚡ Radar Scan</span>
            </button>
          </div>

          <!-- Radius Selector -->
          <div class="radius-selector-pill-group">
            <span class="radius-lbl">Radius:</span>
            <button
              class="radius-pill"
              [class.active]="selectedRadius() === 25"
              (click)="setRadius(25)"
            >
              25 km
            </button>
            <button
              class="radius-pill"
              [class.active]="selectedRadius() === 50"
              (click)="setRadius(50)"
            >
              50 km
            </button>
            <button
              class="radius-pill"
              [class.active]="selectedRadius() === 100"
              (click)="setRadius(100)"
            >
              100 km
            </button>
            <button
              class="radius-pill"
              [class.active]="selectedRadius() === 250"
              (click)="setRadius(250)"
            >
              250 km
            </button>
          </div>
        </div>
      </div>

      <!-- Controls Filter Bar -->
      <div class="radar-controls-bar">
        <div class="search-input-box">
          <app-icon name="search" [size]="14"></app-icon>
          <input
            type="text"
            placeholder="Search crop, farmer, city, or factory coordinates..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
          />
        </div>

        <div class="crop-filter-box">
          <select [(ngModel)]="selectedCropFilter" (change)="onFilterChange()">
            <option value="all">All Biomass Feeds</option>
            <option value="paddy">Paddy Straw (Basmati / Non-Basmati)</option>
            <option value="wheat">Wheat Stubble</option>
            <option value="mustard">Mustard Husk / Briquettes</option>
            <option value="sugarcane">Sugarcane Bagasse & Pellets</option>
            <option value="ragi">Ragi Straw (MR-1)</option>
            <option value="mulberry">Mulberry Dried Stems</option>
            <option value="coconut">Coconut Shell & Coir</option>
            <option value="maize">Maize Stover</option>
          </select>
        </div>

        <div class="hub-control-group">
          <span class="hub-label">Center Hub:</span>
          <select
            [ngModel]="marketplaceService.currentHub().id"
            (ngModelChange)="onHubChange($event)"
            class="hub-select"
          >
            <option *ngFor="let hub of marketplaceService.standardHubs" [value]="hub.id">
              📍 {{ hub.name }}
            </option>
            <option *ngIf="marketplaceService.currentHub().id === 'custom_gps'" value="custom_gps">
              📍 {{ marketplaceService.currentHub().name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Selected Route Telemetry Banner (When a supplier is selected) -->
      <div *ngIf="selectedSupplier()" class="route-telemetry-banner">
        <div class="telemetry-left">
          <span class="telemetry-badge">🚚 ROUTE OPTIMIZATION & TRANSIT TELEMETRY</span>
          <div class="telemetry-title">
            <strong>{{ selectedSupplier()?.farmerName }} ({{ selectedSupplier()?.district }})</strong>
            &rarr;
            <strong>{{ marketplaceService.currentHub().shortName }} Plant Gate</strong>
          </div>
        </div>
        <div class="telemetry-stats">
          <div class="stat-pill">
            <span class="stat-lbl">Haul Distance:</span>
            <span class="stat-val font-bold text-amber">{{ selectedSupplier()?.distanceKm }} km</span>
          </div>
          <div class="stat-pill">
            <span class="stat-lbl">Estimated Transit Time:</span>
            <span class="stat-val font-bold text-blue">{{ calculateTransitTime(selectedSupplier()!.distanceKm) }}</span>
          </div>
          <div class="stat-pill">
            <span class="stat-lbl">Est. Landed Cost:</span>
            <span class="stat-val font-bold text-green">₹{{ calculateLandedRate(selectedSupplier()!) }}/Tonne</span>
          </div>
          <button class="btn-direct-negotiate" (click)="openNegotiation(selectedSupplier()!)">
            <span>Negotiate Direct</span>
            <app-icon name="arrow-right" [size]="12"></app-icon>
          </button>
        </div>
      </div>

      <!-- 2-Column Layout: Left Map/Radar, Right Directory -->
      <div class="radar-layout">
        <!-- Left: Interactive Smart Map OR SVG Radar Canvas -->
        <div class="map-container">
          <!-- Interactive Leaflet Smart Map View -->
          <div
            id="interactive-smart-map"
            class="smart-map-div"
            [class.hidden]="viewMode() !== 'smart_map'"
          ></div>

          <!-- Radar Sweep View (SVG) -->
          <div *ngIf="viewMode() === 'radar'" class="map-canvas-wrapper">
            <svg class="radar-svg" viewBox="0 0 500 500">
              <defs>
                <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke="var(--border)" stroke-width="0.5" />
                </pattern>
              </defs>
              <rect width="500" height="500" fill="url(#grid)" />

              <!-- Crosshairs -->
              <line x1="250" y1="15" x2="250" y2="485" stroke="var(--border)" stroke-width="1" />
              <line x1="15" y1="250" x2="485" y2="250" stroke="var(--border)" stroke-width="1" />

              <!-- Outer Perimeter Ring -->
              <circle cx="250" cy="250" r="215" fill="none" stroke="var(--primary-text)" stroke-width="1.5" />
              <text x="255" y="45" class="ring-label">{{ selectedRadius() }} km Perimeter</text>

              <!-- Center Hub Beacon with Radar Pulse -->
              <circle cx="250" cy="250" r="18" fill="none" stroke="var(--primary-text)" stroke-width="0.5" class="radar-pulse-ring" />
              <circle cx="250" cy="250" r="8" fill="var(--primary-text)" />
              <circle cx="250" cy="250" r="14" fill="none" stroke="var(--primary-text)" stroke-width="1.2" />
              <text x="250" y="278" text-anchor="middle" class="hub-map-label">{{ marketplaceService.currentHub().shortName }}</text>

              <!-- Markers for Biomass Sellers -->
              <g *ngFor="let item of radarSuppliers()" class="supplier-marker" (click)="selectSupplier(item)">
                <circle
                  [attr.cx]="getMarkerCoords(item.id, item.distanceKm).x"
                  [attr.cy]="getMarkerCoords(item.id, item.distanceKm).y"
                  r="7"
                  fill="#10B981"
                />
                <circle
                  [attr.cx]="getMarkerCoords(item.id, item.distanceKm).x"
                  [attr.cy]="getMarkerCoords(item.id, item.distanceKm).y"
                  r="13"
                  fill="none"
                  stroke="#10B981"
                  stroke-width="1"
                  opacity="0.6"
                />
              </g>
            </svg>
          </div>
        </div>

        <!-- Right: Supplier Directory & Details Card -->
        <div class="sidebar-panel">
          <!-- Active Mode Selector -->
          <div class="mode-tabs">
            <button
              class="mode-tab-btn"
              [class.active]="activeTab() === 'all'"
              (click)="activeTab.set('all')"
            >
              All Biomass Feedstock ({{ radarSuppliers().length }})
            </button>
            <button
              class="mode-tab-btn"
              [class.active]="activeTab() === 'suppliers'"
              (click)="activeTab.set('suppliers')"
            >
              Verified Farmers ({{ radarSuppliers().length }})
            </button>
          </div>

          <!-- Total Available Biomass Counter -->
          <div class="panel-header-summary">
            <div class="summary-metric">
              <span class="metric-num text-green">{{ totalSellerTonnes() }}</span>
              <span class="metric-title">Tonnes Farm-Gate Biomass</span>
            </div>
            <div class="metric-divider"></div>
            <div class="summary-metric">
              <span class="metric-num text-amber">{{ radarSuppliers().length }}</span>
              <span class="metric-title">Verified Lots</span>
            </div>
          </div>

          <!-- Compact Supplier Rows List -->
          <div class="compact-rows-container">
            <div
              *ngFor="let item of radarSuppliers()"
              class="compact-supplier-row"
              [class.active-row]="selectedSupplier()?.id === item.id"
              (click)="selectSupplier(item)"
            >
              <div class="row-left">
                <div class="row-primary">
                  <span class="entity-type-badge badge-seller">🌾 FARMER</span>
                  <span class="row-crop">{{ item.cropType }}</span>
                  <span class="row-dist">{{ item.distanceKm }} km away</span>
                </div>
                <div class="row-secondary">
                  <span class="row-farmer">{{ item.farmerName }} &bull; {{ item.district }}</span>
                  <span *ngIf="item.aqiScore" class="aqi-badge">AQI: {{ item.aqiScore }}/100</span>
                </div>
              </div>

              <div class="row-right">
                <span class="row-tonnes">{{ item.quantityTons }} T</span>
                <span class="row-price">₹{{ item.pricePerTon }}/T</span>
              </div>
            </div>

            <div *ngIf="radarSuppliers().length === 0" class="empty-state">
              <p>No verified biomass lots within {{ selectedRadius() }} km. Expand radius to 100 km or 250 km.</p>
            </div>
          </div>

          <!-- Selected Supplier Detailed Inspection Card -->
          <div *ngIf="selectedSupplier()" class="selected-details-card">
            <div class="details-header">
              <div>
                <span class="details-type-tag">🌾 VERIFIED FARM-GATE STOCK</span>
                <h4 class="details-name">{{ selectedSupplier()?.cropType }}</h4>
                <div class="details-farmer">{{ selectedSupplier()?.farmerName }} &bull; 📞 {{ selectedSupplier()?.farmerPhone }}</div>
              </div>
              <div class="details-tonnage-box">
                <span class="details-tonnes">{{ selectedSupplier()?.quantityTons }} Tonnes</span>
                <span class="details-rate">₹{{ selectedSupplier()?.pricePerTon }}/Tonne</span>
              </div>
            </div>

            <div class="details-specs">
              <div class="spec-row">
                <span>Location:</span>
                <strong>{{ selectedSupplier()?.district }}, {{ selectedSupplier()?.region }}</strong>
              </div>
              <div class="spec-row">
                <span>Moisture Certified:</span>
                <strong>{{ selectedSupplier()?.moisturePercent }}% (Grade: {{ selectedSupplier()?.qualityGrade }})</strong>
              </div>
              <div class="spec-row">
                <span>Baling Form:</span>
                <strong>{{ selectedSupplier()?.balingType }}</strong>
              </div>
              <div class="spec-row">
                <span>AQI Rating:</span>
                <strong class="text-green">{{ selectedSupplier()?.aqiScore || 85 }}/100 ({{ selectedSupplier()?.aqiGrade || 'Boiler Grade A' }})</strong>
              </div>
            </div>

            <div class="details-actions">
              <button class="btn-negotiate" (click)="openNegotiation(selectedSupplier()!)">
                <app-icon name="message" [size]="14"></app-icon>
                <span>Start Multilingual Negotiation</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL: MANUAL COORDINATES ENTRY -->
      <div *ngIf="isManualCoordModalOpen" class="modal-backdrop" (click)="isManualCoordModalOpen = false">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Enter Manual Factory / Hub Coordinates</h3>
            <button class="btn-close" (click)="isManualCoordModalOpen = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-info">
              Enter the exact latitude and longitude of your industrial plant, boiler shed, or farm aggregation center.
            </p>
            <div class="form-group">
              <label>Location / Facility Name *</label>
              <input type="text" [(ngModel)]="manualCoordForm.name" placeholder="e.g. Reliance Bio-Energy Boiler Gate" class="form-input" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Latitude (°N) *</label>
                <input type="number" [(ngModel)]="manualCoordForm.lat" step="0.0001" placeholder="12.9716" class="form-input" />
              </div>
              <div class="form-group">
                <label>Longitude (°E) *</label>
                <input type="number" [(ngModel)]="manualCoordForm.lng" step="0.0001" placeholder="77.5946" class="form-input" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="isManualCoordModalOpen = false">Cancel</button>
            <button class="btn-primary" (click)="applyManualCoordinates()">Lock Coordinates</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .radar-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .live-gps-strip {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .gps-strip-left {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      flex-wrap: wrap;
    }

    .live-beacon {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
    }

    .gps-tag {
      font-size: 11px;
      font-weight: 800;
      color: #047857;
      letter-spacing: 0.05em;
    }

    .gps-scope-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
    }

    .gps-strip-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-gps-trigger {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--primary-text);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .radar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .header-actions-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .view-mode-toggle {
      display: flex;
      background: var(--sidebar-background);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 2px;
    }

    .view-toggle-btn {
      padding: 6px 12px;
      border-radius: 6px;
      border: none;
      background: transparent;
      font-size: 12px;
      font-weight: 700;
      color: var(--secondary-text);
      cursor: pointer;
      transition: all 120ms ease;
    }

    .view-toggle-btn.active {
      background: var(--card-bg, #ffffff);
      color: var(--primary-text);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    .radius-selector-pill-group {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
    }

    .radius-lbl {
      color: var(--secondary-text);
      font-weight: 600;
      margin-right: 4px;
    }

    .radius-pill {
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--secondary-text);
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }

    .radius-pill.active {
      background: #10B981;
      color: #ffffff;
      border-color: #10B981;
    }

    .radar-controls-bar {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-input-box {
      flex: 1;
      min-width: 240px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-input-box app-icon {
      position: absolute;
      left: 10px;
      color: var(--secondary-text);
    }

    .search-input-box input {
      width: 100%;
      padding: 8px 12px 8px 32px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--card-bg, #ffffff);
      color: var(--primary-text);
      font-size: 13px;
    }

    .crop-filter-box select, .hub-control-group select {
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--card-bg, #ffffff);
      color: var(--primary-text);
      font-size: 13px;
    }

    .route-telemetry-banner {
      background: linear-gradient(135deg, rgba(217, 119, 6, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
      border: 1px solid #10B981;
      border-radius: 10px;
      padding: 12px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .telemetry-badge {
      font-size: 10px;
      font-weight: 800;
      color: #047857;
      letter-spacing: 0.05em;
    }

    .telemetry-title {
      font-size: 13px;
      margin-top: 2px;
    }

    .telemetry-stats {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .stat-pill {
      font-size: 12px;
    }

    .stat-lbl {
      color: var(--secondary-text);
      margin-right: 4px;
    }

    .btn-direct-negotiate {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      background: #10B981;
      color: #ffffff;
      border: none;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    /* 2-Column Layout */
    .radar-layout {
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: 16px;
    }

    .map-container {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border);
      border-radius: 12px;
      height: 540px;
      overflow: hidden;
      position: relative;
    }

    .smart-map-div {
      width: 100%;
      height: 100%;
      z-index: 10;
    }

    .smart-map-div.hidden {
      display: none;
    }

    .map-canvas-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--card-bg, #ffffff);
    }

    .radar-svg {
      width: 100%;
      height: 100%;
      max-width: 500px;
      max-height: 500px;
    }

    .supplier-marker {
      cursor: pointer;
    }

    .sidebar-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .mode-tabs {
      display: flex;
      border-bottom: 1px solid var(--border);
      gap: 4px;
    }

    .mode-tab-btn {
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 700;
      border: none;
      background: transparent;
      color: var(--secondary-text);
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }

    .mode-tab-btn.active {
      color: #10B981;
      border-bottom-color: #10B981;
    }

    .panel-header-summary {
      display: flex;
      justify-content: space-around;
      align-items: center;
      background: var(--sidebar-background);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
    }

    .summary-metric {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .metric-num {
      font-size: 18px;
      font-weight: 800;
      font-family: ui-monospace, monospace;
    }

    .metric-title {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .metric-divider {
      width: 1px;
      height: 18px;
      background: var(--border);
    }

    .compact-rows-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 280px;
      overflow-y: auto;
    }

    .compact-supplier-row {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: all 120ms ease;
    }

    .compact-supplier-row:hover, .compact-supplier-row.active-row {
      border-color: #10B981;
      background: rgba(16, 185, 129, 0.04);
    }

    .row-left {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .row-primary {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .entity-type-badge {
      font-size: 9px;
      font-weight: 800;
      padding: 2px 5px;
      border-radius: 3px;
      background: rgba(16, 185, 129, 0.15);
      color: #047857;
    }

    .row-crop {
      font-size: 13px;
      font-weight: 700;
    }

    .row-dist {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .row-secondary {
      font-size: 11px;
      color: var(--secondary-text);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .aqi-badge {
      font-size: 10px;
      font-weight: 700;
      color: #047857;
      background: rgba(16, 185, 129, 0.12);
      padding: 1px 6px;
      border-radius: 4px;
    }

    .row-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .row-tonnes {
      font-size: 13px;
      font-weight: 800;
      color: var(--primary-text);
    }

    .row-price {
      font-size: 11px;
      font-weight: 700;
      color: #D97706;
    }

    .selected-details-card {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    }

    .details-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .details-type-tag {
      font-size: 10px;
      font-weight: 800;
      color: #047857;
      letter-spacing: 0.05em;
    }

    .details-name {
      font-size: 16px;
      font-weight: 800;
      margin: 2px 0;
    }

    .details-farmer {
      font-size: 12px;
      color: var(--secondary-text);
    }

    .details-tonnage-box {
      text-align: right;
    }

    .details-tonnes {
      font-size: 16px;
      font-weight: 800;
      display: block;
    }

    .details-rate {
      font-size: 12px;
      font-weight: 700;
      color: #D97706;
    }

    .details-specs {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
      background: var(--sidebar-background);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
    }

    .spec-row {
      display: flex;
      justify-content: space-between;
    }

    .btn-negotiate {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      border-radius: 8px;
      border: none;
      background: #10B981;
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-dialog {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border);
      border-radius: 16px;
      width: 100%;
      max-width: 480px;
      overflow: hidden;
    }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      font-size: 15px;
      font-weight: 800;
      margin: 0;
    }

    .btn-close {
      background: transparent;
      border: none;
      font-size: 16px;
      cursor: pointer;
    }

    .modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .modal-footer {
      padding: 14px 20px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: var(--sidebar-background);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 12px;
      font-weight: 700;
      color: var(--secondary-text);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .form-input {
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--card-bg, #ffffff);
      color: var(--primary-text);
      font-size: 13px;
    }

    @media (max-width: 960px) {
      .radar-layout {
        grid-template-columns: 1fr;
      }
      .map-container {
        height: 400px;
      }
    }
  `]
})
export class ProximityRadarComponent implements OnInit, AfterViewInit, OnDestroy {
  public marketplaceService = inject(MarketplaceService);
  private negotiationService = inject(NegotiationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  viewMode = signal<'smart_map' | 'radar'>('smart_map');
  selectedRadius = signal<number>(100);
  activeTab = signal<'all' | 'suppliers'>('all');

  searchQuery = '';
  selectedCropFilter = 'all';

  selectedSupplier = signal<Listing | undefined>(undefined);
  isDetectingGPS = false;
  isManualCoordModalOpen = false;

  manualCoordForm = {
    name: 'Industrial Processing Plant',
    lat: 12.839,
    lng: 77.677
  };

  private leafletMap: any = null;
  private markersLayer: any = null;
  private routeLine: any = null;

  ngOnInit(): void {
    this.marketplaceService.fetchBackendListings();
    this.marketplaceService.fetchBackendPools();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initLeafletMap();
    }, 250);
  }

  ngOnDestroy(): void {
    if (this.leafletMap) {
      try {
        this.leafletMap.remove();
      } catch {}
    }
  }

  switchViewMode(mode: 'smart_map' | 'radar'): void {
    this.viewMode.set(mode);
    if (mode === 'smart_map') {
      setTimeout(() => {
        this.initLeafletMap();
      }, 100);
    }
  }

  private initLeafletMap(): void {
    if (typeof window === 'undefined' || typeof L === 'undefined') return;

    const container = document.getElementById('interactive-smart-map');
    if (!container) return;

    const hub = this.marketplaceService.currentHub();

    if (!this.leafletMap) {
      this.leafletMap = L.map('interactive-smart-map').setView([hub.lat, hub.lng], 9);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.leafletMap);

      this.markersLayer = L.layerGroup().addTo(this.leafletMap);
    } else {
      this.leafletMap.setView([hub.lat, hub.lng], 9);
    }

    this.renderMapMarkers();
  }

  private renderMapMarkers(): void {
    if (!this.leafletMap || !this.markersLayer || typeof L === 'undefined') return;

    this.markersLayer.clearLayers();
    if (this.routeLine) {
      this.leafletMap.removeLayer(this.routeLine);
      this.routeLine = null;
    }

    const hub = this.marketplaceService.currentHub();

    // 1. Plot Center Hub / Plant Gate Marker
    const hubIcon = L.divIcon({
      className: 'hub-leaflet-marker',
      html: `<div style="background:#163320;color:#FAF8F2;border:2px solid #D97706;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 12px rgba(217,119,6,0.6);">📍</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    L.marker([hub.lat, hub.lng], { icon: hubIcon })
      .bindPopup(`<strong>${hub.name}</strong><br>Center Plant Hub (${hub.lat.toFixed(3)}°, ${hub.lng.toFixed(3)}°)`)
      .addTo(this.markersLayer);

    // 2. Draw Radius Circle
    L.circle([hub.lat, hub.lng], {
      radius: this.selectedRadius() * 1000,
      color: '#10B981',
      fillColor: '#10B981',
      fillOpacity: 0.05,
      weight: 1.5,
      dashArray: '4, 4'
    }).addTo(this.markersLayer);

    // 3. Plot Real Supplier Lots
    const suppliers = this.radarSuppliers();
    suppliers.forEach(item => {
      const lat = item.lat || 12.650;
      const lng = item.lng || 77.450;

      const supplierIcon = L.divIcon({
        className: 'supplier-leaflet-marker',
        html: `<div style="background:#10B981;color:#ffffff;border:2px solid #ffffff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 4px 10px rgba(0,0,0,0.2);">🌾</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const popupContent = `
        <div style="font-family:'Outfit',sans-serif;font-size:12px;min-width:200px;">
          <strong style="font-size:14px;color:#163320;">${item.cropType}</strong><br>
          <span>Farmer: ${item.farmerName} (${item.district})</span><br>
          <span>Quantity: <strong>${item.quantityTons} Tonnes</strong></span><br>
          <span>Farm-Gate Rate: <strong>₹${item.pricePerTon}/Tonne</strong></span><br>
          <span>AQI Grade: <strong style="color:#059669;">${item.aqiScore || 85}/100</strong></span><br>
          <span style="color:#D97706;font-weight:700;">${item.distanceKm} km from facility</span>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: supplierIcon })
        .bindPopup(popupContent)
        .addTo(this.markersLayer);

      marker.on('click', () => {
        this.selectSupplier(item);
      });
    });

    // If a supplier is currently selected, draw the route polyline
    const selected = this.selectedSupplier();
    if (selected) {
      this.drawRouteTo(selected);
    }
  }

  private drawRouteTo(item: Listing): void {
    if (!this.leafletMap || typeof L === 'undefined') return;

    if (this.routeLine) {
      this.leafletMap.removeLayer(this.routeLine);
      this.routeLine = null;
    }

    const hub = this.marketplaceService.currentHub();
    const lat = item.lat || 12.650;
    const lng = item.lng || 77.450;

    // Draw route polyline from supplier farm gate to industrial intake hub
    this.routeLine = L.polyline([
      [lat, lng],
      [hub.lat, hub.lng]
    ], {
      color: '#D97706',
      weight: 3.5,
      opacity: 0.85,
      dashArray: '6, 6'
    }).addTo(this.leafletMap);

    this.leafletMap.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
  }

  radarSuppliers = computed(() => {
    const radius = this.selectedRadius();
    const query = this.searchQuery.toLowerCase().trim();
    const crop = this.selectedCropFilter;

    return this.marketplaceService.listings().filter(item => {
      if (item.distanceKm > radius) return false;
      if (crop !== 'all' && item.cropKey !== crop) return false;
      if (query) {
        const matchesName = item.cropType.toLowerCase().includes(query);
        const matchesFarmer = item.farmerName.toLowerCase().includes(query);
        const matchesDistrict = item.district.toLowerCase().includes(query);
        if (!matchesName && !matchesFarmer && !matchesDistrict) return false;
      }
      return true;
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  });

  totalSellerTonnes = computed(() => {
    return this.radarSuppliers().reduce((sum, item) => sum + item.quantityTons, 0);
  });

  setRadius(r: number): void {
    this.selectedRadius.set(r);
    this.renderMapMarkers();
  }

  onSearchChange(): void {
    this.renderMapMarkers();
  }

  onFilterChange(): void {
    this.renderMapMarkers();
  }

  onHubChange(hubId: string): void {
    this.marketplaceService.setHub(hubId);
    this.selectedSupplier.set(undefined);
    setTimeout(() => {
      const hub = this.marketplaceService.currentHub();
      if (this.leafletMap) {
        this.leafletMap.setView([hub.lat, hub.lng], 9);
      }
      this.renderMapMarkers();
    }, 100);
  }

  selectSupplier(item: Listing): void {
    this.selectedSupplier.set(item);
    this.drawRouteTo(item);
  }

  calculateTransitTime(distanceKm: number): string {
    const totalMinutes = Math.round((distanceKm / 42) * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins} mins`;
    return `${hrs}h ${mins}m`;
  }

  calculateLandedRate(item: Listing): number {
    const freightPerTon = Math.round((item.distanceKm * 4.2) + 250);
    return item.pricePerTon + freightPerTon;
  }

  detectGPSLocation(): void {
    this.isDetectingGPS = true;
    this.marketplaceService.detectLiveLocation()
      .then(() => {
        this.isDetectingGPS = false;
        this.selectedSupplier.set(undefined);
        setTimeout(() => {
          this.initLeafletMap();
        }, 100);
      })
      .catch(err => {
        this.isDetectingGPS = false;
        alert(err.message || 'Unable to retrieve device GPS. Please grant browser location access.');
      });
  }

  openManualCoordModal(): void {
    const hub = this.marketplaceService.currentHub();
    this.manualCoordForm.name = hub.name;
    this.manualCoordForm.lat = hub.lat;
    this.manualCoordForm.lng = hub.lng;
    this.isManualCoordModalOpen = true;
  }

  applyManualCoordinates(): void {
    this.marketplaceService.setCustomLocation(
      Number(this.manualCoordForm.lat),
      Number(this.manualCoordForm.lng),
      this.manualCoordForm.name || 'Custom Industrial Hub'
    );
    this.isManualCoordModalOpen = false;
    setTimeout(() => {
      this.initLeafletMap();
    }, 100);
  }

  openNegotiation(item: Listing): void {
    this.negotiationService.startNegotiationWithListing(
      item,
      this.authService.currentUser()?.name || 'Buyer Procurement'
    );
    this.router.navigate(['/negotiations']);
  }

  getMarkerCoords(id: string, distanceKm: number): { x: number; y: number } {
    const scale = 2.05;
    const distancePx = Math.min(215, distanceKm * scale);
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const angleRad = (hash % 360) * (Math.PI / 180);
    const x = Math.round(250 + distancePx * Math.cos(angleRad));
    const y = Math.round(250 + distancePx * Math.sin(angleRad));
    return { x, y };
  }
}
