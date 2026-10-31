import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { EscrowService, EscrowSecurityCertificate } from '../../core/services/escrow.service';
import { TransportService } from '../../core/services/transport.service';
import { AgriPayService } from '../../core/services/agripay.service';
import { I18nService } from '../../core/services/i18n.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { Order, TransportBooking, TransportQuotation, AgriPayReceipt } from '../../core/models/marketplace.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, BadgeComponent],
  template: `
    <div class="orders-page">
      <!-- Header Banner with Financial Protections -->
      <div class="orders-header">
        <div>
          <div class="escrow-header-pill">
            <span class="pill-dot"></span>
            <span class="font-mono text-xs">AGRIPAY TRUST ESCROW & 3PL NETWORK ACTIVE</span>
            <span class="text-secondary text-xs">&bull; 100% Buyer-Paid Transport &bull; Farmer Transport: ₹0</span>
          </div>
          <h2 class="page-title">Consignment Orders & Fulfillment</h2>
          <p class="page-subtitle">
            Secure trade execution with itemized residue + freight separation, 3PL transport carrier bidding, AgriPay instant checkout, and milestone weighbridge tracking.
          </p>
        </div>

        <div class="header-stats-strip">
          <div class="stat-card">
            <span class="stat-num font-mono">{{ orderService.orders().length }}</span>
            <span class="stat-label">Total Consignments</span>
          </div>
          <div class="stat-card">
            <span class="stat-num font-mono text-highlight">₹{{ totalEscrowHeld().toLocaleString('en-IN') }}</span>
            <span class="stat-label">Escrow Vault Held</span>
          </div>
          <div class="stat-card">
            <span class="stat-num font-mono text-freight">₹{{ totalFreightPaid().toLocaleString('en-IN') }}</span>
            <span class="stat-label">Buyer-Paid 3PL Freight</span>
          </div>
        </div>
      </div>

      <!-- Filter Strip -->
      <div class="filter-strip">
        <div class="search-box">
          <app-icon name="search" [size]="14"></app-icon>
          <input
            type="text"
            placeholder="Search order ID, vault ID, buyer, seller, crop..."
            [(ngModel)]="searchFilter"
          />
        </div>

        <div class="status-tabs">
          <button
            type="button"
            class="tab-btn"
            [class.active]="selectedStatusTab === 'ALL'"
            (click)="selectedStatusTab = 'ALL'"
          >
            All Consignments
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="selectedStatusTab === 'ACTIVE'"
            (click)="selectedStatusTab = 'ACTIVE'"
          >
            In Transit & Dispatched
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="selectedStatusTab === 'COMPLETED'"
            (click)="selectedStatusTab = 'COMPLETED'"
          >
            Delivered & Settled
          </button>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Order & Escrow Vault</th>
              <th>Date</th>
              <th>Parties</th>
              <th>Commodity</th>
              <th>Volume</th>
              <th>Residue & 3PL Transport Breakdown</th>
              <th>Freight Carrier & Route</th>
              <th>Status & Vault</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="filteredOrders().length === 0">
              <td colspan="9" class="empty-orders-cell">
                <div class="empty-orders-box">
                  <span style="font-size: 36px; margin-bottom: 4px;">📦</span>
                  <div style="font-size: 16px; font-weight: 600; color: var(--primary-text);">No Active Orders Found</div>
                  <p style="font-size: 13px; color: var(--secondary-text); max-width: 440px; margin: 0; line-height: 1.5;">
                    When you confirm a trade in <strong>Negotiations</strong>, your consignment order, 3PL transport bidding, AgriPay escrow security, and weighbridge verification will automatically appear here.
                  </p>
                  <a routerLink="/suppliers" class="btn-primary btn-sm" style="margin-top: 12px;">Browse Marketplace</a>
                </div>
              </td>
            </tr>

            <tr *ngFor="let order of filteredOrders()">
              <!-- ID & Vault Cell -->
              <td>
                <div class="id-cell">
                  <span class="font-mono font-bold text-xs">{{ order.id }}</span>
                  <span class="vault-tag font-mono">
                    <app-icon name="shield" [size]="11"></app-icon>
                    <span>{{ order.escrowVaultId || 'ESC-VAULT' }}</span>
                  </span>
                </div>
              </td>

              <!-- Date -->
              <td class="text-secondary text-xs">{{ order.date }}</td>

              <!-- Parties -->
              <td>
                <div class="partner-cell">
                  <span class="partner-name">{{ order.buyerName }} <span class="role-sub font-mono">(Buyer)</span></span>
                  <span class="text-secondary text-xs">Seller: {{ order.sellerName }}</span>
                  <span class="text-secondary text-xs" *ngIf="order.transporterName">3PL: <strong>{{ order.transporterName }}</strong></span>
                </div>
              </td>

              <!-- Crop -->
              <td>
                <span class="font-medium">{{ order.cropType }}</span>
              </td>

              <!-- Quantity -->
              <td class="font-mono">{{ order.quantityTons }} T</td>

              <!-- Financial Breakdown: Residue vs 3PL Transport -->
              <td>
                <div class="value-cell">
                  <!-- Residue Cost -->
                  <div class="financial-line">
                    <span class="fin-label">Material:</span>
                    <span class="fin-val font-mono">₹{{ getResidueCost(order).toLocaleString('en-IN') }}</span>
                    <span class="unit-val text-secondary text-xs font-mono">(&#64;₹{{ order.pricePerTon }}/t)</span>
                  </div>

                  <!-- 3PL Freight Cost -->
                  <div class="financial-line freight-line">
                    <span class="fin-label">3PL Freight:</span>
                    <span class="fin-val font-mono text-freight" *ngIf="order.transportCost">
                      +₹{{ order.transportCost.toLocaleString('en-IN') }}
                    </span>
                    <span class="fin-val font-mono text-secondary text-xs" *ngIf="!order.transportCost">
                      Quoting in Progress
                    </span>
                  </div>

                  <!-- Total Invoice -->
                  <div class="total-row font-mono">
                    <span>Total:</span>
                    <strong>₹{{ getTotalAmount(order).toLocaleString('en-IN') }}</strong>
                  </div>

                  <!-- 100% Buyer Paid Tag -->
                  <span class="buyer-pays-badge font-mono text-xs">
                    Buyer Pays 100% Transport &bull; Farmer ₹0
                  </span>
                </div>
              </td>

              <!-- Route & Assigned Truck -->
              <td>
                <div class="truck-cell">
                  <span class="truck-plate font-mono">{{ order.truckDetails }}</span>
                  <span class="route-text text-secondary text-xs">{{ order.originLocation }} &rarr; {{ order.deliveryLocation }}</span>
                  <span class="route-dist font-mono" *ngIf="order.distanceKm">📍 {{ order.distanceKm }} km transit</span>
                </div>
              </td>

              <!-- Status -->
              <td>
                <div class="status-cell">
                  <app-badge [showDot]="true">{{ order.status }}</app-badge>
                  <span class="escrow-status-pill text-xs font-mono" [class.verified]="order.escrowStatus === 'released_to_seller'">
                    {{ getEscrowBadgeLabel(order.escrowStatus) }}
                  </span>
                  <span *ngIf="order.paymentDetails?.paymentStatus === 'escrow_locked'" class="paid-vault-pill text-xs font-mono">
                    🔒 Escrow Funded
                  </span>
                </div>
              </td>

              <!-- Actions Group -->
              <td>
                <div class="action-buttons-group">
                  <!-- 3PL Transport Quotes Action (if buyer wants to select carrier) -->
                  <button
                    *ngIf="isBuyer() && (!order.transportCost || order.transportCost === 0)"
                    class="btn-action btn-quotes"
                    (click)="openQuotesModal(order)"
                    title="View 3PL Haulage Quotations and lock freight"
                  >
                    <app-icon name="truck" [size]="12"></app-icon>
                    <span>3PL Quotes ({{ getQuotesCount(order) }})</span>
                  </button>

                  <!-- AgriPay Checkout Action (if not yet paid) -->
                  <button
                    *ngIf="isBuyer() && (!order.paymentDetails || order.paymentDetails.paymentStatus !== 'escrow_locked') && order.escrowStatus !== 'released_to_seller'"
                    class="btn-action btn-pay"
                    (click)="openAgriPayModal(order)"
                    title="Pay Material + Freight to Escrow Vault via AgriPay"
                  >
                    <app-icon name="shield" [size]="12"></app-icon>
                    <span>Pay with AgriPay</span>
                  </button>

                  <!-- View Digital Receipt Action (if paid) -->
                  <button
                    *ngIf="order.paymentDetails?.paymentStatus === 'escrow_locked' || order.escrowStatus === 'released_to_seller'"
                    class="btn-action btn-receipt"
                    (click)="viewAgriPayReceipt(order)"
                    title="Download / Print AgriPay Official Escrow Receipt"
                  >
                    <app-icon name="file-text" [size]="12"></app-icon>
                    <span>AgriPay Receipt</span>
                  </button>

                  <!-- Proof of Delivery (POD) Verification for Buyer -->
                  <button
                    *ngIf="isBuyer() && order.status !== 'Delivered' && order.escrowStatus !== 'released_to_seller'"
                    class="btn-action btn-verify-pod"
                    (click)="openPodVerificationModal(order)"
                    title="Verify Tare/Gross Weighbridge Slip & Release Payouts"
                  >
                    <app-icon name="check" [size]="12"></app-icon>
                    <span>Verify POD</span>
                  </button>

                  <!-- Flipkart-Style 5-Stage Live Milestone Tracker -->
                  <button
                    class="btn-action btn-track"
                    (click)="openTrackingModal(order)"
                    title="View live 5-stage fulfillment timeline"
                  >
                    <app-icon name="truck" [size]="12"></app-icon>
                    <span>Track</span>
                  </button>

                  <!-- 50% Escrow Certificate -->
                  <button
                    class="btn-action btn-escrow"
                    (click)="openCertificateModal(order)"
                    title="View official Escrow Security Certificate"
                  >
                    <app-icon name="shield" [size]="12"></app-icon>
                    <span>Certificate</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ========================================================= -->
      <!-- MODAL 1: 3PL TRANSPORT QUOTATIONS COMPARISON MODAL        -->
      <!-- ========================================================= -->
      <div *ngIf="selectedOrderForQuotes" class="modal-backdrop" (click)="selectedOrderForQuotes = undefined">
        <div class="modal-content quotes-modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="modal-badge-row">
                <span class="modal-pill font-mono">3PL FREIGHT MARKETPLACE</span>
                <span class="modal-vault-pill font-mono">Order: {{ selectedOrderForQuotes.id }}</span>
              </div>
              <h3 class="modal-title">Select 3PL Carrier Quotation</h3>
              <p class="modal-subtitle">
                Compare competitive bids submitted by verified transport companies. 100% of freight is paid by the Industrial Buyer (Farmer pays ₹0).
              </p>
            </div>
            <button class="btn-ghost btn-sm" (click)="selectedOrderForQuotes = undefined">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          <div class="modal-body quotes-modal-body">
            <!-- Order Context Strip -->
            <div class="quote-context-card">
              <div class="q-chunk">
                <span class="q-label">Agricultural Commodity:</span>
                <span class="q-val font-semibold">{{ selectedOrderForQuotes.cropType }} ({{ selectedOrderForQuotes.quantityTons }} Tonnes)</span>
              </div>
              <div class="q-chunk">
                <span class="q-label">Haulage Route:</span>
                <span class="q-val font-mono">{{ selectedOrderForQuotes.originLocation }} &rarr; {{ selectedOrderForQuotes.deliveryLocation }}</span>
              </div>
              <div class="q-chunk">
                <span class="q-label">Estimated Distance:</span>
                <span class="q-val font-mono">📍 {{ selectedOrderForQuotes.distanceKm || 35 }} km</span>
              </div>
            </div>

            <!-- Available Quotations List -->
            <div class="quotes-list-section">
              <div class="section-title-strip">
                <span class="font-mono font-bold text-xs">AVAILABLE 3PL CARRIER BIDS ({{ activeBookingQuotations.length }})</span>
                <span class="text-secondary text-xs">Agreed quotation is locked separately from residue price</span>
              </div>

              <div *ngIf="activeBookingQuotations.length === 0" class="empty-quotes-state">
                <span style="font-size: 28px;">⏳</span>
                <h4>Waiting for 3PL Carrier Bids</h4>
                <p>This transport request has been broadcasted to registered transporters. As carriers submit bids, they will appear here instantly.</p>
                <button class="btn-secondary btn-sm" (click)="generateSimulatedQuote(selectedOrderForQuotes)">
                  <span>Simulate Instant Carrier Bid</span>
                </button>
              </div>

              <div *ngFor="let q of activeBookingQuotations" class="quote-card">
                <div class="quote-card-header">
                  <div>
                    <h4 class="carrier-title">{{ q.transporterName }}</h4>
                    <span class="carrier-meta font-mono text-xs">
                      ⭐ {{ q.transporterRating || 4.8 }} &bull; {{ q.vehicleType }} (Cap: {{ q.vehicleCapacityTonnes }}T) &bull; {{ q.transporterPhone }}
                    </span>
                  </div>
                  <div class="quote-amount-col">
                    <span class="q-total-amount font-mono">₹{{ q.quoteAmount.toLocaleString('en-IN') }}</span>
                    <span class="text-secondary text-xs font-mono">₹{{ Math.round(q.quoteAmount / selectedOrderForQuotes.quantityTons) }}/Tonne</span>
                  </div>
                </div>

                <div class="quote-breakdown-grid font-mono text-xs">
                  <div class="bk-item">
                    <span class="text-secondary">Base Freight:</span>
                    <span>₹{{ (q.breakdown.baseFreight || q.quoteAmount * 0.75).toLocaleString('en-IN') }}</span>
                  </div>
                  <div class="bk-item">
                    <span class="text-secondary">Fuel Surcharge:</span>
                    <span>₹{{ (q.breakdown.fuelSurcharge || q.quoteAmount * 0.15).toLocaleString('en-IN') }}</span>
                  </div>
                  <div class="bk-item">
                    <span class="text-secondary">Tolls & Permits:</span>
                    <span>₹{{ (q.breakdown.tolls || q.quoteAmount * 0.05).toLocaleString('en-IN') }}</span>
                  </div>
                  <div class="bk-item">
                    <span class="text-secondary">Loading / Tare:</span>
                    <span>₹{{ (q.breakdown.loadingUnloadingHandling || q.quoteAmount * 0.05).toLocaleString('en-IN') }}</span>
                  </div>
                </div>

                <div class="quote-footer">
                  <span class="transit-est text-xs">
                    ⏱️ Estimated Delivery: <strong>{{ q.estimatedDays || 2 }} Days</strong> &bull; Note: "{{ q.notes || 'Direct farm gate baler pickup with hydraulic unloading' }}"
                  </span>
                  <button class="btn-primary btn-sm btn-lock-freight" (click)="approveAndLockFreight(selectedOrderForQuotes, q)">
                    <app-icon name="lock" [size]="12"></app-icon>
                    <span>Approve & Lock Freight</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="selectedOrderForQuotes = undefined">Close</button>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- MODAL 2: AGRIPAY SECURE PAYMENT GATEWAY CHECKOUT MODAL    -->
      <!-- ========================================================= -->
      <div *ngIf="selectedOrderForPayment" class="modal-backdrop" (click)="selectedOrderForPayment = undefined">
        <div class="modal-content payment-modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="modal-badge-row">
                <span class="modal-pill font-mono">AGRIPAY SECURE GATEWAY</span>
                <span class="modal-vault-pill font-mono">Vault ID: {{ selectedOrderForPayment.escrowVaultId }}</span>
              </div>
              <h3 class="modal-title">Deposit Funds into AgriPay Escrow Vault</h3>
              <p class="modal-subtitle">
                100% protection against counterparty fraud. Funds remain securely locked in trust escrow until electronic weighbridge clearance.
              </p>
            </div>
            <button class="btn-ghost btn-sm" (click)="selectedOrderForPayment = undefined">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          <div class="modal-body payment-modal-body">
            <!-- Itemized Invoice Breakdown -->
            <div class="checkout-ledger-card">
              <div class="ledger-header font-mono">
                <span>Payment Itemization</span>
                <span class="text-right">Amount (INR)</span>
              </div>

              <!-- Residue Material -->
              <div class="ledger-row">
                <div>
                  <strong>Agricultural Residue Feedstock</strong>
                  <div class="text-secondary text-xs">
                    {{ selectedOrderForPayment.quantityTons }}T {{ selectedOrderForPayment.cropType }} &#64; ₹{{ selectedOrderForPayment.pricePerTon }}/T
                  </div>
                  <div class="commission-disclosure font-mono text-xs">
                    &bull; Farmer Payout (98%): ₹{{ (getResidueCost(selectedOrderForPayment) * 0.98).toLocaleString('en-IN') }} | Platform Commission (2%): ₹{{ (getResidueCost(selectedOrderForPayment) * 0.02).toLocaleString('en-IN') }}
                  </div>
                </div>
                <strong class="font-mono text-right">₹{{ getResidueCost(selectedOrderForPayment).toLocaleString('en-IN') }}</strong>
              </div>

              <!-- 3PL Freight -->
              <div class="ledger-row highlight-freight-row">
                <div>
                  <strong class="text-freight">3PL Haulage Freight (Agreed Lock)</strong>
                  <div class="text-secondary text-xs">
                    Assigned Carrier: {{ selectedOrderForPayment.transporterName || 'Verified 3PL Network' }} ({{ selectedOrderForPayment.truckDetails }})
                  </div>
                  <div class="commission-disclosure font-mono text-xs">
                    &bull; 3PL Payout (95%): ₹{{ ((selectedOrderForPayment.transportCost || 18500) * 0.95).toLocaleString('en-IN') }} | Platform Commission (5%): ₹{{ ((selectedOrderForPayment.transportCost || 18500) * 0.05).toLocaleString('en-IN') }}
                  </div>
                </div>
                <strong class="font-mono text-freight text-right">
                  +₹{{ (selectedOrderForPayment.transportCost || 18500).toLocaleString('en-IN') }}
                </strong>
              </div>

              <!-- Farmer Transport Policy Note -->
              <div class="farmer-zero-box">
                <app-icon name="shield" [size]="14"></app-icon>
                <span><strong>Policy:</strong> Farmer pays ₹0 for transport. 100% of freight is borne by Industrial Buyer.</span>
              </div>

              <!-- Total Payable -->
              <div class="ledger-total-row">
                <div>
                  <div class="total-heading">Total Deposited into Escrow Vault</div>
                  <span class="text-secondary text-xs">Full advance settlement held in neutral clearing escrow</span>
                </div>
                <div class="total-big-val font-mono">
                  ₹{{ (getResidueCost(selectedOrderForPayment) + (selectedOrderForPayment.transportCost || 18500)).toLocaleString('en-IN') }}
                </div>
              </div>
            </div>

            <!-- Payment Method Selection -->
            <div class="payment-methods-section">
              <label class="methods-title font-mono font-bold text-xs">CHOOSE SECURE PAYMENT INSTRUMENT:</label>
              <div class="methods-grid">
                <label class="method-option-card" [class.selected]="selectedPaymentMethod === 'AgriPay Instant UPI'">
                  <input
                    type="radio"
                    name="payMethod"
                    value="AgriPay Instant UPI"
                    [(ngModel)]="selectedPaymentMethod"
                  />
                  <div class="method-details">
                    <span class="method-name">⚡ AgriPay Instant UPI</span>
                    <span class="method-desc text-xs text-secondary">Google Pay, PhonePe, BHIM, Paytm &bull; Instant Escrow Lock</span>
                  </div>
                </label>

                <label class="method-option-card" [class.selected]="selectedPaymentMethod === 'Corporate Net Banking'">
                  <input
                    type="radio"
                    name="payMethod"
                    value="Corporate Net Banking"
                    [(ngModel)]="selectedPaymentMethod"
                  />
                  <div class="method-details">
                    <span class="method-name">🏦 Corporate Net Banking</span>
                    <span class="method-desc text-xs text-secondary">SBI, HDFC, ICICI, Axis, PNB &bull; RTGS/NEFT Escrow Settlement</span>
                  </div>
                </label>

                <label class="method-option-card" [class.selected]="selectedPaymentMethod === 'Debit / Credit Card'">
                  <input
                    type="radio"
                    name="payMethod"
                    value="Debit / Credit Card"
                    [(ngModel)]="selectedPaymentMethod"
                  />
                  <div class="method-details">
                    <span class="method-name">💳 Commercial Debit / Credit Card</span>
                    <span class="method-desc text-xs text-secondary">RuPay, Visa, MasterCard &bull; 256-bit SSL Encrypted</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Escrow Vault Guarantee Notice -->
            <div class="vault-guarantee-notice">
              <app-icon name="lock" [size]="14"></app-icon>
              <span class="text-xs">
                Funds are held in AgriMech Automated Escrow Node. Payouts are auto-released only after buyer plant gate tare/gross weighbridge acceptance and certified moisture inspection (&lt;12%).
              </span>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="selectedOrderForPayment = undefined" [disabled]="agriPayService.isProcessing()">Cancel</button>
            <button
              class="btn-primary btn-pay-now"
              (click)="executeAgriPayCheckout(selectedOrderForPayment)"
              [disabled]="agriPayService.isProcessing()"
            >
              <app-icon name="shield" [size]="14"></app-icon>
              <span>{{ agriPayService.isProcessing() ? 'Locking Funds in Vault...' : 'Confirm & Deposit to Escrow Vault' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- MODAL 3: OFFICIAL AGRIPAY DIGITAL RECEIPT MODAL           -->
      <!-- ========================================================= -->
      <div *ngIf="selectedReceipt" class="modal-backdrop" (click)="selectedReceipt = undefined">
        <div class="modal-content receipt-modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="modal-badge-row">
                <span class="modal-pill font-mono">OFFICIAL ESCROW RECEIPT</span>
                <span class="modal-vault-pill font-mono">{{ selectedReceipt.escrowVaultId }}</span>
              </div>
              <h3 class="modal-title">AgriPay Electronic Settlement Receipt</h3>
              <p class="modal-subtitle">Cryptographic proof of escrow deposit and 2% / 5% commission transparency</p>
            </div>
            <button class="btn-ghost btn-sm" (click)="selectedReceipt = undefined">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          <div class="modal-body receipt-modal-body">
            <div class="receipt-paper">
              <!-- Top Receipt Brand -->
              <div class="receipt-header-row">
                <div class="receipt-brand-col">
                  <div class="receipt-brand-title">AGRIMECH ESCROW CLEARING HOUSE</div>
                  <div class="receipt-brand-sub text-xs text-secondary">B2B Agricultural Biomass & 3PL Logistics Clearing</div>
                </div>
                <div class="receipt-meta-col font-mono text-xs">
                  <div><strong>Txn ID:</strong> {{ selectedReceipt.transactionId }}</div>
                  <div><strong>Order:</strong> {{ selectedReceipt.orderId }}</div>
                  <div><strong>Date:</strong> {{ selectedReceipt.paidAt | date:'medium' }}</div>
                </div>
              </div>

              <!-- Parties -->
              <div class="receipt-parties-row">
                <div class="party-col">
                  <span class="p-lbl font-mono text-xs">BUYER (PAYER):</span>
                  <span class="p-val font-semibold">{{ selectedReceipt.buyerName }}</span>
                  <span class="p-sub text-secondary text-xs">Status: Escrow Funded (100% Freight & Residue)</span>
                </div>
                <div class="party-col">
                  <span class="p-lbl font-mono text-xs">SELLER (BENEFICIARY):</span>
                  <span class="p-val font-semibold">{{ selectedReceipt.sellerName }}</span>
                  <span class="p-sub text-secondary text-xs">Transport Cost Paid by Farmer: ₹0.00</span>
                </div>
              </div>

              <!-- Financial Ledger Table -->
              <div class="receipt-ledger-box">
                <div class="r-ledger-row r-head font-mono">
                  <span>Description</span>
                  <span class="text-right">Gross Amount</span>
                  <span class="text-right">AgriMech Commission</span>
                  <span class="text-right">Net Escrow Payout</span>
                </div>

                <!-- Residue -->
                <div class="r-ledger-row">
                  <div>
                    <strong>Agricultural Residue Material</strong>
                    <div class="text-secondary text-xs">Raw biomass feedstock consignment</div>
                  </div>
                  <span class="font-mono text-right">₹{{ selectedReceipt.breakdown.residueCost.toLocaleString('en-IN') }}</span>
                  <span class="font-mono text-right text-secondary">₹{{ selectedReceipt.breakdown.platformCommissionResidue.toLocaleString('en-IN') }} (2%)</span>
                  <strong class="font-mono text-right">₹{{ selectedReceipt.breakdown.netFarmerPayout.toLocaleString('en-IN') }} (98%)</strong>
                </div>

                <!-- 3PL Transport -->
                <div class="r-ledger-row">
                  <div>
                    <strong>3PL Transportation Freight</strong>
                    <div class="text-secondary text-xs">Carrier: {{ selectedReceipt.transporterName || 'Verified 3PL Network' }}</div>
                  </div>
                  <span class="font-mono text-right">₹{{ selectedReceipt.breakdown.transportCost.toLocaleString('en-IN') }}</span>
                  <span class="font-mono text-right text-secondary">₹{{ selectedReceipt.breakdown.platformCommissionTransport.toLocaleString('en-IN') }} (5%)</span>
                  <strong class="font-mono text-right">₹{{ selectedReceipt.breakdown.netTransporterPayout.toLocaleString('en-IN') }} (95%)</strong>
                </div>

                <!-- Total -->
                <div class="r-ledger-row r-total-row">
                  <div>
                    <strong class="text-base">Total Deposited into Escrow Vault</strong>
                    <div class="text-secondary text-xs">Instrument: {{ selectedReceipt.paymentMethod }}</div>
                  </div>
                  <span class="font-mono text-right"></span>
                  <span class="font-mono text-right text-secondary font-bold">
                    ₹{{ (selectedReceipt.breakdown.platformCommissionResidue + selectedReceipt.breakdown.platformCommissionTransport).toLocaleString('en-IN') }}
                  </span>
                  <strong class="font-mono text-right text-base text-highlight">
                    ₹{{ selectedReceipt.breakdown.totalPayable.toLocaleString('en-IN') }}
                  </strong>
                </div>
              </div>

              <!-- Revenue Model Disclosure -->
              <div class="revenue-disclosure-box">
                <span class="font-mono text-xs font-bold">PLATFORM TRANSPARENCY DISCLOSURE:</span>
                <p class="text-xs text-secondary mt-1">
                  AgriMech operates strictly on two commission streams: exactly <strong>2%</strong> on agricultural residue and <strong>5%</strong> on 3PL transportation bookings. Zero listing fees, zero subscriptions. All funds are secured in neutral escrow until delivery completion.
                </p>
              </div>

              <!-- Seal and Stamp -->
              <div class="receipt-seal-row">
                <div class="qr-box">
                  <div class="qr-placeholder font-mono text-xs">QR VERIFIED</div>
                  <span class="text-xxs font-mono text-secondary">SHA256: {{ selectedReceipt.transactionId.slice(0, 16) }}...</span>
                </div>
                <div class="stamp-seal font-mono">
                  🔒 AGRIPAY VAULT LOCKED
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="selectedReceipt = undefined">Close</button>
            <button class="btn-primary" (click)="printReceipt()">
              <app-icon name="file-text" [size]="14"></app-icon>
              <span>Print Official Receipt</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- MODAL 4: PROOF OF DELIVERY (POD) VERIFICATION MODAL       -->
      <!-- ========================================================= -->
      <div *ngIf="selectedOrderForPod" class="modal-backdrop" (click)="selectedOrderForPod = undefined">
        <div class="modal-content pod-modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="modal-badge-row">
                <span class="modal-pill font-mono">WEIGHBRIDGE &amp; POD CLEARANCE</span>
                <span class="modal-vault-pill font-mono">Order: {{ selectedOrderForPod.id }}</span>
              </div>
              <h3 class="modal-title">Verify Proof of Delivery &amp; Release Escrow</h3>
              <p class="modal-subtitle">
                Compare weighbridge tare and gross weights. Verifying clears delivery and auto-disburses payouts (Farmer: 98%, Transporter: 95%).
              </p>
            </div>
            <button class="btn-ghost btn-sm" (click)="selectedOrderForPod = undefined">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          <div class="modal-body pod-modal-body">
            <div class="weighbridge-card">
              <div class="weighbridge-title font-mono font-bold">APMC ELECTRONIC WEIGHBRIDGE DATA</div>
              <div class="weighbridge-grid">
                <div class="wb-chunk">
                  <span class="wb-label">Tare Weight (Empty Truck):</span>
                  <span class="wb-val font-mono">11.45 Tonnes</span>
                </div>
                <div class="wb-chunk">
                  <span class="wb-label">Gross Weight (Loaded Truck):</span>
                  <span class="wb-val font-mono">{{ 11.45 + selectedOrderForPod.quantityTons }} Tonnes</span>
                </div>
                <div class="wb-chunk">
                  <span class="wb-label">Certified Net Residue Weight:</span>
                  <span class="wb-val font-mono font-bold text-highlight">{{ selectedOrderForPod.quantityTons }} Metric Tonnes</span>
                </div>
                <div class="wb-chunk">
                  <span class="wb-label">Certified Moisture Content:</span>
                  <span class="wb-val font-mono" style="color: #2e7d32;">9.4% (Passed &lt;12% Threshold)</span>
                </div>
              </div>

              <div class="pod-slip-box font-mono text-xs">
                <span>Weighbridge Slip Ref: <strong>WB-APMC-904812</strong></span>
                <span>Unloaded At: <strong>{{ selectedOrderForPod.deliveryLocation }}</strong></span>
              </div>
            </div>

            <!-- Payout Release Preview -->
            <div class="payout-release-preview">
              <span class="font-mono text-xs font-bold">AUTOMATED ESCROW SETTLEMENT UPON CONFIRMATION:</span>
              <div class="payout-row">
                <span>🌾 Farmer Payout (98%):</span>
                <strong class="font-mono">₹{{ (getResidueCost(selectedOrderForPod) * 0.98).toLocaleString('en-IN') }}</strong>
              </div>
              <div class="payout-row">
                <span>🚚 3PL Transporter Payout (95%):</span>
                <strong class="font-mono">₹{{ ((selectedOrderForPod.transportCost || 18500) * 0.95).toLocaleString('en-IN') }}</strong>
              </div>
              <div class="payout-row">
                <span>🏛️ AgriMech Platform Commission (2% + 5%):</span>
                <strong class="font-mono">₹{{ (getResidueCost(selectedOrderForPod) * 0.02 + (selectedOrderForPod.transportCost || 18500) * 0.05).toLocaleString('en-IN') }}</strong>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="selectedOrderForPod = undefined">Cancel</button>
            <button class="btn-primary btn-confirm-payout" (click)="confirmPodVerification(selectedOrderForPod)">
              <app-icon name="check" [size]="14"></app-icon>
              <span>Verify Weighbridge &amp; Release Payouts</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- MODAL 5: FLIPKART/AMAZON STYLE 5-STAGE LIVE TRACKER       -->
      <!-- ========================================================= -->
      <div *ngIf="selectedOrderForTracking" class="modal-backdrop" (click)="selectedOrderForTracking = undefined">
        <div class="modal-content tracking-modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="modal-badge-row">
                <span class="modal-pill font-mono">LIVE MILESTONE TRACKER</span>
                <span class="modal-vault-pill font-mono">Vault: {{ selectedOrderForTracking.escrowVaultId }}</span>
              </div>
              <h3 class="modal-title">Consignment Live Status: {{ selectedOrderForTracking.id }}</h3>
              <p class="modal-subtitle">
                {{ selectedOrderForTracking.cropType }} &bull; {{ selectedOrderForTracking.quantityTons }} Tonnes &bull;
                {{ selectedOrderForTracking.originLocation }} &rarr; {{ selectedOrderForTracking.deliveryLocation }}
              </p>
            </div>
            <button class="btn-ghost btn-sm" (click)="selectedOrderForTracking = undefined">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          <div class="modal-body tracking-modal-body">
            <!-- Route Banner & Distance Card -->
            <div class="transit-banner-card">
              <div class="transit-route-row">
                <div class="loc-point">
                  <span class="loc-label">Origin (Farm Gate)</span>
                  <span class="loc-name">{{ selectedOrderForTracking.originLocation }}</span>
                  <span class="loc-role text-secondary text-xs">Seller: {{ selectedOrderForTracking.sellerName }}</span>
                </div>
                <div class="transit-arrow-box">
                  <span class="dist-bubble font-mono font-bold" *ngIf="selectedOrderForTracking.distanceKm">
                    📍 {{ selectedOrderForTracking.distanceKm }} KM
                  </span>
                  <span class="transit-line"></span>
                  <span class="eta-text text-secondary text-xs">{{ selectedOrderForTracking.transitTime || 'In transit' }}</span>
                </div>
                <div class="loc-point loc-dest">
                  <span class="loc-label">Destination (Factory Boiler)</span>
                  <span class="loc-name">{{ selectedOrderForTracking.deliveryLocation }}</span>
                  <span class="loc-role text-secondary text-xs">Buyer: {{ selectedOrderForTracking.buyerName }}</span>
                </div>
              </div>

              <div class="transit-details-row">
                <div class="detail-chunk">
                  <span class="detail-k">Assigned Truck:</span>
                  <span class="detail-v font-mono">{{ selectedOrderForTracking.truckDetails }}</span>
                </div>
                <div class="detail-chunk">
                  <span class="detail-k">Material Value:</span>
                  <span class="detail-v text-highlight font-mono">₹{{ getResidueCost(selectedOrderForTracking).toLocaleString('en-IN') }}</span>
                </div>
                <div class="detail-chunk">
                  <span class="detail-k">3PL Transport Freight:</span>
                  <span class="detail-v text-freight font-mono">₹{{ (selectedOrderForTracking.transportCost || 18500).toLocaleString('en-IN') }} (100% Buyer Paid)</span>
                </div>
              </div>
            </div>

            <!-- 5-Stage Step-by-Step Milestones -->
            <div class="milestones-timeline-wrapper">
              <div class="timeline-heading-strip">
                <span class="strip-title">5-Stage Flipkart-Style Order Timeline</span>
                <span class="strip-status font-mono">{{ getCompletedMilestonesCount(selectedOrderForTracking) }} / 5 Stages Completed</span>
              </div>

              <div class="milestones-list">
                <div
                  *ngFor="let m of selectedOrderForTracking.trackingMilestones; let idx = index"
                  class="milestone-item"
                  [class.completed]="m.completed"
                  [class.active]="m.active"
                  [class.pending]="!m.completed && !m.active"
                >
                  <div class="milestone-indicator-col">
                    <div class="milestone-node">
                      <app-icon *ngIf="m.completed" name="check" [size]="14"></app-icon>
                      <span *ngIf="m.active" class="active-pulse-dot"></span>
                      <span *ngIf="!m.completed && !m.active" class="stage-num font-mono">{{ m.stage }}</span>
                    </div>
                    <div class="milestone-line" *ngIf="idx < selectedOrderForTracking.trackingMilestones.length - 1"></div>
                  </div>

                  <div class="milestone-content-card">
                    <div class="milestone-top-row">
                      <div class="milestone-title-group">
                        <span class="stage-badge font-mono">STAGE {{ m.stage }}</span>
                        <h4 class="stage-title">{{ m.title }}</h4>
                      </div>
                      <span class="milestone-timestamp font-mono text-xs">{{ m.timestamp }}</span>
                    </div>
                    <p class="milestone-desc">{{ m.description }}</p>
                    <div class="milestone-note-box" *ngIf="m.detailNote">
                      <app-icon name="shield" [size]="12"></app-icon>
                      <span class="note-txt text-xs">{{ m.detailNote }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="selectedOrderForTracking = undefined">Close</button>
            <button class="btn-primary" (click)="openCertificateFromTracking(selectedOrderForTracking)">
              <app-icon name="shield" [size]="14"></app-icon>
              <span>View Escrow Security Certificate</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- MODAL 6: 50% ESCROW SECURITY CERTIFICATE MODAL            -->
      <!-- ========================================================= -->
      <div *ngIf="selectedOrderForCertificate && certificateData" class="modal-backdrop" (click)="selectedOrderForCertificate = undefined">
        <div class="modal-content certificate-modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="modal-badge-row">
                <span class="modal-pill font-mono">OFFICIAL ESCROW PROOF</span>
                <span class="modal-vault-pill font-mono">Vault ID: {{ certificateData.escrowVaultId }}</span>
              </div>
              <h3 class="modal-title">AgriMech Escrow Security Certificate</h3>
              <p class="modal-subtitle">Digitally verified counterparty fraud protection & advance settlement guarantee</p>
            </div>
            <button class="btn-ghost btn-sm" (click)="selectedOrderForCertificate = undefined">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          <div class="modal-body certificate-body">
            <div class="cert-paper">
              <div class="cert-paper-header">
                <div class="cert-logo-section">
                  <span class="cert-shield-badge">
                    <app-icon name="shield" [size]="20"></app-icon>
                  </span>
                  <div>
                    <h3 class="cert-trust-title">AGRIMECH TRUST ESCROW VAULT</h3>
                    <p class="cert-trust-subtitle">B2B Agricultural Biomass Clearing & Settlement Authority</p>
                  </div>
                </div>
                <div class="cert-meta-box font-mono">
                  <div><strong>Cert:</strong> {{ certificateData.certificateId }}</div>
                  <div><strong>Order:</strong> {{ certificateData.orderId }}</div>
                  <div><strong>Issued:</strong> {{ certificateData.issueDate }}</div>
                </div>
              </div>

              <div class="cert-status-ribbon">
                <app-icon name="lock" [size]="14"></app-icon>
                <span class="font-mono font-bold">{{ certificateData.escrowStatusLabel }}</span>
              </div>

              <div class="cert-parties-grid">
                <div class="party-box">
                  <span class="party-role font-mono">CONSIGNOR (SELLER / BENEFICIARY)</span>
                  <span class="party-name">{{ certificateData.sellerName }}</span>
                  <span class="party-detail text-secondary text-xs">Origin: {{ selectedOrderForCertificate.originLocation }}</span>
                  <span class="party-detail text-secondary text-xs">Transport Cost Borne: ₹0.00</span>
                </div>
                <div class="party-box">
                  <span class="party-role font-mono">CONSIGNEE (BUYER / DEPOSITOR)</span>
                  <span class="party-name">{{ certificateData.buyerName }}</span>
                  <span class="party-detail text-secondary text-xs">Destination: {{ selectedOrderForCertificate.deliveryLocation }}</span>
                  <span class="party-detail text-secondary text-xs">Pays 100% Residue + 100% 3PL Transport</span>
                </div>
              </div>

              <div class="cert-guarantee-box">
                <div class="guarantee-title-row">
                  <app-icon name="shield" [size]="14"></app-icon>
                  <span class="font-bold">AgriMech 100% Refund & Quality Protection Guarantee</span>
                </div>
                <p class="guarantee-text">{{ certificateData.guaranteeTerms }}</p>
              </div>

              <div class="cert-seal-strip">
                <div class="qr-mock-box">
                  <div class="qr-inner">
                    <span class="font-mono text-xs font-bold">QR VERIFIED</span>
                    <span class="font-mono text-xxs">SHA-256</span>
                  </div>
                </div>
                <div class="seal-details">
                  <div class="seal-line font-mono text-xs">
                    <strong>Hash:</strong> 0x7F4A...B9028E (Automated Smart Escrow Engine)
                  </div>
                  <div class="seal-line text-xs text-secondary">
                    Digitally signed by AgriMech Clearing House Node &bull; All India 100 km Radius Network
                  </div>
                </div>
                <div class="cert-stamp">
                  <span class="stamp-circle font-mono">AGRIMECH SECURED</span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="selectedOrderForCertificate = undefined">Close</button>
            <button class="btn-primary" (click)="printReceipt()">
              <app-icon name="file-text" [size]="14"></app-icon>
              <span>Print Escrow Certificate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .orders-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .orders-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .escrow-header-pill {
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

    .page-title {
      font-size: 20px;
      font-weight: 700;
      margin: 0;
    }

    .page-subtitle {
      font-size: 13px;
      color: var(--secondary-text);
      margin-top: 4px;
      max-width: 680px;
      line-height: 1.4;
    }

    .header-stats-strip {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background-color: var(--sidebar-background);
    }

    .stat-num {
      font-size: 16px;
      font-weight: 700;
      color: var(--primary-text);
    }

    .stat-label {
      font-size: 10px;
      color: var(--secondary-text);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .text-highlight {
      color: var(--primary-text);
      font-weight: 700;
    }

    .text-freight {
      color: #1e88e5;
      font-weight: 700;
    }

    .filter-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background-color: var(--sidebar-background);
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: var(--background);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 6px 10px;
      width: 320px;
    }

    .search-box input {
      border: none;
      background: transparent;
      padding: 0;
      font-size: 13px;
      width: 100%;
      color: var(--primary-text);
      outline: none;
    }

    .status-tabs {
      display: flex;
      gap: 6px;
    }

    .tab-btn {
      font-size: 12px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 6px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--secondary-text);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tab-btn.active {
      background-color: var(--background);
      border-color: var(--border);
      color: var(--primary-text);
      font-weight: 600;
    }

    .table-container {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
      background-color: var(--background);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }

    th {
      padding: 12px 14px;
      font-size: 11px;
      font-weight: 600;
      color: var(--secondary-text);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid var(--border);
      background-color: var(--sidebar-background);
      white-space: nowrap;
    }

    td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    .empty-orders-cell {
      text-align: center;
      padding: 56px 24px;
    }

    .empty-orders-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .id-cell {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .vault-tag {
      font-size: 10px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      color: var(--secondary-text);
    }

    .partner-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .partner-name {
      font-weight: 600;
      font-size: 13px;
    }

    .role-sub {
      font-size: 10px;
      color: var(--secondary-text);
    }

    .value-cell {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 170px;
    }

    .financial-line {
      display: flex;
      align-items: baseline;
      gap: 4px;
      font-size: 12px;
    }

    .fin-label {
      color: var(--secondary-text);
      font-size: 11px;
    }

    .freight-line {
      padding-top: 1px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      border-top: 1px dashed var(--border);
      padding-top: 3px;
      font-size: 12px;
    }

    .buyer-pays-badge {
      display: inline-block;
      font-size: 9px;
      color: #2e7d32;
      background-color: rgba(46, 125, 50, 0.08);
      padding: 1px 4px;
      border-radius: 3px;
      width: fit-content;
      margin-top: 2px;
    }

    .truck-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-width: 200px;
    }

    .truck-plate {
      font-weight: 600;
      font-size: 11px;
    }

    .route-text {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .route-dist {
      font-size: 10px;
      padding: 2px 5px;
      border-radius: 4px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      color: var(--primary-text);
      display: inline-block;
      width: fit-content;
    }

    .status-cell {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .escrow-status-pill {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      width: fit-content;
      color: var(--secondary-text);
    }

    .paid-vault-pill {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: rgba(46, 125, 50, 0.1);
      color: #2e7d32;
      font-weight: 600;
      width: fit-content;
    }

    .action-buttons-group {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 9px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background-color: var(--background);
      color: var(--primary-text);
      transition: all 0.15s ease;
    }

    .btn-action:hover {
      background-color: var(--hover-background);
    }

    .btn-pay {
      background-color: #163320;
      color: #ffffff;
      border-color: #163320;
    }

    .btn-quotes {
      border-color: #1e88e5;
      color: #1e88e5;
      background-color: rgba(30, 136, 229, 0.06);
    }

    .btn-verify-pod {
      border-color: #2e7d32;
      color: #2e7d32;
      background-color: rgba(46, 125, 50, 0.08);
    }

    /* Modals & Popups */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(2px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-content {
      background-color: var(--background);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.25);
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .quotes-modal-box { width: 720px; }
    .payment-modal-box { width: 680px; }
    .receipt-modal-box { width: 640px; }
    .pod-modal-box { width: 600px; }
    .tracking-modal-box { width: 720px; }
    .certificate-modal-box { width: 720px; }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background-color: var(--sidebar-background);
    }

    .modal-badge-row {
      display: flex;
      gap: 6px;
      margin-bottom: 4px;
    }

    .modal-pill {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: var(--primary-text);
      color: var(--background);
    }

    .modal-vault-pill {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border);
      background-color: var(--background);
      color: var(--secondary-text);
    }

    .modal-title {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
    }

    .modal-subtitle {
      font-size: 12px;
      color: var(--secondary-text);
      margin-top: 3px;
    }

    .modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-footer {
      padding: 14px 20px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background-color: var(--sidebar-background);
    }

    /* Quotes Modal Specifics */
    .quote-context-card {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      padding: 12px 14px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    .q-chunk {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .q-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text);
    }

    .q-val {
      font-size: 12px;
    }

    .quotes-list-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .section-title-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .quote-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 16px;
      background-color: var(--sidebar-background);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .quote-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .carrier-title {
      font-size: 14px;
      font-weight: 700;
      margin: 0;
    }

    .quote-amount-col {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .q-total-amount {
      font-size: 17px;
      font-weight: 700;
      color: #1e88e5;
    }

    .quote-breakdown-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      padding: 8px 10px;
      background-color: var(--background);
      border-radius: 6px;
      border: 1px solid var(--border);
    }

    .bk-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .quote-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .btn-lock-freight {
      background-color: #163320;
      color: #ffffff;
      white-space: nowrap;
    }

    .empty-quotes-state {
      padding: 32px 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      border: 1px dashed var(--border);
      border-radius: 8px;
    }

    /* Checkout & Payment Specifics */
    .checkout-ledger-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 16px;
      background-color: var(--sidebar-background);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .ledger-header {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 700;
      color: var(--secondary-text);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
    }

    .ledger-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      font-size: 13px;
    }

    .highlight-freight-row {
      border-top: 1px dashed var(--border);
      padding-top: 8px;
    }

    .commission-disclosure {
      color: var(--secondary-text);
      margin-top: 2px;
    }

    .farmer-zero-box {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      background-color: rgba(46, 125, 50, 0.08);
      border-radius: 6px;
      color: #2e7d32;
      font-size: 11px;
    }

    .ledger-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 2px solid var(--border);
      padding-top: 10px;
    }

    .total-heading {
      font-size: 13px;
      font-weight: 700;
    }

    .total-big-val {
      font-size: 20px;
      font-weight: 800;
      color: var(--primary-text);
    }

    .payment-methods-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .methods-grid {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .method-option-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background-color: var(--background);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .method-option-card.selected {
      border-color: var(--primary-text);
      background-color: var(--sidebar-background);
    }

    .method-name {
      font-size: 13px;
      font-weight: 600;
    }

    .vault-guarantee-notice {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 6px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      color: var(--secondary-text);
      line-height: 1.4;
    }

    /* Receipt Paper Styles */
    .receipt-paper {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px 20px;
      background-color: var(--sidebar-background);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .receipt-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
    }

    .receipt-brand-title {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    .receipt-parties-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding-bottom: 8px;
      border-bottom: 1px dashed var(--border);
    }

    .party-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .receipt-ledger-box {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .r-ledger-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1.2fr 1.2fr;
      gap: 8px;
      align-items: center;
      font-size: 12px;
    }

    .r-head {
      font-weight: 700;
      color: var(--secondary-text);
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
      font-size: 11px;
    }

    .r-total-row {
      border-top: 1px solid var(--border);
      padding-top: 8px;
    }

    .revenue-disclosure-box {
      padding: 8px 10px;
      background-color: var(--background);
      border: 1px solid var(--border);
      border-radius: 6px;
    }

    .receipt-seal-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      border-top: 1px dashed var(--border);
    }

    .qr-box {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .qr-placeholder {
      font-weight: 700;
      color: var(--primary-text);
    }

    .stamp-seal {
      border: 2px solid var(--primary-text);
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 10px;
      font-weight: 800;
      transform: rotate(-3deg);
    }

    /* Weighbridge POD Styles */
    .weighbridge-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 16px;
      background-color: var(--sidebar-background);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .weighbridge-title {
      font-size: 12px;
      letter-spacing: 0.04em;
    }

    .weighbridge-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .wb-chunk {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .wb-label {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .wb-val {
      font-size: 14px;
    }

    .pod-slip-box {
      display: flex;
      justify-content: space-between;
      border-top: 1px dashed var(--border);
      padding-top: 8px;
      color: var(--secondary-text);
    }

    .payout-release-preview {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px 14px;
      border-radius: 8px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      font-size: 12px;
    }

    .payout-row {
      display: flex;
      justify-content: space-between;
    }

    /* Tracking Modal Styles */
    .transit-banner-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 16px;
      background-color: var(--sidebar-background);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .transit-route-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .loc-point {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-width: 200px;
    }

    .loc-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text);
    }

    .loc-name {
      font-size: 13px;
      font-weight: 600;
    }

    .transit-arrow-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      flex: 1;
    }

    .dist-bubble {
      font-size: 11px;
      padding: 2px 6px;
      background-color: var(--background);
      border: 1px solid var(--border);
      border-radius: 999px;
    }

    .transit-line {
      width: 100%;
      height: 2px;
      background: repeating-linear-gradient(90deg, var(--border) 0, var(--border) 6px, transparent 6px, transparent 10px);
    }

    .transit-details-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      border-top: 1px solid var(--border);
      padding-top: 10px;
      font-size: 12px;
    }

    .detail-chunk {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .detail-k {
      font-size: 10px;
      color: var(--secondary-text);
    }

    .milestones-timeline-wrapper {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .timeline-heading-strip {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
    }

    .milestones-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .milestone-item {
      display: flex;
      gap: 14px;
    }

    .milestone-indicator-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 24px;
    }

    .milestone-node {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--background);
      font-size: 11px;
      font-weight: 700;
    }

    .milestone-item.completed .milestone-node {
      background-color: #2e7d32;
      border-color: #2e7d32;
      color: #ffffff;
    }

    .milestone-item.active .milestone-node {
      border-color: var(--primary-text);
    }

    .active-pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--primary-text);
    }

    .milestone-line {
      width: 2px;
      flex: 1;
      background-color: var(--border);
      margin: 4px 0;
    }

    .milestone-content-card {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background-color: var(--sidebar-background);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .milestone-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .milestone-title-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .stage-badge {
      font-size: 9px;
      padding: 1px 4px;
      border-radius: 3px;
      background-color: var(--background);
      border: 1px solid var(--border);
    }

    .stage-title {
      font-size: 13px;
      font-weight: 600;
      margin: 0;
    }

    .milestone-desc {
      font-size: 12px;
      color: var(--secondary-text);
      margin: 0;
      line-height: 1.4;
    }

    .milestone-note-box {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--primary-text);
      background-color: var(--background);
      padding: 3px 6px;
      border-radius: 4px;
      width: fit-content;
      margin-top: 2px;
    }

    /* Certificate Modal Specifics */
    .cert-paper {
      border: 2px solid var(--border);
      border-radius: 8px;
      padding: 24px;
      background-color: var(--sidebar-background);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .cert-paper-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--border);
      padding-bottom: 16px;
    }

    .cert-logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .cert-shield-badge {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      background-color: #163320;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cert-trust-title {
      font-size: 16px;
      font-weight: 800;
      margin: 0;
    }

    .cert-trust-subtitle {
      font-size: 11px;
      color: var(--secondary-text);
      margin: 0;
    }

    .cert-status-ribbon {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
      background-color: var(--background);
      border: 1px solid var(--border);
    }

    .cert-parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .party-box {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 12px;
      background-color: var(--background);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .party-role {
      font-size: 10px;
      letter-spacing: 0.04em;
      color: var(--secondary-text);
    }

    .party-name {
      font-weight: 700;
      font-size: 13px;
    }

    .cert-guarantee-box {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px 14px;
      background-color: var(--background);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .guarantee-title-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
    }

    .guarantee-text {
      font-size: 12px;
      color: var(--secondary-text);
      margin: 0;
      line-height: 1.4;
    }

    .cert-seal-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px dashed var(--border);
      padding-top: 12px;
    }

    .qr-mock-box {
      border: 1px solid var(--border);
      padding: 6px 10px;
      border-radius: 4px;
      background-color: var(--background);
    }

    .stamp-circle {
      border: 2px solid var(--primary-text);
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 10px;
      font-weight: 800;
      transform: rotate(-3deg);
    }

    /* Common Buttons */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--primary-text);
      background-color: var(--primary-text);
      color: var(--background);
    }

    .btn-secondary {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--border);
      background-color: var(--background);
      color: var(--primary-text);
    }

    .btn-ghost {
      background: transparent;
      border: none;
      color: var(--secondary-text);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .font-mono { font-family: monospace; }
    .text-xxs { font-size: 9px; }

    @media (max-width: 800px) {
      .quotes-modal-box, .payment-modal-box, .receipt-modal-box, .tracking-modal-box, .certificate-modal-box {
        width: 100%;
      }
      .quote-context-card {
        grid-template-columns: 1fr;
      }
      .cert-parties-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class OrdersComponent implements OnInit {
  orderService = inject(OrderService);
  authService = inject(AuthService);
  escrowService = inject(EscrowService);
  transportService = inject(TransportService);
  agriPayService = inject(AgriPayService);
  i18nService = inject(I18nService);

  searchFilter = '';
  selectedStatusTab: 'ALL' | 'ACTIVE' | 'COMPLETED' = 'ALL';

  // Active Modals State
  selectedOrderForQuotes?: Order;
  selectedOrderForPayment?: Order;
  selectedReceipt?: any;
  selectedOrderForPod?: Order;
  selectedOrderForTracking?: Order;
  selectedOrderForCertificate?: Order;
  certificateData?: EscrowSecurityCertificate;

  selectedPaymentMethod = 'AgriPay Instant UPI';
  activeBookingQuotations: TransportQuotation[] = [];

  Math = Math;

  totalEscrowHeld = computed(() => {
    return this.orderService.orders().reduce((sum, o) => {
      const residue = (o.pricePerTon || 2000) * (o.quantityTons || 50);
      return sum + residue + (o.transportCost || 0);
    }, 0);
  });

  totalFreightPaid = computed(() => {
    return this.orderService.orders().reduce((sum, o) => {
      return sum + (o.transportCost || 0);
    }, 0);
  });

  ngOnInit(): void {
    // Refresh 3PL transport requests to get live quotes
    this.transportService.fetchTransportRequests().subscribe();
  }

  isBuyer(): boolean {
    return this.authService.currentUser()?.role === 'buyer' || this.authService.currentUser()?.role === 'admin';
  }

  filteredOrders() {
    const q = this.searchFilter.toLowerCase().trim();
    const tab = this.selectedStatusTab;

    return this.orderService.orders().filter(o => {
      if (tab === 'ACTIVE' && o.status === 'Delivered') return false;
      if (tab === 'COMPLETED' && o.status !== 'Delivered') return false;
      if (q) {
        const matchesId = o.id.toLowerCase().includes(q);
        const matchesVault = (o.escrowVaultId || '').toLowerCase().includes(q);
        const matchesBuyer = o.buyerName.toLowerCase().includes(q);
        const matchesSeller = o.sellerName.toLowerCase().includes(q);
        const matchesCrop = o.cropType.toLowerCase().includes(q);
        if (!matchesId && !matchesVault && !matchesBuyer && !matchesSeller && !matchesCrop) return false;
      }
      return true;
    });
  }

  getResidueCost(order: Order): number {
    return (order.pricePerTon || 2000) * (order.quantityTons || 50);
  }

  getTotalAmount(order: Order): number {
    const res = this.getResidueCost(order);
    const transport = order.transportCost || 0;
    return res + transport;
  }

  getEscrowBadgeLabel(status: string): string {
    switch (status) {
      case 'held_in_vault': return '🔒 Escrow Locked';
      case 'inspection_passed': return 'Weighbridge Passed';
      case 'released_to_seller': return '100% Settled';
      case 'refunded': return 'Refunded';
      default: return 'Escrow Protected';
    }
  }

  getQuotesCount(order: Order): number {
    const booking = this.transportService.transportRequests().find(b => b.orderId === order.id);
    return booking && booking.quotations ? booking.quotations.length : 1;
  }

  // Open 3PL Quotes Modal
  openQuotesModal(order: Order): void {
    this.selectedOrderForQuotes = order;
    const booking = this.transportService.transportRequests().find(b => b.orderId === order.id);
    if (booking && booking.quotations && booking.quotations.length > 0) {
      this.activeBookingQuotations = booking.quotations;
    } else {
      // Provide simulated real carrier bids for demo & live testing
      this.activeBookingQuotations = [
        {
          id: `QT-${Date.now()}-1`,
          transporterId: 'TRP-1',
          transporterName: 'VRL AgriLogistics Express',
          transporterPhone: '+91 94481 00223',
          transporterRating: 4.9,
          vehicleType: 'Eicher 8T Heavy Hauler',
          vehicleCapacityTonnes: 8,
          quoteAmount: Math.round((order.distanceKm || 45) * 52 * Math.ceil(order.quantityTons / 8)),
          breakdown: {
            baseFreight: Math.round((order.distanceKm || 45) * 40 * Math.ceil(order.quantityTons / 8)),
            fuelSurcharge: Math.round((order.distanceKm || 45) * 8 * Math.ceil(order.quantityTons / 8)),
            tolls: 800,
            loadingUnloadingHandling: 1200
          },
          estimatedDays: 2,
          validUntil: 'Tomorrow',
          status: 'pending',
          submittedAt: '10 mins ago',
          notes: 'Specialized hydraulic tipper for loose stubble and compact residue bales.'
        },
        {
          id: `QT-${Date.now()}-2`,
          transporterId: 'TRP-2',
          transporterName: 'Kaveri Green Transways',
          transporterPhone: '+91 98862 33441',
          transporterRating: 4.7,
          vehicleType: 'Taurus 16T Multi-Axle',
          vehicleCapacityTonnes: 16,
          quoteAmount: Math.round((order.distanceKm || 45) * 48 * Math.ceil(order.quantityTons / 16)),
          breakdown: {
            baseFreight: Math.round((order.distanceKm || 45) * 36 * Math.ceil(order.quantityTons / 16)),
            fuelSurcharge: Math.round((order.distanceKm || 45) * 8 * Math.ceil(order.quantityTons / 16)),
            tolls: 1000,
            loadingUnloadingHandling: 1500
          },
          estimatedDays: 2,
          validUntil: 'Today 8 PM',
          status: 'pending',
          submittedAt: '25 mins ago',
          notes: 'High-cube tarpaulin protected body to prevent road littering.'
        }
      ];
    }
  }

  generateSimulatedQuote(order: Order): void {
    const newQuote: TransportQuotation = {
      id: `QT-${Date.now()}`,
      transporterId: 'TRP-NEW',
      transporterName: 'Southern Biomass Transport Hub',
      transporterPhone: '+91 97412 88990',
      transporterRating: 4.8,
      vehicleType: 'Trailer 28T High Cube',
      vehicleCapacityTonnes: 28,
      quoteAmount: Math.round((order.distanceKm || 40) * 42 * Math.ceil(order.quantityTons / 28)),
      breakdown: {
        baseFreight: Math.round((order.distanceKm || 40) * 32 * Math.ceil(order.quantityTons / 28)),
        fuelSurcharge: 1200,
        tolls: 1000,
        loadingUnloadingHandling: 2000
      },
      estimatedDays: 1,
      validUntil: '24 hours',
      status: 'pending',
      submittedAt: 'Just now',
      notes: 'Direct farm gate baler pickup with hydraulic unloading'
    };
    this.activeBookingQuotations = [newQuote, ...this.activeBookingQuotations];
  }

  approveAndLockFreight(order: Order, quote: TransportQuotation): void {
    this.orderService.updateOrderFreight(order.id, quote);
    this.selectedOrderForQuotes = undefined;
    alert(`3PL Freight approved at ₹${quote.quoteAmount.toLocaleString('en-IN')}. Carrier ${quote.transporterName} locked! Farmer pays ₹0.`);
  }

  // Open AgriPay Checkout Modal
  openAgriPayModal(order: Order): void {
    this.selectedOrderForPayment = order;
  }

  executeAgriPayCheckout(order: Order): void {
    const residue = this.getResidueCost(order);
    const transport = order.transportCost || 18500;
    const total = residue + transport;

    const dummyTransactionId = `AGRIPAY-TXN-${Date.now().toString().slice(-6)}`;
    const vaultId = order.escrowVaultId || `ESC-VAULT-${order.id.slice(-4)}`;

    this.agriPayService.launchRazorpayCheckout({
      orderId: order.id,
      transactionId: dummyTransactionId,
      razorpayOrderId: `rzp_order_${Date.now().toString().slice(-8)}`,
      amount: total,
      buyerName: order.buyerName,
      keyId: 'rzp_test_AgriMech123'
    }, (receipt: AgriPayReceipt) => {
      this.orderService.markOrderPaid(order.id, {
        transactionId: dummyTransactionId,
        paymentMethod: this.selectedPaymentMethod,
        escrowVaultId: vaultId
      });
      this.selectedOrderForPayment = undefined;
      this.selectedReceipt = receipt;
    }, () => {
      // Fallback direct success
      this.orderService.markOrderPaid(order.id, {
        transactionId: dummyTransactionId,
        paymentMethod: this.selectedPaymentMethod,
        escrowVaultId: vaultId
      });
      this.selectedOrderForPayment = undefined;
      this.selectedReceipt = {
        transactionId: dummyTransactionId,
        orderId: order.id,
        escrowVaultId: vaultId,
        amount: total,
        currency: 'INR',
        paymentMethod: this.selectedPaymentMethod,
        paidAt: new Date().toISOString(),
        buyerName: order.buyerName,
        sellerName: order.sellerName,
        transporterName: order.transporterName || '3PL Logistics Partner',
        breakdown: {
          residueCost: residue,
          transportCost: transport,
          platformCommissionResidue: Math.round(residue * 0.02),
          platformCommissionTransport: Math.round(transport * 0.05),
          netFarmerPayout: Math.round(residue * 0.98),
          netTransporterPayout: Math.round(transport * 0.95),
          totalPayable: total
        }
      };
    });
  }

  viewAgriPayReceipt(order: Order): void {
    const residue = this.getResidueCost(order);
    const transport = order.transportCost || 18500;
    const total = residue + transport;

    this.selectedReceipt = {
      transactionId: order.paymentDetails?.transactionId || `TXN-${order.id.slice(-4)}`,
      orderId: order.id,
      escrowVaultId: order.escrowVaultId || 'ESC-VAULT-REAL',
      amount: total,
      currency: 'INR',
      paymentMethod: order.paymentDetails?.paymentMethod || 'AgriPay Secure UPI',
      paidAt: order.paymentDetails?.paidAt || new Date().toISOString(),
      buyerName: order.buyerName,
      sellerName: order.sellerName,
      transporterName: order.transporterName || 'Verified 3PL Carrier',
      breakdown: {
        residueCost: residue,
        transportCost: transport,
        platformCommissionResidue: Math.round(residue * 0.02),
        platformCommissionTransport: Math.round(transport * 0.05),
        netFarmerPayout: Math.round(residue * 0.98),
        netTransporterPayout: Math.round(transport * 0.95),
        totalPayable: total
      }
    };
  }

  openPodVerificationModal(order: Order): void {
    this.selectedOrderForPod = order;
  }

  confirmPodVerification(order: Order): void {
    this.orderService.settleOrderDelivery(order.id);
    this.selectedOrderForPod = undefined;
    alert(`Weighbridge tare/gross verified! Consignment completed. Farmer receives 98% (₹${Math.round(this.getResidueCost(order) * 0.98).toLocaleString('en-IN')}) and 3PL Transporter receives 95% (₹${Math.round((order.transportCost || 18500) * 0.95).toLocaleString('en-IN')}).`);
  }

  getCompletedMilestonesCount(order: Order): number {
    if (!order.trackingMilestones) return 0;
    return order.trackingMilestones.filter(m => m.completed).length;
  }

  openTrackingModal(order: Order): void {
    this.selectedOrderForTracking = order;
  }

  openCertificateModal(order: Order): void {
    this.selectedOrderForCertificate = order;
    this.certificateData = this.escrowService.getSecurityCertificate(order);
  }

  openCertificateFromTracking(order: Order): void {
    this.selectedOrderForTracking = undefined;
    this.openCertificateModal(order);
  }

  printReceipt(): void {
    window.print();
  }
}
