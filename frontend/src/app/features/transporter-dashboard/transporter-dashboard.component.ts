import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransportService } from '../../core/services/transport.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Vehicle, TransportBooking, TransportQuotation, VehicleType } from '../../core/models/marketplace.model';

@Component({
  selector: 'app-transporter-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="transporter-page">
      <!-- 3PL Partner Verified Status Header Strip -->
      <div class="partner-status-strip">
        <div class="status-left">
          <span class="partner-badge">
            <span class="beacon-pulse"></span>
            🚛 3PL LOGISTICS NETWORK
          </span>
          <span class="company-name">{{ authService.currentUser()?.organization || 'Verified Logistics Carrier' }}</span>
          <span class="license-tag">License: {{ authService.currentUser()?.transportLicense || 'KA-TRANS-2026-V8' }}</span>
          <span class="gst-tag">GSTIN: {{ authService.currentUser()?.gstin || '29AABCT1234Z1Z5' }}</span>
        </div>
        <div class="status-right">
          <span class="payout-term-badge">95% Guaranteed Net Payout &bull; Zero Upfront Fee</span>
          <button class="btn-refresh" (click)="loadAllData()" title="Refresh data">
            <app-icon name="rotate-cw" [size]="14"></app-icon>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div class="metrics-ribbon">
        <div class="metric-card">
          <div class="metric-lbl">Registered Fleet</div>
          <div class="metric-val">{{ transportService.vehicles().length }}</div>
          <div class="metric-sub">Commercial Carriers</div>
        </div>

        <div class="metric-card">
          <div class="metric-lbl">Available Haulage Requests</div>
          <div class="metric-val text-amber">{{ transportService.transportRequests().length }}</div>
          <div class="metric-sub">Open for Freight Quotes</div>
        </div>

        <div class="metric-card">
          <div class="metric-lbl">Active Shipments</div>
          <div class="metric-val text-blue">{{ activeShipmentsCount() }}</div>
          <div class="metric-sub">In Transit / Delivering</div>
        </div>

        <div class="metric-card">
          <div class="metric-lbl">Net 3PL Revenue (95%)</div>
          <div class="metric-val text-green">₹{{ totalEarned().toLocaleString('en-IN') }}</div>
          <div class="metric-sub">Escrow Disbursed & Active</div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="dashboard-tabs">
        <button
          class="tab-btn"
          [class.active]="activeTab === 'fleet'"
          (click)="activeTab = 'fleet'"
        >
          <app-icon name="truck" [size]="16"></app-icon>
          <span>Fleet Management ({{ transportService.vehicles().length }})</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab === 'requests'"
          (click)="activeTab = 'requests'"
        >
          <app-icon name="dollar-sign" [size]="16"></app-icon>
          <span>Available Transport Requests ({{ transportService.transportRequests().length }})</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab === 'active'"
          (click)="activeTab = 'active'"
        >
          <app-icon name="navigation" [size]="16"></app-icon>
          <span>Active Shipments & POD ({{ activeShipmentsCount() }})</span>
        </button>
      </div>

      <!-- TAB 1: FLEET MANAGEMENT -->
      <div *ngIf="activeTab === 'fleet'" class="tab-content">
        <div class="tab-header-row">
          <div>
            <h3 class="section-title">Commercial Vehicle Fleet</h3>
            <p class="section-desc">Manage trucks, assigned drivers, and availability for agricultural residue dispatch.</p>
          </div>
          <button class="btn-primary" (click)="openAddVehicleModal()">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Add Vehicle to Fleet</span>
          </button>
        </div>

        <!-- Vehicles Grid -->
        <div class="vehicles-grid">
          <div *ngFor="let v of transportService.vehicles()" class="vehicle-card">
            <div class="vehicle-header">
              <span class="reg-number">{{ v.registrationNumber }}</span>
              <span class="status-pill" [ngClass]="'status-' + v.status">{{ v.status.toUpperCase() }}</span>
            </div>

            <div class="vehicle-type-row">
              <span class="vehicle-icon">🚛</span>
              <div>
                <div class="vehicle-type-name">{{ v.vehicleTypeName }}</div>
                <div class="vehicle-cap">Payload Capacity: <strong>{{ v.capacityTonnes }} Tonnes</strong></div>
              </div>
            </div>

            <div class="driver-box">
              <div class="driver-label">Designated Driver</div>
              <div class="driver-name">{{ v.driverName }}</div>
              <div class="driver-contact">📞 {{ v.driverPhone }} &bull; DL: {{ v.driverLicense }}</div>
            </div>

            <div class="vehicle-footer">
              <span class="base-location">📍 Base: {{ v.baseLocation }}</span>
              <button class="btn-toggle-status" (click)="toggleVehicleStatus(v)">
                {{ v.status === 'available' ? 'Mark On Trip' : 'Mark Available' }}
              </button>
            </div>
          </div>

          <div *ngIf="transportService.vehicles().length === 0" class="empty-fleet-card" (click)="openAddVehicleModal()">
            <span class="empty-icon">➕</span>
            <h4>No vehicles registered yet</h4>
            <p>Register your first commercial truck (Pick-Up, Eicher, Taurus, or Multi-Axle) to start submitting freight quotations.</p>
          </div>
        </div>
      </div>

      <!-- TAB 2: AVAILABLE TRANSPORT REQUESTS -->
      <div *ngIf="activeTab === 'requests'" class="tab-content">
        <div class="tab-header-row">
          <div>
            <h3 class="section-title">Open Transport Booking Requests</h3>
            <p class="section-desc">Direct requests from industrial buyers needing bulk biomass haulage. Submit your quotation.</p>
          </div>
        </div>

        <div class="requests-list">
          <div *ngFor="let req of transportService.transportRequests()" class="request-card">
            <div class="request-left">
              <div class="request-badge-row">
                <span class="order-ref">Order: #{{ req.orderId.slice(-6) }}</span>
                <span class="tonnage-badge">{{ req.quantityTonnes }} Tonnes</span>
                <span class="crop-badge">{{ req.residueType }}</span>
                <span class="status-tag">{{ req.status.toUpperCase() }}</span>
              </div>

              <div class="route-display">
                <div class="route-point">
                  <span class="point-icon green">●</span>
                  <div>
                    <span class="point-label">Farm Gate Pickup:</span>
                    <span class="point-address">{{ req.pickupLocation.address }}, {{ req.pickupLocation.district }}</span>
                  </div>
                </div>

                <div class="route-line-box">
                  <div class="route-dashed-line"></div>
                  <span class="route-dist"><strong>{{ req.distanceKm }} km</strong> transit</span>
                </div>

                <div class="route-point">
                  <span class="point-icon amber">▲</span>
                  <div>
                    <span class="point-label">Factory Gate Delivery:</span>
                    <span class="point-address">{{ req.deliveryLocation.address }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="request-right">
              <div class="quotes-count-box">
                <span class="quotes-num">{{ req.quotations.length || 0 }}</span>
                <span class="quotes-lbl">Quotations Submitted</span>
              </div>

              <div *ngIf="hasMyQuotation(req); else submitQuoteBtn" class="quoted-badge">
                <span>✓ Quotation Submitted: ₹{{ getMyQuote(req)?.quoteAmount?.toLocaleString('en-IN') }}</span>
              </div>

              <ng-template #submitQuoteBtn>
                <button class="btn-primary" (click)="openQuoteModal(req)">
                  <app-icon name="dollar-sign" [size]="14"></app-icon>
                  <span>Submit Freight Quote</span>
                </button>
              </ng-template>
            </div>
          </div>

          <div *ngIf="transportService.transportRequests().length === 0" class="empty-state">
            <p>No open transport requests found in your area currently. New haulage requests appear automatically when industrial buyers confirm orders.</p>
          </div>
        </div>
      </div>

      <!-- TAB 3: ACTIVE SHIPMENTS & POD -->
      <div *ngIf="activeTab === 'active'" class="tab-content">
        <div class="tab-header-row">
          <div>
            <h3 class="section-title">Active Transport Shipments & Proof of Delivery</h3>
            <p class="section-desc">Broadcast live GPS coordinates, update delivery milestones, and submit weighbridge POD slip.</p>
          </div>
        </div>

        <div class="active-shipments-list">
          <div *ngFor="let s of transportService.activeDeliveries()" class="active-shipment-card">
            <div class="shipment-header">
              <div>
                <span class="shipment-title">Shipment: #{{ s._id?.slice(-6) || s.orderId.slice(-6) }}</span>
                <span class="shipment-sub">{{ s.quantityTonnes }} Tonnes {{ s.residueType }} &bull; Agreed Freight: ₹{{ s.agreedTransportCost?.toLocaleString('en-IN') }}</span>
              </div>
              <span class="shipment-status-pill" [ngClass]="'status-' + s.status">{{ s.status.toUpperCase() }}</span>
            </div>

            <div class="shipment-details-grid">
              <div class="info-block">
                <span class="info-label">Assigned Vehicle & Driver</span>
                <div class="info-val"><strong>{{ s.assignedVehicleNumber || 'Carrier Fleet' }}</strong></div>
                <div class="info-sub">Driver: {{ s.assignedDriverName || 'Designated Driver' }} ({{ s.assignedDriverPhone }})</div>
              </div>

              <div class="info-block">
                <span class="info-label">Pickup & Delivery Route</span>
                <div class="info-val">{{ s.pickupLocation.district }} &rarr; {{ s.deliveryLocation.district }}</div>
                <div class="info-sub">{{ s.distanceKm }} km highway route</div>
              </div>

              <div class="info-block">
                <span class="info-label">Proof of Delivery (POD)</span>
                <div *ngIf="s.proofOfDelivery; else pendingPOD" class="pod-confirmed-box">
                  <span>Slip: {{ s.proofOfDelivery.slipNumber }}</span>
                  <span>Net: {{ s.proofOfDelivery.netWeightTonnes }} T</span>
                  <span class="pod-verified-flag">{{ s.proofOfDelivery.verifiedByBuyer ? '✓ Verified by Buyer' : '⏳ Awaiting Buyer Sign-Off' }}</span>
                </div>
                <ng-template #pendingPOD>
                  <span class="text-amber">⏳ Pending Weighbridge Tare/Gross Slip</span>
                </ng-template>
              </div>
            </div>

            <div class="shipment-actions-row">
              <button class="btn-action-pin" (click)="openGpsModal(s)">
                <app-icon name="map-pin" [size]="13"></app-icon>
                <span>Update GPS Position</span>
              </button>

              <button class="btn-action-pod" (click)="openPodModal(s)">
                <app-icon name="file-text" [size]="13"></app-icon>
                <span>{{ s.proofOfDelivery ? 'Update POD Slip' : 'Upload Weighbridge POD' }}</span>
              </button>
            </div>
          </div>

          <div *ngIf="transportService.activeDeliveries().length === 0" class="empty-state">
            <p>No active transport deliveries in progress. When an industrial buyer approves your quotation, the booked shipment will appear here.</p>
          </div>
        </div>
      </div>

      <!-- MODAL: ADD VEHICLE -->
      <div *ngIf="isAddVehicleModalOpen" class="modal-backdrop" (click)="closeModals()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Register Vehicle to 3PL Fleet</h3>
            <button class="btn-close" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Vehicle Registration Number *</label>
              <input type="text" [(ngModel)]="newVehicle.registrationNumber" placeholder="e.g. KA-05-MN-8924" class="form-input uppercase" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Vehicle Category *</label>
                <select [(ngModel)]="newVehicle.vehicleType" (change)="onVehicleTypeChange()" class="form-input">
                  <option value="pickup_3t">Pick-Up Truck (3 Tonnes)</option>
                  <option value="eicher_8t">Eicher Medium Hauler (8 Tonnes)</option>
                  <option value="taurus_16t">Heavy 6-Wheeler Taurus (16 Tonnes)</option>
                  <option value="trailer_28t">Multi-Axle Trailer (28 Tonnes)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Load Capacity (Tonnes) *</label>
                <input type="number" [(ngModel)]="newVehicle.capacityTonnes" class="form-input" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Driver Full Name *</label>
                <input type="text" [(ngModel)]="newVehicle.driverName" placeholder="Driver name" class="form-input" />
              </div>
              <div class="form-group">
                <label>Driver Phone Number *</label>
                <input type="tel" [(ngModel)]="newVehicle.driverPhone" placeholder="+91 98765 00000" class="form-input" />
              </div>
            </div>

            <div class="form-group">
              <label>Driver Commercial License (DL Number) *</label>
              <input type="text" [(ngModel)]="newVehicle.driverLicense" placeholder="KA-05-2018-0099881" class="form-input" />
            </div>

            <div class="form-group">
              <label>Base Operating Hub / Yard *</label>
              <input type="text" [(ngModel)]="newVehicle.baseLocation" placeholder="Bengaluru South / Ramanagara Yard" class="form-input" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModals()">Cancel</button>
            <button class="btn-primary" (click)="saveVehicle()">Add Truck to Fleet</button>
          </div>
        </div>
      </div>

      <!-- MODAL: SUBMIT QUOTATION -->
      <div *ngIf="isQuoteModalOpen && selectedRequest" class="modal-backdrop" (click)="closeModals()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Submit Transportation Quotation</h3>
            <button class="btn-close" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div class="quote-summary-box">
              <div class="quote-row">
                <span>Route:</span>
                <strong>{{ selectedRequest.pickupLocation.district }} &rarr; {{ selectedRequest.deliveryLocation.district }} ({{ selectedRequest.distanceKm }} km)</strong>
              </div>
              <div class="quote-row">
                <span>Material:</span>
                <strong>{{ selectedRequest.quantityTonnes }} Tonnes of {{ selectedRequest.residueType }}</strong>
              </div>
            </div>

            <div class="form-group">
              <label>Select Truck from Fleet</label>
              <select [(ngModel)]="quoteForm.vehicleId" (change)="onSelectFleetVehicle()" class="form-input">
                <option value="">-- Choose Truck --</option>
                <option *ngFor="let v of transportService.vehicles()" [value]="v._id || v.id">
                  {{ v.registrationNumber }} ({{ v.vehicleTypeName }} - {{ v.capacityTonnes }}T)
                </option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Total Freight Quotation (₹) *</label>
                <input type="number" [(ngModel)]="quoteForm.quoteAmount" class="form-input text-lg font-bold" />
              </div>
              <div class="form-group">
                <label>Estimated Transit Days *</label>
                <input type="number" [(ngModel)]="quoteForm.estimatedDays" min="1" max="10" class="form-input" />
              </div>
            </div>

            <div class="payout-calc-box">
              <div class="calc-row">
                <span>Quoted Price to Buyer:</span>
                <strong>₹{{ (quoteForm.quoteAmount || 0).toLocaleString('en-IN') }}</strong>
              </div>
              <div class="calc-row">
                <span>AgriMech 5% Platform Fee:</span>
                <span class="text-amber">- ₹{{ Math.round((quoteForm.quoteAmount || 0) * 0.05).toLocaleString('en-IN') }}</span>
              </div>
              <div class="calc-row font-bold highlight">
                <span>Net 3PL Payout on Delivery (95%):</span>
                <span class="text-green">₹{{ Math.round((quoteForm.quoteAmount || 0) * 0.95).toLocaleString('en-IN') }}</span>
              </div>
            </div>

            <div class="form-group">
              <label>Driver & Logistics Notes for Buyer</label>
              <textarea [(ngModel)]="quoteForm.notes" placeholder="Heavy tarp cover included, GPS enabled, experienced hill/highway driver..." class="form-input"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModals()">Cancel</button>
            <button class="btn-primary" (click)="submitQuote()">Submit Quotation</button>
          </div>
        </div>
      </div>

      <!-- MODAL: PROOF OF DELIVERY (POD) -->
      <div *ngIf="isPodModalOpen && selectedShipment" class="modal-backdrop" (click)="closeModals()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Upload Weighbridge Proof of Delivery (POD)</h3>
            <button class="btn-close" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-info">
              Weighbridge Gross & Tare receipts are required to verify delivered tonnage and trigger your 95% escrow payout release.
            </p>

            <div class="form-group">
              <label>Electronic Weighbridge Slip Number *</label>
              <input type="text" [(ngModel)]="podForm.slipNumber" placeholder="e.g. APMC-WB-2026-98124" class="form-input uppercase" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Gross Weight (Tonnes) *</label>
                <input type="number" [(ngModel)]="podForm.grossTonnes" placeholder="e.g. 28.5" class="form-input" />
              </div>
              <div class="form-group">
                <label>Tare / Truck Empty Weight (Tonnes) *</label>
                <input type="number" [(ngModel)]="podForm.tareTonnes" placeholder="e.g. 10.2" class="form-input" />
              </div>
            </div>

            <div class="calc-row font-bold highlight">
              <span>Calculated Net Biomass Weight:</span>
              <span class="text-green">{{ Math.max(0, Math.round(((podForm.grossTonnes || 0) - (podForm.tareTonnes || 0)) * 100) / 100) }} Tonnes</span>
            </div>

            <div class="form-group">
              <label>Receiver Notes / Gate Receipt</label>
              <textarea [(ngModel)]="podForm.notes" placeholder="Signed by factory boiler gate manager..." class="form-input"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModals()">Cancel</button>
            <button class="btn-primary" (click)="submitPod()">Submit POD & Request Payout</button>
          </div>
        </div>
      </div>

      <!-- MODAL: LIVE GPS UPDATE -->
      <div *ngIf="isGpsModalOpen && selectedShipment" class="modal-backdrop" (click)="closeModals()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Update Live Transit Position</h3>
            <button class="btn-close" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Current Delivery Milestone</label>
              <select [(ngModel)]="gpsForm.status" class="form-input">
                <option value="dispatched">Dispatched & Farm Loaded</option>
                <option value="in_transit">In Transit on Highway</option>
                <option value="delivered">Delivered at Industrial Plant Gate</option>
              </select>
            </div>

            <div class="form-group">
              <label>Current Location Landmark / Highway</label>
              <input type="text" [(ngModel)]="gpsForm.locationName" placeholder="NH 275 Near Mandya Bypass" class="form-input" />
            </div>

            <div class="form-group">
              <label>Transit Status Note</label>
              <input type="text" [(ngModel)]="gpsForm.statusNote" placeholder="Tarp checked, moving at 45 km/h, on schedule" class="form-input" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModals()">Cancel</button>
            <button class="btn-primary" (click)="updateGps()">Update Location</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .transporter-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .partner-status-strip {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(217, 119, 6, 0.08) 100%);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .status-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .partner-badge {
      font-size: 11px;
      font-weight: 800;
      color: #047857;
      letter-spacing: 0.05em;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .beacon-pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.8; }
    }

    .company-name {
      font-size: 14px;
      font-weight: 700;
      color: var(--primary-text);
    }

    .license-tag, .gst-tag {
      font-size: 11px;
      font-family: ui-monospace, monospace;
      padding: 2px 7px;
      border-radius: 4px;
      background: var(--sidebar-background);
      border: 1px solid var(--border);
      color: var(--secondary-text);
    }

    .status-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .payout-term-badge {
      font-size: 12px;
      font-weight: 700;
      color: #D97706;
    }

    .btn-refresh {
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      color: var(--primary-text);
    }

    .metrics-ribbon {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }

    .metric-card {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }

    .metric-lbl {
      font-size: 12px;
      color: var(--secondary-text);
      font-weight: 600;
      margin-bottom: 6px;
    }

    .metric-val {
      font-size: 24px;
      font-weight: 800;
      color: var(--primary-text);
      font-family: 'Outfit', sans-serif;
    }

    .metric-sub {
      font-size: 11px;
      color: var(--secondary-text);
      margin-top: 4px;
    }

    .text-green { color: #10B981; }
    .text-amber { color: #D97706; }
    .text-blue { color: #3B82F6; }

    .dashboard-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 2px;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: none;
      background: transparent;
      font-size: 13px;
      font-weight: 700;
      color: var(--secondary-text);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 150ms ease;
    }

    .tab-btn:hover {
      color: var(--primary-text);
    }

    .tab-btn.active {
      color: #10B981;
      border-bottom-color: #10B981;
    }

    .tab-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .tab-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 800;
      color: var(--primary-text);
      margin: 0;
    }

    .section-desc {
      font-size: 12px;
      color: var(--secondary-text);
      margin: 4px 0 0 0;
    }

    .vehicles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .vehicle-card {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }

    .vehicle-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .reg-number {
      font-size: 14px;
      font-weight: 800;
      font-family: ui-monospace, monospace;
      letter-spacing: 0.05em;
    }

    .status-pill {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 999px;
    }

    .status-available { background: rgba(16, 185, 129, 0.15); color: #059669; }
    .status-on_trip { background: rgba(59, 130, 246, 0.15); color: #2563EB; }
    .status-maintenance { background: rgba(239, 68, 68, 0.15); color: #DC2626; }

    .vehicle-type-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .vehicle-icon {
      font-size: 24px;
    }

    .vehicle-type-name {
      font-size: 13px;
      font-weight: 700;
    }

    .vehicle-cap {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .driver-box {
      background: var(--sidebar-background);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
    }

    .driver-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--secondary-text);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .driver-name {
      font-size: 13px;
      font-weight: 700;
      margin: 2px 0;
    }

    .driver-contact {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .vehicle-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 8px;
      border-top: 1px dashed var(--border);
    }

    .base-location {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .btn-toggle-status {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--primary-text);
      cursor: pointer;
    }

    .empty-fleet-card {
      border: 2px dashed var(--border);
      border-radius: 12px;
      padding: 32px 20px;
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .empty-fleet-card:hover {
      border-color: #10B981;
      background: rgba(16, 185, 129, 0.02);
    }

    .requests-list, .active-shipments-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .request-card, .active-shipment-card {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }

    .request-badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .order-ref {
      font-size: 11px;
      font-weight: 800;
      font-family: ui-monospace, monospace;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--sidebar-background);
      border: 1px solid var(--border);
    }

    .tonnage-badge {
      font-size: 11px;
      font-weight: 800;
      color: #D97706;
      background: rgba(217, 119, 6, 0.12);
      padding: 2px 8px;
      border-radius: 4px;
    }

    .crop-badge {
      font-size: 11px;
      font-weight: 700;
      color: #047857;
      background: rgba(16, 185, 129, 0.12);
      padding: 2px 8px;
      border-radius: 4px;
    }

    .route-display {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .route-point {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 12px;
    }

    .point-icon.green { color: #10B981; }
    .point-icon.amber { color: #D97706; }

    .point-label {
      font-weight: 700;
      margin-right: 4px;
      color: var(--secondary-text);
    }

    .point-address {
      color: var(--primary-text);
      font-weight: 600;
    }

    .route-line-box {
      margin-left: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: var(--secondary-text);
    }

    .route-dashed-line {
      width: 2px;
      height: 14px;
      border-left: 2px dashed var(--border);
    }

    .request-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    }

    .quotes-count-box {
      text-align: right;
    }

    .quotes-num {
      font-size: 20px;
      font-weight: 800;
      color: var(--primary-text);
    }

    .quotes-lbl {
      display: block;
      font-size: 11px;
      color: var(--secondary-text);
    }

    .quoted-badge {
      font-size: 12px;
      font-weight: 700;
      color: #059669;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid #10B981;
      padding: 6px 12px;
      border-radius: 8px;
    }

    .shipment-details-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      width: 100%;
      margin: 12px 0;
      background: var(--sidebar-background);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
    }

    .info-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--secondary-text);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-val {
      font-size: 13px;
      margin: 2px 0;
    }

    .info-sub {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .shipment-actions-row {
      display: flex;
      gap: 10px;
      margin-left: auto;
    }

    .btn-action-pin {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--primary-text);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-action-pod {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 8px;
      border: 1px solid #10B981;
      background: #10B981;
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    /* Modal Styles */
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
      max-width: 520px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
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
      font-size: 16px;
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
      max-height: 70vh;
      overflow-y: auto;
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
      padding: 9px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--card-bg, #ffffff);
      color: var(--primary-text);
      font-size: 13px;
    }

    .form-input.uppercase {
      text-transform: uppercase;
      font-family: ui-monospace, monospace;
      letter-spacing: 0.05em;
    }

    .quote-summary-box, .payout-calc-box {
      background: var(--sidebar-background);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .quote-row, .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }

    .calc-row.highlight {
      border-top: 1px dashed var(--border);
      padding-top: 8px;
      font-size: 13px;
    }

    @media (max-width: 768px) {
      .metrics-ribbon {
        grid-template-columns: 1fr 1fr;
      }
      .shipment-details-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TransporterDashboardComponent implements OnInit {
  transportService = inject(TransportService);
  authService = inject(AuthService);
  i18nService = inject(I18nService);
  Math = Math;

  activeTab: 'fleet' | 'requests' | 'active' = 'fleet';

  // Modals state
  isAddVehicleModalOpen = false;
  isQuoteModalOpen = false;
  isPodModalOpen = false;
  isGpsModalOpen = false;

  selectedRequest: TransportBooking | null = null;
  selectedShipment: TransportBooking | null = null;

  newVehicle: Partial<Vehicle> = {
    registrationNumber: '',
    vehicleType: 'taurus_16t',
    capacityTonnes: 16,
    driverName: '',
    driverPhone: '',
    driverLicense: '',
    baseLocation: 'Ramanagara / Bengaluru Hub'
  };

  quoteForm = {
    vehicleId: '',
    quoteAmount: 22000,
    estimatedDays: 2,
    notes: 'Square-baled transport with heavy water-resistant tarp coverage and APMC weighbridge clearance.'
  };

  podForm = {
    slipNumber: '',
    grossTonnes: 28.5,
    tareTonnes: 10.2,
    notes: 'Received and verified at plant boiler intake gate.'
  };

  gpsForm = {
    status: 'in_transit',
    locationName: 'Highway Segment',
    statusNote: 'En route, smooth transit.'
  };

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.transportService.fetchVehicles().subscribe();
    this.transportService.fetchTransportRequests().subscribe();
  }

  activeShipmentsCount(): number {
    return this.transportService.activeDeliveries().length;
  }

  totalEarned(): number {
    return this.transportService.activeDeliveries().reduce((acc, curr) => {
      const agreed = curr.agreedTransportCost || 0;
      return acc + Math.round(agreed * 0.95);
    }, 0);
  }

  hasMyQuotation(req: TransportBooking): boolean {
    const myId = this.authService.currentUser()?.id;
    return !!req.quotations?.some(q => q.transporterId === myId);
  }

  getMyQuote(req: TransportBooking): TransportQuotation | undefined {
    const myId = this.authService.currentUser()?.id;
    return req.quotations?.find(q => q.transporterId === myId);
  }

  openAddVehicleModal(): void {
    this.isAddVehicleModalOpen = true;
  }

  onVehicleTypeChange(): void {
    const capMap: Record<VehicleType, number> = {
      pickup_3t: 3,
      eicher_8t: 8,
      taurus_16t: 16,
      trailer_28t: 28
    };
    if (this.newVehicle.vehicleType) {
      this.newVehicle.capacityTonnes = capMap[this.newVehicle.vehicleType] || 16;
    }
  }

  saveVehicle(): void {
    if (!this.newVehicle.registrationNumber || !this.newVehicle.driverName || !this.newVehicle.driverPhone) {
      alert('Please fill in vehicle registration number, driver name, and phone number.');
      return;
    }

    this.transportService.createVehicle(this.newVehicle).subscribe({
      next: () => {
        this.closeModals();
        this.newVehicle = {
          registrationNumber: '',
          vehicleType: 'taurus_16t',
          capacityTonnes: 16,
          driverName: '',
          driverPhone: '',
          driverLicense: '',
          baseLocation: 'Local Transport Yard'
        };
      },
      error: (err) => {
        alert('Could not add vehicle: ' + (err.error?.message || err.message));
      }
    });
  }

  toggleVehicleStatus(v: Vehicle): void {
    const newStatus = v.status === 'available' ? 'on_trip' : 'available';
    const id = v._id || v.id;
    if (id) {
      this.transportService.updateVehicleStatus(id, newStatus).subscribe();
    }
  }

  openQuoteModal(req: TransportBooking): void {
    this.selectedRequest = req;
    // Auto-calculate suggested freight quotation based on distance and tonnage
    const dist = req.distanceKm || 50;
    const tonnes = req.quantityTonnes || 20;
    const baseRate = dist * 42; // ₹42 per km
    const handling = tonnes * 120; // ₹120/T
    this.quoteForm.quoteAmount = Math.round(baseRate + handling + 1500);
    this.isQuoteModalOpen = true;
  }

  onSelectFleetVehicle(): void {
    const found = this.transportService.vehicles().find(v => (v._id || v.id) === this.quoteForm.vehicleId);
    if (found) {
      this.quoteForm.notes = `Assigned vehicle: ${found.registrationNumber} (${found.vehicleTypeName}) with driver ${found.driverName}.`;
    }
  }

  submitQuote(): void {
    if (!this.selectedRequest || !this.selectedRequest._id) return;

    const fleetVehicle = this.transportService.vehicles().find(v => (v._id || v.id) === this.quoteForm.vehicleId);

    this.transportService.submitQuotation({
      bookingId: this.selectedRequest._id,
      vehicleType: fleetVehicle?.vehicleTypeName || 'Commercial Carrier',
      vehicleCapacityTonnes: fleetVehicle?.capacityTonnes || 16,
      vehicleRegistrationNumber: fleetVehicle?.registrationNumber,
      driverName: fleetVehicle?.driverName,
      driverPhone: fleetVehicle?.driverPhone,
      quoteAmount: this.quoteForm.quoteAmount,
      estimatedDays: this.quoteForm.estimatedDays,
      notes: this.quoteForm.notes
    }).subscribe({
      next: () => {
        this.closeModals();
        alert('Transportation quotation submitted to buyer! Once approved, the freight price is locked.');
      },
      error: (err) => {
        alert('Could not submit quotation: ' + (err.error?.message || err.message));
      }
    });
  }

  openPodModal(shipment: TransportBooking): void {
    this.selectedShipment = shipment;
    this.podForm.slipNumber = `APMC-WB-${Date.now().toString().slice(-5)}`;
    this.podForm.grossTonnes = Math.round(((shipment.quantityTonnes || 20) + 10.5) * 10) / 10;
    this.podForm.tareTonnes = 10.5;
    this.isPodModalOpen = true;
  }

  submitPod(): void {
    if (!this.selectedShipment || !this.selectedShipment._id) return;

    this.transportService.submitProofOfDelivery(this.selectedShipment._id, {
      slipNumber: this.podForm.slipNumber,
      weighbridgeGrossTonnes: this.podForm.grossTonnes,
      weighbridgeTareTonnes: this.podForm.tareTonnes,
      receiverNotes: this.podForm.notes
    }).subscribe({
      next: () => {
        this.closeModals();
        alert('Proof of Delivery (POD) uploaded! Awaiting buyer verification for payout release.');
      },
      error: (err) => {
        alert('Failed to upload POD: ' + err.message);
      }
    });
  }

  openGpsModal(shipment: TransportBooking): void {
    this.selectedShipment = shipment;
    this.gpsForm.status = shipment.status === 'booked' ? 'dispatched' : shipment.status;
    this.isGpsModalOpen = true;
  }

  updateGps(): void {
    if (!this.selectedShipment || !this.selectedShipment._id) return;

    this.transportService.updateLiveTracking(this.selectedShipment._id, {
      lat: 12.650 + (Math.random() * 0.05),
      lng: 77.450 + (Math.random() * 0.05),
      locationName: this.gpsForm.locationName,
      statusNote: this.gpsForm.statusNote,
      status: this.gpsForm.status
    }).subscribe({
      next: () => {
        this.closeModals();
        alert('Tracking position and milestone updated!');
      },
      error: (err) => {
        alert('Failed to update GPS: ' + err.message);
      }
    });
  }

  closeModals(): void {
    this.isAddVehicleModalOpen = false;
    this.isQuoteModalOpen = false;
    this.isPodModalOpen = false;
    this.isGpsModalOpen = false;
    this.selectedRequest = null;
    this.selectedShipment = null;
  }
}
