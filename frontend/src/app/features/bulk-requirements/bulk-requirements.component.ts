import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketplaceService } from '../../core/services/marketplace.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { BulkRequirement } from '../../core/models/marketplace.model';

@Component({
  selector: 'app-bulk-requirements',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, BadgeComponent],
  template: `
    <div class="bulk-page">
      <!-- Header -->
      <div class="bulk-header">
        <div>
          <div class="quota-broadcast-pill">
            <span class="pill-dot"></span>
            <span class="font-mono text-xs">100 KM FACTORY DEMAND BROADCAST</span>
            <span class="text-secondary text-xs">&bull; Real-time Proximity Quota Alert</span>
          </div>
          <h2 class="page-title">Bulk Requirements & Procurement Pools</h2>
          <p class="page-subtitle">
            Post large-scale intake requirements. When an industrial buyer logs a quota, verified suppliers within 100 km are immediately notified.
          </p>
        </div>
        <div class="header-action-btns">
          <button class="btn-primary" (click)="openBroadcastModal()">
            <app-icon name="radar" [size]="14"></app-icon>
            <span>Broadcast 100 KM Factory Quota</span>
          </button>
          <button class="btn-secondary" (click)="isCreateModalOpen.set(true)">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Standard Pool</span>
          </button>
        </div>
      </div>

      <!-- Pools Grid -->
      <div class="pools-grid">
        <div *ngFor="let pool of marketplaceService.bulkRequirements()" class="pool-card">
          <div class="pool-card-header">
            <div>
              <div class="pool-title-row">
                <span class="pool-id font-mono text-xs">{{ pool.id }}</span>
                <span class="badge-radar font-mono">📍 {{ pool.distanceKm !== undefined ? pool.distanceKm + ' km away' : '100 km Radar' }}</span>
                <app-badge [variant]="pool.status === 'Fulfilled' ? 'solid' : 'default'">
                  {{ pool.status }}
                </app-badge>
              </div>
              <h3 class="pool-title">{{ pool.title }}</h3>
              <div class="buyer-org">{{ pool.buyerOrg }} &bull; {{ pool.region }}</div>
            </div>
            <div class="target-rate-box">
              <span class="target-rate">₹{{ pool.targetPricePerTon.toLocaleString('en-IN') }}</span>
              <span class="rate-unit">per tonne</span>
              <span class="escrow-lock-pill font-mono">🔒 50% Advance Escrow</span>
            </div>
          </div>

          <div class="pool-progress-section">
            <div class="progress-labels">
              <span class="progress-txt">Aggregated: <strong>{{ pool.pooledTons }} t</strong> of {{ pool.requiredTons }} t</span>
              <span class="progress-percent font-mono">{{ ((pool.pooledTons / pool.requiredTons) * 100).toFixed(0) }}%</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                [style.width.%]="(pool.pooledTons / pool.requiredTons) * 100"
              ></div>
            </div>
          </div>

          <div class="pool-meta-row">
            <div class="meta-item">
              <span class="lbl">Crop</span>
              <span class="val">{{ pool.cropType }}</span>
            </div>
            <div class="meta-item">
              <span class="lbl">Contributors</span>
              <span class="val">{{ pool.contributorsCount }} Farmers</span>
            </div>
            <div class="meta-item">
              <span class="lbl">Delivery Deadline</span>
              <span class="val">{{ pool.deadline }}</span>
            </div>
          </div>

          <div class="pool-card-footer">
            <span class="shortfall-txt font-mono">
              {{ pool.requiredTons - pool.pooledTons }} tonnes remaining
            </span>
            <button
              class="btn-primary btn-sm"
              [disabled]="pool.status === 'Fulfilled'"
              (click)="openCommitModal(pool)"
            >
              <app-icon name="plus" [size]="13"></app-icon>
              <span>Commit Tonnes</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- BROADCAST 100 KM FACTORY INTAKE QUOTA MODAL               -->
      <!-- ========================================================= -->
      <div *ngIf="isBroadcastModalOpen()" class="modal-backdrop" (click)="isBroadcastModalOpen.set(false)">
        <div class="modal-content broadcast-modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="modal-badge-row">
                <span class="modal-pill font-mono">PROXIMITY BROADCAST</span>
                <span class="modal-radius-pill font-mono">📍 Radius: 100 KM LIVE</span>
              </div>
              <h3 class="modal-title">Broadcast 100 KM Factory Intake Quota</h3>
              <p class="modal-subtitle">
                Alert all verified farmers and FPOs located within a 100 km radius of your processing plant.
              </p>
            </div>
            <button class="btn-ghost btn-sm" (click)="isBroadcastModalOpen.set(false)">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          <div class="modal-body form-grid">
            <div class="form-group">
              <label>Procurement Plant / Buyer Organization *</label>
              <input type="text" [(ngModel)]="broadcastBuyerOrg" placeholder="e.g. Harohalli KIADB Phase-2 Bio-Energy Plant" />
            </div>

            <div class="form-group">
              <label>Requirement Title *</label>
              <input type="text" [(ngModel)]="broadcastTitle" placeholder="e.g. 500T Paddy Straw Boiler Quota" />
            </div>

            <div class="form-group">
              <label>Residue Category (Separated Crop Section) *</label>
              <select [(ngModel)]="broadcastCrop">
                <option value="Paddy Straw">Paddy Straw (Sona Masoori / Basmati)</option>
                <option value="Wheat Stubble">Wheat Stubble (Sharbati / PBW)</option>
                <option value="Mustard Husk">Mustard Husk (Briquette Ready)</option>
                <option value="Sugarcane Bagasse">Sugarcane Bagasse (Pellet Quality)</option>
                <option value="Ragi Straw">Ragi Straw (Finger Millet)</option>
                <option value="Mulberry Dried Stems">Mulberry Stalks (Silk Cocoon Twigs)</option>
              </select>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label>Intake Quota Needed (Tonnes) *</label>
                <input type="number" min="20" step="10" [(ngModel)]="broadcastTons" />
              </div>

              <div class="form-group">
                <label>Offered Buying Price (₹/Tonne) *</label>
                <input type="number" min="500" step="50" [(ngModel)]="broadcastPrice" />
              </div>
            </div>

            <div class="form-group">
              <label>Plant Location / Weighbridge Gate *</label>
              <input type="text" [(ngModel)]="broadcastRegion" placeholder="e.g. Harohalli Industrial Area, Kanakapura Road, Ramanagara" />
            </div>

            <div class="escrow-commitment-card">
              <div class="escrow-check-row">
                <input type="checkbox" id="escrowCommit" [(ngModel)]="broadcastEscrowCommitted" />
                <label for="escrowCommit" class="font-bold">
                  🔒 Commit 50% Milestone Advance into AgriMech Escrow Vault
                </label>
              </div>
              <p class="escrow-explain text-xs text-secondary">
                Guarantees farmers prompt 50% advance custody before dispatch. Remaining 50% payable upon physical weighbridge tare clearance.
              </p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="isBroadcastModalOpen.set(false)">Cancel</button>
            <button class="btn-primary" (click)="submitBroadcastQuota()">
              <app-icon name="radar" [size]="14"></app-icon>
              <span>Transmit 100 KM Broadcast</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- BROADCAST LIVE CONFIRMATION ALERT MODAL                   -->
      <!-- ========================================================= -->
      <div *ngIf="broadcastSuccessData()" class="modal-backdrop" (click)="broadcastSuccessData.set(null)">
        <div class="modal-content success-modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="modal-pill font-mono">BROADCAST ACTIVE</span>
              <h3 class="modal-title">📡 100 KM Radius Broadcast Dispatched!</h3>
            </div>
            <button class="btn-ghost btn-sm" (click)="broadcastSuccessData.set(null)">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          <div class="modal-body success-body">
            <div class="radar-scan-graphic">
              <div class="radar-ring r1"></div>
              <div class="radar-ring r2"></div>
              <div class="radar-center-blip">
                <app-icon name="radar" [size]="24"></app-icon>
              </div>
            </div>

            <div class="success-message-text">
              <h4 class="success-stat-title">14 Verified Sellers & FPOs Alerted</h4>
              <p class="text-secondary text-xs">
                Your demand quota for <strong>{{ broadcastSuccessData().tons }} Tonnes of {{ broadcastSuccessData().crop }}</strong> at
                <strong>₹{{ broadcastSuccessData().price.toLocaleString('en-IN') }}/t</strong> has been broadcasted to all agricultural producers within 100 km of {{ broadcastSuccessData().region }}.
              </p>
            </div>

            <div class="broadcast-summary-card">
              <div class="b-row">
                <span class="text-secondary text-xs">Broadcast Scope:</span>
                <span class="font-mono text-xs font-bold">100 KM Live GPS Radius</span>
              </div>
              <div class="b-row">
                <span class="text-secondary text-xs">Advance Protection:</span>
                <span class="font-mono text-xs font-bold text-highlight">50% Escrow Vault Pre-Authorized</span>
              </div>
              <div class="b-row">
                <span class="text-secondary text-xs">Est. First Offer:</span>
                <span class="font-mono text-xs font-bold">&lt; 2 Hours</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-primary" (click)="broadcastSuccessData.set(null)">
              <span>View Active Pools</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Commit Modal -->
      <div *ngIf="selectedPoolForCommit" class="modal-backdrop" (click)="selectedPoolForCommit = undefined">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">Commit Supply to {{ selectedPoolForCommit.id }}</h3>
              <p class="modal-subtitle">{{ selectedPoolForCommit.title }}</p>
            </div>
            <button class="btn-ghost btn-sm" (click)="selectedPoolForCommit = undefined">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Tonnage to Commit (Tonnes)</label>
              <input
                type="number"
                min="5"
                [max]="selectedPoolForCommit.requiredTons - selectedPoolForCommit.pooledTons"
                [(ngModel)]="commitTonsAmount"
                class="commit-input"
              />
              <span class="field-hint">Fixed purchase rate: ₹{{ selectedPoolForCommit.targetPricePerTon }}/Ton ex-weighbridge</span>
            </div>

            <div class="commit-summary-box">
              <div class="summary-line">
                <span>Total Expected Value:</span>
                <strong>₹{{ (commitTonsAmount * selectedPoolForCommit.targetPricePerTon).toLocaleString('en-IN') }}</strong>
              </div>
              <div class="summary-line">
                <span>CO₂ Abatement Certified:</span>
                <span>{{ (commitTonsAmount * 1.46).toFixed(1) }} t CO₂e</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="selectedPoolForCommit = undefined">Cancel</button>
            <button class="btn-primary" (click)="confirmCommit()">Confirm Allocation</button>
          </div>
        </div>
      </div>

      <!-- Create Pool Modal -->
      <div *ngIf="isCreateModalOpen()" class="modal-backdrop" (click)="isCreateModalOpen.set(false)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">Create Industrial Procurement Pool</h3>
              <p class="modal-subtitle">Open a collective intake quota for verified regional farmers</p>
            </div>
            <button class="btn-ghost btn-sm" (click)="isCreateModalOpen.set(false)">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          <div class="modal-body form-grid">
            <div class="form-group">
              <label>Pool Name / Requirement Title *</label>
              <input type="text" [(ngModel)]="newPoolTitle" placeholder="e.g. 2G Ethanol Biomass Lot" />
            </div>

            <div class="form-group">
              <label>Crop Residue Type *</label>
              <select [(ngModel)]="newPoolCrop">
                <option value="Ragi Straw">Ragi Straw (Finger Millet)</option>
                <option value="Mulberry Dried Stems">Mulberry Stalks (Sericulture)</option>
                <option value="Coconut Shell & Coir">Coconut Shell & Coir Pith</option>
                <option value="Sugarcane Bagasse">Sugarcane Bagasse Pellets</option>
                <option value="Paddy Straw">Paddy Straw (Sona Masoori)</option>
                <option value="Maize Stover">Maize Stover</option>
              </select>
            </div>

            <div class="form-group">
              <label>Required Target Tonnage *</label>
              <input type="number" min="50" step="25" [(ngModel)]="newPoolRequiredTons" />
            </div>

            <div class="form-group">
              <label>Target Offered Price per Tonne (₹) *</label>
              <input type="number" min="500" step="50" [(ngModel)]="newPoolPrice" />
            </div>

            <div class="form-group">
              <label>Geographic Hub *</label>
              <input type="text" [(ngModel)]="newPoolRegion" placeholder="e.g. Harohalli KIADB Phase-2 / Kanakapura Rd" />
            </div>

            <div class="form-group">
              <label>Delivery Deadline *</label>
              <input type="date" [(ngModel)]="newPoolDeadline" />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="isCreateModalOpen.set(false)">Cancel</button>
            <button class="btn-primary" (click)="submitCreatePool()">Publish Demand Pool</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bulk-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .bulk-header {
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

    .pools-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
    }

    .pool-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
      background-color: var(--card-background);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .pool-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .pool-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .pool-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--primary-text);
    }

    .buyer-org {
      font-size: 12px;
      color: var(--secondary-text);
      margin-top: 2px;
    }

    .target-rate-box {
      text-align: right;
    }

    .target-rate {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-text);
    }

    .rate-unit {
      font-size: 11px;
      color: var(--secondary-text);
      display: block;
    }

    .pool-progress-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }

    .progress-txt {
      color: var(--secondary-text);
    }

    .progress-txt strong {
      color: var(--primary-text);
    }

    .progress-percent {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .progress-track {
      width: 100%;
      height: 6px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background-color: var(--primary-text);
      border-radius: 9999px;
    }

    .pool-meta-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding: 10px 12px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      border-radius: 6px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .meta-item .lbl {
      font-size: 10px;
      color: var(--secondary-text);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .meta-item .val {
      font-size: 12px;
      font-weight: 600;
      color: var(--primary-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pool-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--border);
      padding-top: 12px;
      margin-top: auto;
    }

    .shortfall-txt {
      font-size: 12px;
      color: var(--secondary-text);
    }

    .font-mono {
      font-family: monospace;
    }

    .text-xs {
      font-size: 11px;
    }

    .quota-broadcast-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      border-radius: 999px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      margin-bottom: 6px;
    }

    .pill-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--primary-text);
      display: inline-block;
    }

    .header-action-btns {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .badge-radar {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      color: var(--primary-text);
    }

    .escrow-lock-pill {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      margin-top: 4px;
      display: inline-block;
    }

    .broadcast-modal-box {
      max-width: 580px;
    }

    .modal-badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .modal-pill {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: var(--background);
      border: 1px solid var(--border);
      font-weight: 700;
    }

    .modal-radius-pill {
      font-size: 10px;
      color: var(--secondary-text);
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .escrow-commitment-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      background-color: var(--sidebar-background);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .escrow-check-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }

    .escrow-explain {
      margin: 0;
      line-height: 1.4;
    }

    .success-modal-box {
      max-width: 460px;
    }

    .success-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
      padding: 24px 20px;
    }

    .radar-scan-graphic {
      position: relative;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .radar-ring {
      position: absolute;
      border-radius: 50%;
      border: 2px solid var(--primary-text);
    }

    .r1 {
      width: 48px;
      height: 48px;
      opacity: 0.6;
      animation: pulseR 2s infinite ease-out;
    }

    .r2 {
      width: 76px;
      height: 76px;
      opacity: 0.3;
      animation: pulseR 2s infinite ease-out 0.6s;
    }

    @keyframes pulseR {
      0% { transform: scale(0.6); opacity: 0.8; }
      100% { transform: scale(1.1); opacity: 0; }
    }

    .radar-center-blip {
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success-stat-title {
      font-size: 16px;
      font-weight: 700;
      margin: 0 0 4px 0;
    }

    .broadcast-summary-card {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      background-color: var(--sidebar-background);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .b-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .text-highlight {
      font-weight: 700;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 16px;
      backdrop-filter: blur(2px);
    }

    .modal-content {
      background-color: var(--background);
      border: 1px solid var(--border);
      border-radius: 12px;
      width: 100%;
      max-width: 500px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      background-color: var(--sidebar-background);
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
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .commit-input {
      font-size: 16px;
      font-weight: 600;
      width: 100%;
    }

    .field-hint {
      font-size: 11px;
      color: var(--secondary-text);
      margin-top: 4px;
    }

    .commit-summary-box {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 14px;
      background-color: var(--sidebar-background);
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
    }

    .modal-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background-color: var(--sidebar-background);
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .form-group label {
      font-size: 12px;
      font-weight: 500;
      color: var(--primary-text);
    }

    @media (max-width: 900px) {
      .pools-grid {
        grid-template-columns: 1fr;
      }
      .bulk-header {
        flex-direction: column;
        align-items: stretch;
      }
      .header-action-btns {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class BulkRequirementsComponent implements OnInit {
  marketplaceService = inject(MarketplaceService);
  authService = inject(AuthService);
  notificationService = inject(NotificationService);

  selectedPoolForCommit?: BulkRequirement;
  commitTonsAmount: number = 25;

  isCreateModalOpen = signal<boolean>(false);
  isBroadcastModalOpen = signal<boolean>(false);
  broadcastSuccessData = signal<any | null>(null);

  ngOnInit(): void {
    this.marketplaceService.fetchBackendPools();
  }

  // Standard pool form
  newPoolTitle: string = 'Harohalli Industrial Boiler Biomass Intake';
  newPoolCrop: string = 'Ragi Straw';
  newPoolRequiredTons: number = 500;
  newPoolPrice: number = 2450;
  newPoolRegion: string = 'Harohalli KIADB Phase-2 (Kanakapura Road)';
  newPoolDeadline: string = '2026-11-25';

  // 100 KM Broadcast form
  broadcastBuyerOrg: string = 'Harohalli Bio-Energy Plant KIADB';
  broadcastTitle: string = 'Urgent 500T Paddy Straw Boiler Quota';
  broadcastCrop: string = 'Paddy Straw';
  broadcastTons: number = 500;
  broadcastPrice: number = 2200;
  broadcastRegion: string = 'Harohalli KIADB Phase-2, Kanakapura Road, Ramanagara';
  broadcastEscrowCommitted: boolean = true;

  openCommitModal(pool: BulkRequirement): void {
    this.selectedPoolForCommit = pool;
    this.commitTonsAmount = Math.min(25, pool.requiredTons - pool.pooledTons);
  }

  confirmCommit(): void {
    if (this.selectedPoolForCommit && this.commitTonsAmount > 0) {
      this.marketplaceService.commitToPool(this.selectedPoolForCommit.id, this.commitTonsAmount);
      this.selectedPoolForCommit = undefined;
    }
  }

  submitCreatePool(): void {
    if (!this.newPoolTitle || this.newPoolRequiredTons <= 0) return;

    const user = this.authService.currentUser();
    this.marketplaceService.createBulkRequirement({
      title: this.newPoolTitle,
      buyerOrg: user?.organization || 'Industrial Processing Hub',
      cropType: this.newPoolCrop,
      requiredTons: this.newPoolRequiredTons,
      targetPricePerTon: this.newPoolPrice,
      region: this.newPoolRegion,
      deadline: this.newPoolDeadline,
      buyerPhone: user?.phone,
      buyerId: user?.id
    });

    this.isCreateModalOpen.set(false);
  }

  openBroadcastModal(): void {
    const user = this.authService.currentUser();
    if (user?.organization) {
      this.broadcastBuyerOrg = user.organization;
    }
    this.isBroadcastModalOpen.set(true);
  }

  submitBroadcastQuota(): void {
    if (!this.broadcastTitle || this.broadcastTons <= 0) return;

    const user = this.authService.currentUser();
    this.marketplaceService.createBulkRequirement({
      title: this.broadcastTitle,
      buyerOrg: this.broadcastBuyerOrg || user?.organization || 'Industrial Processing Hub',
      cropType: this.broadcastCrop,
      requiredTons: this.broadcastTons,
      targetPricePerTon: this.broadcastPrice,
      region: this.broadcastRegion,
      deadline: '2026-12-10',
      buyerPhone: user?.phone,
      buyerId: user?.id
    });

    this.notificationService.addNotification({
      title: '🏭 New 100 KM Factory Intake Quota Posted',
      message: `${this.broadcastBuyerOrg}: ${this.broadcastTons}T ${this.broadcastCrop} at ₹${this.broadcastPrice}/t broadcasted to all sellers within 100 km.`,
      type: 'pool',
      link: '/bulk-requirements'
    });

    this.broadcastSuccessData.set({
      crop: this.broadcastCrop,
      tons: this.broadcastTons,
      price: this.broadcastPrice,
      region: this.broadcastRegion
    });

    this.isBroadcastModalOpen.set(false);
  }
}
