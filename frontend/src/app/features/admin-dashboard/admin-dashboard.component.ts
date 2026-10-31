import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PlatformRevenueMetrics, AuditLedgerEntry, UserProfile } from '../../core/models/marketplace.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="admin-page">
      <!-- Strict Business Revenue Model Banner -->
      <div class="revenue-policy-banner">
        <div class="policy-left">
          <span class="policy-badge">🛡️ MONETIZATION POLICY</span>
          <h4>Pure Transaction & Logistics Commission Model</h4>
          <p>
            AgriMech earns platform revenue through <strong>ONLY two transparent methods</strong>:
            (1) A configurable <strong>2% commission</strong> on completed agricultural residue sales;
            (2) A configurable <strong>5% commission</strong> on completed 3PL transportation bookings.
            <strong>Zero subscriptions, zero featured listing charges, and zero compulsory registration fees.</strong>
          </p>
        </div>
        <div class="policy-right">
          <div class="commission-pill">🌾 Crop Residue: <strong>{{ metrics()?.commissionConfig?.residueCommissionPercent || 2 }}%</strong></div>
          <div class="commission-pill">🚛 3PL Transport: <strong>{{ metrics()?.commissionConfig?.transportCommissionPercent || 5 }}%</strong></div>
        </div>
      </div>

      <!-- Core Financial Revenue Metrics -->
      <div class="metrics-grid">
        <div class="metric-card highlight-green">
          <div class="metric-header">
            <span class="metric-title">Net AgriMech Revenue</span>
            <span class="metric-chip green">Platform Earned</span>
          </div>
          <div class="metric-amount">₹{{ (metrics()?.netAgriMechRevenue || 0).toLocaleString('en-IN') }}</div>
          <div class="metric-footer">
            <span>Residue (2%): ₹{{ (metrics()?.commissions?.residueCommissionEarned || 0).toLocaleString('en-IN') }}</span>
            <span>&bull;</span>
            <span>3PL (5%): ₹{{ (metrics()?.commissions?.transportCommissionEarned || 0).toLocaleString('en-IN') }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Agricultural Residue GMV</span>
            <span class="metric-chip">Farm-Gate</span>
          </div>
          <div class="metric-amount">₹{{ (metrics()?.totalResidueGMV || 0).toLocaleString('en-IN') }}</div>
          <div class="metric-footer">
            <span>Farmer Payouts (98%): ₹{{ (metrics()?.disbursements?.supplierPendingInEscrow || 0).toLocaleString('en-IN') }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">3PL Transportation GMV</span>
            <span class="metric-chip amber">Buyer-Paid</span>
          </div>
          <div class="metric-amount">₹{{ (metrics()?.totalTransportGMV || 0).toLocaleString('en-IN') }}</div>
          <div class="metric-footer">
            <span>3PL Transporter Net (95%): ₹{{ (metrics()?.disbursements?.transporter3PLPendingInEscrow || 0).toLocaleString('en-IN') }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Consignment Orders</span>
            <span class="metric-chip blue">Active Flow</span>
          </div>
          <div class="metric-amount">{{ metrics()?.orderCounts?.totalOrders || 0 }}</div>
          <div class="metric-footer">
            <span>{{ metrics()?.orderCounts?.settledOrders || 0 }} Settled &bull; {{ metrics()?.orderCounts?.activeShipments || 0 }} In Transit</span>
          </div>
        </div>
      </div>

      <!-- Admin Tabs -->
      <div class="admin-tabs">
        <button
          class="tab-btn"
          [class.active]="activeTab === 'ledger'"
          (click)="activeTab = 'ledger'"
        >
          <app-icon name="file-text" [size]="16"></app-icon>
          <span>Financial Audit Ledger ({{ adminService.auditLedger().length }})</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab === 'approvals'"
          (click)="activeTab = 'approvals'"
        >
          <app-icon name="check-circle" [size]="16"></app-icon>
          <span>3PL Transport Partner Approvals ({{ adminService.pending3PLPartners().length }})</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab === 'settings'"
          (click)="activeTab = 'settings'"
        >
          <app-icon name="settings" [size]="16"></app-icon>
          <span>Commission Rate Controls</span>
        </button>
      </div>

      <!-- TAB 1: FINANCIAL AUDIT LEDGER -->
      <div *ngIf="activeTab === 'ledger'" class="tab-panel">
        <div class="panel-header">
          <div>
            <h3>Financial Audit Ledger & Escrow Vault Tracking</h3>
            <p>Every transaction records actual AgriMech commissions (2% residue + 5% transport) vs gross client turnover.</p>
          </div>
          <button class="btn-refresh" (click)="loadData()">
            <app-icon name="rotate-cw" [size]="14"></app-icon>
            <span>Refresh Ledger</span>
          </button>
        </div>

        <div class="table-container">
          <table class="audit-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Buyer & Seller</th>
                <th>3PL Partner</th>
                <th>Residue GMV</th>
                <th>2% Fee</th>
                <th>Transport GMV</th>
                <th>5% Fee</th>
                <th>Platform Revenue</th>
                <th>Farmer Payout</th>
                <th>3PL Payout</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of adminService.auditLedger()">
                <td>
                  <span class="order-link">#{{ item.orderId.slice(-6) }}</span>
                  <span class="txn-code">{{ item.transactionId.slice(-8) }}</span>
                </td>
                <td>
                  <div class="party-name font-bold">{{ item.buyerName }}</div>
                  <div class="party-sub text-green">🌾 {{ item.sellerName }}</div>
                </td>
                <td>
                  <span class="carrier-tag">{{ item.transporterName || 'Pending 3PL' }}</span>
                </td>
                <td class="num">₹{{ (item.residueGMV || 0).toLocaleString('en-IN') }}</td>
                <td class="num text-green">₹{{ (item.residueCommissionAmount || 0).toLocaleString('en-IN') }}</td>
                <td class="num">₹{{ (item.transportGMV || 0).toLocaleString('en-IN') }}</td>
                <td class="num text-amber">₹{{ (item.transportCommissionAmount || 0).toLocaleString('en-IN') }}</td>
                <td class="num font-bold text-green">₹{{ (item.netPlatformRevenue || 0).toLocaleString('en-IN') }}</td>
                <td>
                  <span class="status-badge" [ngClass]="item.farmerPayoutStatus === 'released' ? 'released' : 'held'">
                    {{ item.farmerPayoutStatus === 'released' ? 'Released (98%)' : 'Held in Vault' }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" [ngClass]="item.transporterPayoutStatus === 'released' ? 'released' : 'held'">
                    {{ item.transporterPayoutStatus === 'released' ? 'Released (95%)' : 'Held in Vault' }}
                  </span>
                </td>
                <td>
                  <span class="status-tag" [ngClass]="'status-' + item.status">{{ item.status.toUpperCase() }}</span>
                </td>
              </tr>

              <tr *ngIf="adminService.auditLedger().length === 0">
                <td colspan="11" class="empty-table-cell">
                  No settled audit ledger entries yet. New records will appear here as soon as orders are paid through AgriPay.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: 3PL PARTNER APPROVALS -->
      <div *ngIf="activeTab === 'approvals'" class="tab-panel">
        <div class="panel-header">
          <div>
            <h3>3PL Transport Partner Verification Queue</h3>
            <p>Verify independent transport companies before authorizing fleet dispatch.</p>
          </div>
        </div>

        <div class="approvals-grid">
          <div *ngFor="let p of adminService.pending3PLPartners()" class="approval-card">
            <div class="approval-header">
              <span class="company-title">{{ p.organization || p.companyName || p.name + ' Logistics' }}</span>
              <span class="approval-status-pill" [ngClass]="'status-' + (p.approvalStatus || 'approved')">
                {{ (p.approvalStatus || 'approved').toUpperCase() }}
              </span>
            </div>

            <div class="doc-list">
              <div class="doc-row">
                <span class="doc-lbl">GSTIN:</span>
                <span class="doc-val">{{ p.gstin || '29AABCT1234Z1Z5' }}</span>
              </div>
              <div class="doc-row">
                <span class="doc-lbl">Transport License:</span>
                <span class="doc-val">{{ p.transportLicense || 'KA-TRANS-2026-V8' }}</span>
              </div>
              <div class="doc-row">
                <span class="doc-lbl">Contact Person:</span>
                <span class="doc-val">{{ p.name }} (📞 {{ p.phone }})</span>
              </div>
              <div class="doc-row">
                <span class="doc-lbl">Operating States:</span>
                <span class="doc-val">{{ (p.operatingStates && p.operatingStates.length) ? p.operatingStates.join(', ') : 'Karnataka, Tamil Nadu, Haryana' }}</span>
              </div>
            </div>

            <div class="approval-actions">
              <button class="btn-approve" (click)="reviewPartner(p, 'approved')">
                ✓ Approve Partner
              </button>
              <button class="btn-reject" (click)="reviewPartner(p, 'rejected')">
                ✕ Reject
              </button>
            </div>
          </div>

          <div *ngIf="adminService.pending3PLPartners().length === 0" class="empty-state">
            <p>No 3PL transport companies registered yet in database.</p>
          </div>
        </div>
      </div>

      <!-- TAB 3: COMMISSION SETTINGS -->
      <div *ngIf="activeTab === 'settings'" class="tab-panel">
        <div class="settings-card">
          <h3>AgriMech Platform Monetization Controls</h3>
          <p class="settings-desc">
            Adjust the two authorized platform commission rates. Changes apply immediately to all newly created transactions.
          </p>

          <div class="rate-form-grid">
            <div class="rate-control-box">
              <label>Agricultural Residue Transaction Commission (%)</label>
              <div class="input-with-pct">
                <input type="number" [(ngModel)]="rateConfig.residueCommissionPercent" step="0.5" min="0" max="10" class="rate-input" />
                <span class="pct-sign">%</span>
              </div>
              <span class="field-hint">Deducted from gross agricultural residue GMV on final weighbridge clearance. Standard default: 2.0%</span>
            </div>

            <div class="rate-control-box">
              <label>3PL Transportation Booking Commission (%)</label>
              <div class="input-with-pct">
                <input type="number" [(ngModel)]="rateConfig.transportCommissionPercent" step="0.5" min="0" max="15" class="rate-input" />
                <span class="pct-sign">%</span>
              </div>
              <span class="field-hint">Deducted from approved 3PL transport quotation paid by industrial buyer. Standard default: 5.0%</span>
            </div>
          </div>

          <button class="btn-primary" (click)="saveCommissionRates()">
            Save Commission Settings
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .revenue-policy-banner {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .policy-left {
      max-width: 680px;
    }

    .policy-badge {
      font-size: 11px;
      font-weight: 800;
      color: #047857;
      letter-spacing: 0.05em;
    }

    .policy-left h4 {
      font-size: 16px;
      font-weight: 800;
      color: var(--primary-text);
      margin: 4px 0 6px 0;
    }

    .policy-left p {
      font-size: 13px;
      color: var(--secondary-text);
      line-height: 1.5;
      margin: 0;
    }

    .policy-right {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .commission-pill {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border);
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 13px;
      color: var(--primary-text);
      font-weight: 600;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }

    .metric-card {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }

    .metric-card.highlight-green {
      border-color: rgba(16, 185, 129, 0.4);
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, transparent 100%);
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .metric-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--secondary-text);
    }

    .metric-chip {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--sidebar-background);
      color: var(--secondary-text);
    }

    .metric-chip.green { background: rgba(16, 185, 129, 0.15); color: #047857; }
    .metric-chip.amber { background: rgba(217, 119, 6, 0.15); color: #D97706; }
    .metric-chip.blue { background: rgba(59, 130, 246, 0.15); color: #2563EB; }

    .metric-amount {
      font-size: 26px;
      font-weight: 800;
      color: var(--primary-text);
      font-family: 'Outfit', sans-serif;
    }

    .metric-footer {
      font-size: 11px;
      color: var(--secondary-text);
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .admin-tabs {
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

    .tab-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .panel-header h3 {
      font-size: 16px;
      font-weight: 800;
      color: var(--primary-text);
      margin: 0;
    }

    .panel-header p {
      font-size: 12px;
      color: var(--secondary-text);
      margin: 4px 0 0 0;
    }

    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--card-bg, #ffffff);
      color: var(--primary-text);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    .table-container {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow-x: auto;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }

    .audit-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      text-align: left;
    }

    .audit-table th {
      background: var(--sidebar-background);
      padding: 12px 14px;
      font-weight: 700;
      color: var(--secondary-text);
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }

    .audit-table td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
      white-space: nowrap;
    }

    .audit-table tr:hover {
      background: var(--hover-background);
    }

    .audit-table .num {
      text-align: right;
      font-family: ui-monospace, monospace;
    }

    .order-link {
      font-weight: 800;
      font-family: ui-monospace, monospace;
      color: var(--primary-text);
      display: block;
    }

    .txn-code {
      font-size: 10px;
      color: var(--secondary-text);
      font-family: ui-monospace, monospace;
    }

    .carrier-tag {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--sidebar-background);
      border: 1px solid var(--border);
    }

    .status-badge {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .status-badge.released { background: rgba(16, 185, 129, 0.15); color: #047857; }
    .status-badge.held { background: rgba(217, 119, 6, 0.15); color: #D97706; }

    .status-tag {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .status-settled { background: rgba(16, 185, 129, 0.15); color: #047857; }
    .status-pending { background: rgba(217, 119, 6, 0.15); color: #D97706; }

    .empty-table-cell {
      text-align: center;
      padding: 32px;
      color: var(--secondary-text);
    }

    /* Approvals Grid */
    .approvals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .approval-card {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }

    .approval-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .company-title {
      font-size: 14px;
      font-weight: 800;
      color: var(--primary-text);
    }

    .approval-status-pill {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 999px;
    }

    .approval-status-pill.status-approved { background: rgba(16, 185, 129, 0.15); color: #047857; }
    .approval-status-pill.status-pending { background: rgba(217, 119, 6, 0.15); color: #D97706; }
    .approval-status-pill.status-rejected { background: rgba(239, 68, 68, 0.15); color: #DC2626; }

    .doc-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: var(--sidebar-background);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
      font-size: 12px;
    }

    .doc-row {
      display: flex;
      justify-content: space-between;
    }

    .doc-lbl {
      color: var(--secondary-text);
      font-weight: 600;
    }

    .doc-val {
      font-family: ui-monospace, monospace;
      font-weight: 700;
      color: var(--primary-text);
    }

    .approval-actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
    }

    .btn-approve {
      flex: 1;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid #10B981;
      background: #10B981;
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-reject {
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--secondary-text);
      font-size: 12px;
      cursor: pointer;
    }

    /* Settings Card */
    .settings-card {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      max-width: 640px;
    }

    .settings-card h3 {
      font-size: 16px;
      font-weight: 800;
      margin: 0;
    }

    .settings-desc {
      font-size: 13px;
      color: var(--secondary-text);
      margin: 6px 0 20px 0;
    }

    .rate-form-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    .rate-control-box label {
      font-size: 12px;
      font-weight: 700;
      color: var(--primary-text);
      display: block;
      margin-bottom: 6px;
    }

    .input-with-pct {
      display: flex;
      align-items: center;
      max-width: 180px;
      position: relative;
    }

    .rate-input {
      width: 100%;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      font-size: 16px;
      font-weight: 700;
      background: var(--card-bg, #ffffff);
      color: var(--primary-text);
    }

    .pct-sign {
      position: absolute;
      right: 12px;
      font-weight: 700;
      color: var(--secondary-text);
    }

    .field-hint {
      font-size: 11px;
      color: var(--secondary-text);
      margin-top: 4px;
      display: block;
    }

    @media (max-width: 900px) {
      .metrics-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  adminService = inject(AdminService);
  authService = inject(AuthService);
  i18nService = inject(I18nService);

  activeTab: 'ledger' | 'approvals' | 'settings' = 'ledger';
  metrics = signal<PlatformRevenueMetrics | null>(null);

  rateConfig = {
    residueCommissionPercent: 2.0,
    transportCommissionPercent: 5.0
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.adminService.fetchRevenueMetrics().subscribe(res => {
      if (res && res.data) {
        this.metrics.set(res.data);
        if (res.data.commissionConfig) {
          this.rateConfig = { ...res.data.commissionConfig };
        }
      }
    });
    this.adminService.fetchAuditLedger().subscribe();
    this.adminService.fetch3PLPartners().subscribe();
  }

  reviewPartner(partner: UserProfile, status: 'approved' | 'rejected'): void {
    const id = partner.id || (partner as any)._id;
    if (id) {
      this.adminService.review3PLPartner(id, status).subscribe({
        next: () => {
          alert(`3PL Partner ${partner.organization || partner.name} has been ${status}.`);
        }
      });
    }
  }

  saveCommissionRates(): void {
    this.adminService.updateCommissionRates(
      this.rateConfig.residueCommissionPercent,
      this.rateConfig.transportCommissionPercent
    ).subscribe({
      next: () => {
        alert('Platform commission rates updated successfully!');
      }
    });
  }
}
