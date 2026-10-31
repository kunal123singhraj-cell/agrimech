import { 
  Component, 
  inject, 
  OnInit, 
  AfterViewInit, 
  OnDestroy, 
  signal, 
  computed, 
  ElementRef, 
  ViewChild 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SatelliteIntelligenceService } from '../../core/services/satellite-intelligence.service';
import { MarketplaceService } from '../../core/services/marketplace.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { 
  SatelliteRegion, 
  AvailabilityLevel, 
  CropParameterConfig 
} from '../../core/models/marketplace.model';

declare var L: any;

@Component({
  selector: 'app-satellite-intelligence',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './satellite-intelligence.component.html',
  styleUrls: ['./satellite-intelligence.component.css']
})
export class SatelliteIntelligenceComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly Math = Math;

  satelliteService = inject(SatelliteIntelligenceService);
  marketplaceService = inject(MarketplaceService);
  private authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild('mapContainer') mapContainerRef?: ElementRef;

  private map: any = null;
  private markersLayer: any = null;
  private hubMarker: any = null;
  private streetTileLayer: any = null;
  private satelliteTileLayer: any = null;

  activeMapTileMode = signal<'satellite' | 'street'>('satellite');
  isSensitivityModalOpen = signal<boolean>(false);
  activeTab = signal<'map_and_cards' | 'methodology' | 'sensitivity'>('map_and_cards');

  // Custom Sensitivity calculation model
  customCalc = {
    areaHa: 1000,
    cropKey: 'paddy',
    customYield: 4.2,
    customRpr: 1.30,
    customCaf: 0.65
  };

  customResult = signal<any>(null);

  ngOnInit(): void {
    this.recalculateCustomSensitivity();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initLeafletMap();
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Initializes the Leaflet map with satellite imagery and colored regional markers
   */
  private initLeafletMap(): void {
    if (typeof L === 'undefined') {
      console.warn('[SatelliteIntelligence] Leaflet is not loaded in window.');
      return;
    }

    const mapEl = document.getElementById('satellite-leaflet-map');
    if (!mapEl) return;

    if (this.map) {
      this.map.remove();
    }

    const hub = this.marketplaceService.currentHub();
    this.map = L.map('satellite-leaflet-map', {
      center: [hub.lat, hub.lng],
      zoom: 8,
      zoomControl: true
    });

    // High-resolution Esri World Imagery (Satellite Layer)
    this.satelliteTileLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 18
      }
    );

    // Standard OpenStreetMap (Street / Topo Layer)
    this.streetTileLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }
    );

    if (this.activeMapTileMode() === 'satellite') {
      this.satelliteTileLayer.addTo(this.map);
    } else {
      this.streetTileLayer.addTo(this.map);
    }

    this.markersLayer = L.layerGroup().addTo(this.map);

    this.renderHubMarker();
    this.renderRegionMarkers();
  }

  setMapTileMode(mode: 'satellite' | 'street'): void {
    this.activeMapTileMode.set(mode);
    if (!this.map) return;

    if (mode === 'satellite') {
      if (this.map.hasLayer(this.streetTileLayer)) this.map.removeLayer(this.streetTileLayer);
      this.satelliteTileLayer.addTo(this.map);
    } else {
      if (this.map.hasLayer(this.satelliteTileLayer)) this.map.removeLayer(this.satelliteTileLayer);
      this.streetTileLayer.addTo(this.map);
    }
  }

  /**
   * Centers the map on the buyer's active industrial hub
   */
  renderHubMarker(): void {
    if (!this.map) return;
    const hub = this.marketplaceService.currentHub();

    if (this.hubMarker) {
      this.hubMarker.remove();
    }

    const hubIcon = L.divIcon({
      className: 'custom-hub-map-pin',
      html: `
        <div class="hub-radar-beacon">
          <div class="hub-pin-inner">🏭</div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    this.hubMarker = L.marker([hub.lat, hub.lng], { icon: hubIcon })
      .addTo(this.map)
      .bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
          <strong style="color: #166534; font-size: 14px;">🏭 Industrial Plant Gate Hub</strong><br/>
          <strong>${hub.name}</strong><br/>
          <span style="color: #64748b; font-size: 11px;">${hub.lat.toFixed(4)}°, ${hub.lng.toFixed(4)}° &bull; Reference Datum</span>
        </div>
      `);
  }

  /**
   * Plots colored circle markers representing agricultural supply areas:
   * - Green: High predicted residue availability (>= 1,200 t)
   * - Yellow: Medium predicted residue availability (400 - 1,199 t)
   * - Red: Low predicted residue availability (100 - 399 t)
   * - Grey: Insufficient data (< 100 t / cloud cover)
   */
  renderRegionMarkers(): void {
    if (!this.map || !this.markersLayer) return;
    this.markersLayer.clearLayers();

    const regions = this.satelliteService.filteredRegions();
    if (regions.length === 0) return;

    const latLngs: any[] = [];

    regions.forEach(region => {
      latLngs.push([region.lat, region.lng]);

      const colors = this.getMarkerColor(region.availabilityLevel);
      const radiusSize = region.availabilityLevel === 'high' ? 14 : region.availabilityLevel === 'medium' ? 11 : 9;

      const marker = L.circleMarker([region.lat, region.lng], {
        radius: radiusSize,
        fillColor: colors.fill,
        color: colors.stroke,
        weight: 2.5,
        opacity: 0.95,
        fillOpacity: 0.8
      });

      const popupContent = `
        <div class="satellite-map-popup" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12.5px; min-width: 210px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            <span style="font-weight: 700; color: #0f172a; font-size: 13.5px;">${region.villageName}</span>
            <span style="background: ${colors.bg}; color: ${colors.fill}; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
              ${region.availabilityLevel}
            </span>
          </div>
          <div style="margin-bottom: 4px; color: #475569;">
            🌾 <strong>${region.cropName}</strong>
          </div>
          <div style="margin-bottom: 4px; color: #0f172a; font-size: 13px;">
            📊 Estimated Residue: <strong style="color: #166534;">${region.estimatedResidueTonnes.toLocaleString('en-IN')} Tonnes</strong>
          </div>
          <div style="margin-bottom: 4px; color: #64748b; font-size: 11.5px;">
            📍 ${region.talukTehsil}, ${region.district} (${region.state})
          </div>
          <div style="margin-bottom: 6px; color: #64748b; font-size: 11px;">
            🛰️ Pass: ${region.lastSatellitePassDate} &bull; Confidence: <strong>${region.predictionConfidencePercent}%</strong>
          </div>
          <div style="margin-top: 8px;">
            <button id="btn-popup-${region.id}" style="width: 100%; background: #166534; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
              Inspect Full Region Profile &rarr;
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-${region.id}`);
        if (btn) {
          btn.onclick = () => {
            this.selectRegion(region);
          };
        }
      });

      marker.on('click', () => {
        this.selectRegion(region);
      });

      this.markersLayer.addLayer(marker);
    });

    // Auto fit bounds if regions exist and map is available
    if (latLngs.length > 0) {
      try {
        const bounds = L.latLngBounds(latLngs);
        this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Returns distinct hex color codes according to prompt specification:
   * - Green: High predicted residue availability
   * - Yellow: Medium predicted residue availability
   * - Red: Low predicted residue availability
   * - Grey: Insufficient data
   */
  getMarkerColor(level: AvailabilityLevel): { fill: string; stroke: string; bg: string } {
    switch (level) {
      case 'high':
        return { fill: '#10B981', stroke: '#065F46', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'medium':
        return { fill: '#F59E0B', stroke: '#92400E', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'low':
        return { fill: '#EF4444', stroke: '#991B1B', bg: 'rgba(239, 68, 68, 0.15)' };
      case 'insufficient':
      default:
        return { fill: '#94A3B8', stroke: '#475569', bg: 'rgba(148, 163, 184, 0.2)' };
    }
  }

  selectRegion(region: SatelliteRegion): void {
    this.satelliteService.selectRegion(region);

    if (this.map && region) {
      this.map.setView([region.lat, region.lng], Math.max(this.map.getZoom(), 9), {
        animate: true
      });
    }
  }

  onFilterChange(): void {
    setTimeout(() => {
      this.renderRegionMarkers();
    }, 50);
  }

  resetAllFilters(): void {
    this.satelliteService.resetFilters();
    this.onFilterChange();
  }

  switchHub(hubId: string): void {
    this.marketplaceService.setHub(hubId);
    this.renderHubMarker();
    this.onFilterChange();
  }

  fitAllMarkers(): void {
    if (!this.map || !this.markersLayer) return;
    const regions = this.satelliteService.filteredRegions();
    if (regions.length === 0) return;

    const latLngs = regions.map(r => [r.lat, r.lng]);
    try {
      const bounds = L.latLngBounds(latLngs);
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    } catch (e) {
      // ignore
    }
  }

  centerOnHub(): void {
    this.renderHubMarker();
    if (this.map) {
      const hub = this.marketplaceService.currentHub();
      this.map.setView([hub.lat, hub.lng], 8, { animate: true });
    }
  }

  getCropParam(cropKey: string): CropParameterConfig {
    const params = this.satelliteService.cropParameters();
    return params[cropKey] || params['paddy'];
  }

  // ============================================================================
  // Deep Feature Linkages (Connecting with existing AgriMech features)
  // ============================================================================

  /**
   * Connects to existing AgriMech suppliers search, passing location & crop
   */
  findRegisteredSuppliersNearby(region: SatelliteRegion): void {
    this.router.navigate(['/suppliers'], {
      queryParams: {
        district: region.district,
        crop: region.cropKey,
        q: region.villageName,
        lat: region.lat,
        lng: region.lng
      }
    });
  }

  /**
   * Connects to Multi-Farmer Order Optimizer with prefilled crop and target tons
   */
  launchOrderOptimizer(region: SatelliteRegion): void {
    const recommendedTons = Math.min(region.estimatedResidueTonnes, 500);
    this.router.navigate(['/order-optimizer'], {
      queryParams: {
        crop: region.cropKey,
        targetTons: recommendedTons > 0 ? recommendedTons : 250,
        district: region.district
      }
    });
  }

  /**
   * Connects to Freight Calculator
   */
  openFreightCalculator(region: SatelliteRegion): void {
    this.router.navigate(['/logistics-calculator'], {
      queryParams: {
        crop: region.cropKey,
        distanceKm: region.distanceKm || 45
      }
    });
  }

  /**
   * Connects to Bulk Requirements to post a procurement quota
   */
  postBulkRequirement(region: SatelliteRegion): void {
    this.router.navigate(['/bulk-requirements'], {
      queryParams: {
        crop: region.cropKey,
        region: `${region.district}, ${region.state}`
      }
    });
  }

  /**
   * Connects to existing 100 KM Live Radar
   */
  viewOnProximityRadar(region: SatelliteRegion): void {
    this.router.navigate(['/proximity-radar'], {
      queryParams: {
        lat: region.lat,
        lng: region.lng,
        name: region.villageName
      }
    });
  }

  // ============================================================================
  // Sensitivity / Custom Calculator
  // ============================================================================

  onSensitivityCropChange(): void {
    const cfg = this.satelliteService.cropParameters()[this.customCalc.cropKey] || 
                this.satelliteService.cropParameters()['paddy'];
    this.customCalc.customYield = cfg.averageYieldPerHa;
    this.customCalc.customRpr = cfg.rpr;
    this.customCalc.customCaf = cfg.caf;
    this.recalculateCustomSensitivity();
  }

  recalculateCustomSensitivity(): void {
    const result = this.satelliteService.calculateEstimate(
      this.customCalc.areaHa,
      this.customCalc.cropKey,
      this.customCalc.customYield,
      this.customCalc.customRpr,
      this.customCalc.customCaf
    );
    this.customResult.set(result);
  }
}
