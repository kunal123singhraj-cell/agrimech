import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NegotiationService } from '../../core/services/negotiation.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService, LanguageOption } from '../../core/services/i18n.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ChatMessage, I18nLanguage, PriceOffer } from '../../core/models/marketplace.model';

@Component({
  selector: 'app-negotiations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, BadgeComponent],
  template: `
    <div class="negotiation-desk">
      <!-- Threads Sidebar -->
      <aside class="threads-sidebar">
        <div class="threads-header">
          <div>
            <h2 class="threads-title">Negotiation Centre</h2>
            <span class="threads-subtitle">Direct Farmer-Buyer Desk</span>
          </div>
          <span class="threads-count font-mono">{{ negotiationService.threads().length }} active</span>
        </div>

        <div class="threads-list">
          <div *ngIf="negotiationService.threads().length === 0" class="empty-threads-notice">
            <span class="empty-threads-icon">💬</span>
            <p>No active trade discussions</p>
            <span class="empty-threads-hint">Contact a supplier in the Marketplace to begin direct negotiation.</span>
          </div>

          <div
            *ngFor="let thread of negotiationService.threads()"
            class="thread-card"
            [class.active-thread]="thread.id === negotiationService.activeThreadId()"
            (click)="selectThread(thread.id)"
          >
            <div class="thread-top">
              <span class="thread-partner">{{ thread.counterpartyName }}</span>
              <span class="thread-time font-mono text-xs">{{ thread.lastUpdated }}</span>
            </div>

            <div class="thread-crop-line">
              <span class="thread-crop">{{ thread.cropType }}</span>
              <span class="thread-dist font-mono">📍 {{ thread.distanceKm || 35 }} km</span>
            </div>

            <div class="thread-bottom">
              <p class="thread-preview">{{ thread.lastMessage }}</p>
              <app-badge [variant]="thread.status === 'accepted' ? 'solid' : 'default'">
                {{ thread.status | titlecase }}
              </app-badge>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Chat Area -->
      <main class="chat-main" *ngIf="currentThread">
        <!-- Chat Header with Global Chat Language Selector -->
        <header class="chat-header">
          <div class="chat-header-info">
            <div class="partner-line">
              <h3 class="partner-name">{{ currentThread.counterpartyName }}</h3>
              <span class="partner-role font-mono">({{ currentThread.counterpartyRole }})</span>
              <app-badge [variant]="currentThread.status === 'accepted' ? 'solid' : 'default'">
                {{ currentThread.status | uppercase }}
              </app-badge>
            </div>

            <div class="listing-ref">
              <span>Commodity: <strong>{{ currentThread.cropType }}</strong> &bull; Volume: <strong>{{ currentThread.quantityTons }} Tonnes</strong> &bull; Base Asking: <strong>₹{{ currentThread.askingPricePerTon.toLocaleString('en-IN') }}/t</strong></span>
            </div>

            <div class="proximity-ref">
              <span class="prox-badge font-mono font-bold">📍 {{ currentThread.distanceKm || 35 }} km radius</span>
              <span class="text-secondary">&bull; Destination: <strong>{{ currentThread.buyerLocation || 'Processing Facility' }}</strong></span>
              <span class="text-secondary" *ngIf="currentThread.transitTime">&bull; {{ currentThread.transitTime }}</span>
              <span class="text-secondary" *ngIf="currentThread.estimatedFreightPerTon">&bull; Est. Freight: ~₹{{ currentThread.estimatedFreightPerTon }}/t (100% Buyer Paid)</span>
            </div>
          </div>

          <!-- Translation Language Switcher & Offer Action -->
          <div class="header-controls">
            <!-- Multilingual Selector -->
            <div class="chat-lang-box" title="Messages are auto-translated into this language">
              <span class="chat-lang-label font-mono">
                <app-icon name="globe" [size]="12"></app-icon>
                <span>Translate Chat to:</span>
              </span>
              <select
                class="chat-lang-select font-mono"
                [ngModel]="currentChatLanguage"
                (ngModelChange)="onChatLanguageChange($event)"
              >
                <option *ngFor="let l of i18nService.languages" [value]="l.code">
                  {{ l.flag }} {{ l.nativeName }} ({{ l.name }})
                </option>
              </select>
            </div>

            <button
              class="btn-propose-offer"
              (click)="isCounterOfferBoxOpen.set(!isCounterOfferBoxOpen())"
            >
              <app-icon name="scale" [size]="14"></app-icon>
              <span>Custom Price Offer</span>
            </button>
          </div>
        </header>

        <!-- Fast Counter-Offer Price Chips Strip -->
        <div class="price-chips-bar">
          <div class="chips-label-group">
            <span class="chips-title font-mono font-bold">⚡ COUNTER-OFFER PRICE CHIPS:</span>
            <span class="chips-subtitle">Click to propose immediate adjusted rate</span>
          </div>
          <div class="chips-list">
            <button
              type="button"
              class="price-chip chip-up"
              (click)="applyPriceDelta(50)"
              title="Increase price by ₹50/tonne"
            >
              + ₹50 / Ton
            </button>
            <button
              type="button"
              class="price-chip chip-down"
              (click)="applyPriceDelta(-50)"
              title="Decrease price by ₹50/tonne"
            >
              - ₹50 / Ton
            </button>
            <button
              type="button"
              class="price-chip chip-up"
              (click)="applyPriceDelta(100)"
              title="Increase price by ₹100/tonne"
            >
              + ₹100 / Ton
            </button>
            <button
              type="button"
              class="price-chip chip-down"
              (click)="applyPriceDelta(-100)"
              title="Decrease price by ₹100/tonne"
            >
              - ₹100 / Ton
            </button>
            <button
              type="button"
              class="price-chip chip-custom"
              (click)="isCounterOfferBoxOpen.set(true)"
            >
              <app-icon name="scale" [size]="12"></app-icon>
              <span>Custom Rate</span>
            </button>
            <button
              *ngIf="getPendingOffer()"
              type="button"
              class="price-chip chip-accept"
              (click)="acceptPendingOffer()"
            >
              <app-icon name="check" [size]="12"></app-icon>
              <span>Accept Offer (₹{{ getPendingOffer()?.offeredPricePerTon }}/t)</span>
            </button>
            <button
              *ngIf="getPendingOffer()"
              type="button"
              class="price-chip chip-reject"
              (click)="declinePendingOffer()"
            >
              <app-icon name="x" [size]="12"></app-icon>
              <span>Reject</span>
            </button>
          </div>
        </div>

        <!-- Propose Price Offer Custom Drawer -->
        <div *ngIf="isCounterOfferBoxOpen()" class="counter-offer-drawer">
          <div class="drawer-header">
            <div class="drawer-title-group">
              <span class="drawer-title">Propose Formal Counter-Offer</span>
              <span class="drawer-sub text-secondary text-xs">Direct legally-binding price agreement with counterparty</span>
            </div>
            <button class="btn-ghost btn-sm" (click)="isCounterOfferBoxOpen.set(false)">
              <app-icon name="x" [size]="14"></app-icon>
            </button>
          </div>

          <div class="drawer-grid">
            <div class="drawer-field">
              <label>Offered Rate (₹ / Tonne)</label>
              <input
                type="number"
                min="500"
                step="50"
                [(ngModel)]="counterRate"
                class="font-mono font-bold"
              />
            </div>
            <div class="drawer-field">
              <label>Contracted Volume (Tonnes)</label>
              <input
                type="number"
                min="5"
                [(ngModel)]="counterQuantity"
                class="font-mono font-bold"
              />
            </div>
            <div class="drawer-field">
              <label>Total Agricultural Residue Value</label>
              <div class="computed-total font-mono">₹{{ (counterRate * counterQuantity).toLocaleString('en-IN') }}</div>
              <span class="text-xs text-secondary">Excludes 100% buyer-paid 3PL freight</span>
            </div>
          </div>

          <div class="drawer-field">
            <label>Specific Terms / Settlement Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Weighbridge moisture clearance &lt;12%, baled loading ready within 48h..."
              [(ngModel)]="counterNote"
            />
          </div>

          <div class="drawer-footer">
            <button class="btn-secondary btn-sm" (click)="isCounterOfferBoxOpen.set(false)">Cancel</button>
            <button class="btn-primary btn-sm" (click)="submitCounterOffer()">Submit Offer Chip to Chat</button>
          </div>
        </div>

        <!-- Messages Feed -->
        <div class="messages-container" #scrollArea>
          <div *ngFor="let msg of currentThread.messages" class="message-wrapper" [class.my-message]="msg.sender === 'me'">
            <!-- Author & Metadata Line -->
            <div class="message-author">
              <span class="author-name">{{ msg.senderName }}</span>
              <span class="message-timestamp font-mono text-xs">{{ msg.timestamp }}</span>
              <!-- Language Detection Badge -->
              <span class="lang-detection-pill font-mono" *ngIf="msg.detectedLanguage || msg.originalLanguage">
                <app-icon name="globe" [size]="10"></app-icon>
                <span>{{ getLanguageName(msg.detectedLanguage || msg.originalLanguage) }}</span>
              </span>
            </div>

            <!-- Message Bubble -->
            <div class="message-bubble" [class.system-bubble]="msg.senderName === 'System'">
              <!-- Main Message Body (Translated or Original) -->
              <p class="message-text">
                {{ getDisplayMessage(msg) }}
              </p>

              <!-- Translation Details & Toggle Strip (Only if not a system message) -->
              <div class="translation-meta-strip" *ngIf="msg.senderName !== 'System' && hasTranslation(msg)">
                <div class="trans-indicator text-xs font-mono">
                  <span *ngIf="isShowingOriginal(msg.id)" class="text-secondary">
                    📄 Original ({{ getLanguageName(msg.detectedLanguage || msg.originalLanguage) }})
                  </span>
                  <span *ngIf="!isShowingOriginal(msg.id)" class="trans-active-badge">
                    🌐 Translated to {{ getLanguageName(currentChatLanguage) }}
                  </span>
                </div>

                <button
                  type="button"
                  class="btn-toggle-translation"
                  (click)="toggleShowOriginal(msg.id)"
                >
                  <app-icon [name]="isShowingOriginal(msg.id) ? 'globe' : 'file-text'" [size]="11"></app-icon>
                  <span>{{ isShowingOriginal(msg.id) ? 'Show Translation' : 'Show Original' }}</span>
                </button>
              </div>

              <!-- Price Offer Chip Embedded in Message -->
              <div *ngIf="msg.offer" class="offer-chip" [class.offer-accepted]="msg.offer.status === 'accepted'">
                <div class="offer-chip-top">
                  <div class="offer-chip-badge-group">
                    <span class="offer-badge font-mono">OFFICIAL OFFER CHIP #{{ msg.offer.id }}</span>
                    <span class="offer-note-tag font-mono text-xs">Direct Trade Terms</span>
                  </div>
                  <app-badge [variant]="msg.offer.status === 'accepted' ? 'solid' : 'default'">
                    {{ msg.offer.status | uppercase }}
                  </app-badge>
                </div>

                <div class="offer-details">
                  <div class="offer-rate-row">
                    <span class="offer-rate-val font-mono">₹{{ msg.offer.offeredPricePerTon.toLocaleString('en-IN') }}</span>
                    <span class="offer-rate-unit">/ metric tonne for <strong>{{ msg.offer.quantityTons }} Tonnes</strong></span>
                  </div>
                  <div class="offer-total-row font-mono">
                    Total Contract Value: <strong>₹{{ msg.offer.totalAmount.toLocaleString('en-IN') }}</strong>
                  </div>
                  <div *ngIf="msg.offer.note" class="offer-note">
                    "{{ msg.offer.note }}"
                  </div>
                </div>

                <!-- Offer Action Buttons (When Pending) -->
                <div *ngIf="msg.offer.status === 'pending'" class="offer-actions">
                  <button class="btn-primary btn-sm btn-offer-accept" (click)="acceptOffer(msg.id)">
                    <app-icon name="check" [size]="13"></app-icon>
                    <span>Accept Offer</span>
                  </button>

                  <button class="btn-secondary btn-sm" (click)="applyPriceDelta(50)">
                    <span>+₹50</span>
                  </button>

                  <button class="btn-secondary btn-sm" (click)="applyPriceDelta(-50)">
                    <span>-₹50</span>
                  </button>

                  <button class="btn-secondary btn-sm" (click)="openCounterBox(msg.offer.offeredPricePerTon, msg.offer.quantityTons)">
                    <app-icon name="scale" [size]="12"></app-icon>
                    <span>Counter</span>
                  </button>

                  <button class="btn-ghost btn-sm btn-offer-decline" (click)="declineOffer(msg.id)">
                    <app-icon name="x" [size]="12"></app-icon>
                    <span>Decline</span>
                  </button>
                </div>

                <!-- Accepted Stamp -->
                <div *ngIf="msg.offer.status === 'accepted'" class="offer-confirmed-strip">
                  <app-icon name="check" [size]="14"></app-icon>
                  <span>Offer Accepted! Consignment order generated automatically & broadcasted to 3PL logistics network.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Input Area -->
        <footer class="chat-input-area">
          <form class="chat-input-form" (ngSubmit)="sendMessage()">
            <div class="input-wrapper">
              <input
                type="text"
                placeholder="Type negotiation terms in English, Hindi, Kannada, Tamil, Telugu, Marathi, Bengali, Malayalam..."
                [(ngModel)]="messageText"
                name="messageText"
                class="chat-text-input"
                autocomplete="off"
              />
              <span class="input-lang-indicator font-mono text-xs">
                🌐 Auto-detect & 8-language broadcast
              </span>
            </div>

            <button
              type="submit"
              class="btn-primary chat-send-btn"
              [disabled]="!messageText.trim() || isSendingMessage"
            >
              <app-icon name="send" [size]="14"></app-icon>
              <span>{{ isSendingMessage ? 'Translating...' : 'Send' }}</span>
            </button>
          </form>
        </footer>
      </main>

      <!-- Empty State -->
      <main class="chat-main empty-chat-main" *ngIf="!currentThread">
        <span class="empty-icon">💬</span>
        <h3 class="empty-title">AgriMech Multilingual Negotiation Centre</h3>
        <p class="empty-desc">
          Communicate directly across 8 Indian languages (Hindi, Kannada, Tamil, Telugu, Bengali, Marathi, Malayalam, English) with instant script detection and counter-offer price chips.
        </p>
        <a routerLink="/suppliers" class="btn-primary btn-sm">Explore Biomass Marketplace</a>
      </main>
    </div>
  `,
  styles: [`
    .negotiation-desk {
      display: grid;
      grid-template-columns: 320px 1fr;
      border: 1px solid var(--border);
      border-radius: 8px;
      height: calc(100vh - 120px);
      min-height: 600px;
      background-color: var(--background);
      overflow: hidden;
    }

    .threads-sidebar {
      border-right: 1px solid var(--border);
      background-color: var(--sidebar-background);
      display: flex;
      flex-direction: column;
    }

    .threads-header {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .threads-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--primary-text);
      margin: 0;
    }

    .threads-subtitle {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .threads-count {
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 999px;
      background-color: var(--card-background);
      border: 1px solid var(--border);
      color: var(--secondary-text);
    }

    .threads-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .empty-threads-notice {
      padding: 32px 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .empty-threads-icon {
      font-size: 32px;
    }

    .empty-threads-hint {
      font-size: 11px;
      color: var(--secondary-text);
      max-width: 200px;
    }

    .thread-card {
      padding: 11px 12px;
      border-radius: 6px;
      border: 1px solid transparent;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: background-color 120ms ease;
    }

    .thread-card:hover {
      background-color: var(--hover-background);
    }

    .thread-card.active-thread {
      background-color: var(--background);
      border-color: var(--border);
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .thread-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .thread-partner {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text);
    }

    .thread-crop-line {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--secondary-text);
    }

    .thread-crop {
      font-weight: 500;
      color: var(--primary-text);
    }

    .thread-dist {
      font-size: 10px;
      color: var(--secondary-text);
    }

    .thread-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-top: 2px;
    }

    .thread-preview {
      font-size: 11px;
      color: var(--secondary-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      margin: 0;
    }

    /* Main Chat Layout */
    .chat-main {
      display: flex;
      flex-direction: column;
      background-color: var(--background);
      height: 100%;
      overflow: hidden;
    }

    .chat-header {
      padding: 12px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background-color: var(--background);
      flex-wrap: wrap;
    }

    .partner-line {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .partner-name {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
    }

    .partner-role {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .listing-ref {
      font-size: 12px;
      color: var(--secondary-text);
      margin-top: 3px;
    }

    .proximity-ref {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      margin-top: 4px;
      flex-wrap: wrap;
    }

    .prox-badge {
      font-size: 10px;
      padding: 2px 6px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--primary-text);
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .chat-lang-box {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background-color: var(--sidebar-background);
    }

    .chat-lang-label {
      font-size: 10px;
      color: var(--secondary-text);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .chat-lang-select {
      background: transparent;
      border: none;
      font-size: 11px;
      font-weight: 600;
      color: var(--primary-text);
      outline: none;
      cursor: pointer;
    }

    .btn-propose-offer {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background-color: var(--background);
      color: var(--primary-text);
      transition: all 0.15s ease;
    }

    .btn-propose-offer:hover {
      background-color: var(--hover-background);
    }

    /* Fast Price Chips Bar */
    .price-chips-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 20px;
      border-bottom: 1px solid var(--border);
      background-color: var(--sidebar-background);
      flex-wrap: wrap;
    }

    .chips-label-group {
      display: flex;
      flex-direction: column;
    }

    .chips-title {
      font-size: 10px;
      letter-spacing: 0.04em;
      color: var(--primary-text);
    }

    .chips-subtitle {
      font-size: 10px;
      color: var(--secondary-text);
    }

    .chips-list {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .price-chip {
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      font-family: monospace;
      cursor: pointer;
      border: 1px solid var(--border);
      background-color: var(--background);
      color: var(--primary-text);
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .price-chip:hover {
      transform: translateY(-1px);
    }

    .chip-up {
      border-color: #2e7d32;
      color: #2e7d32;
      background-color: rgba(46, 125, 50, 0.08);
    }

    .chip-down {
      border-color: #c62828;
      color: #c62828;
      background-color: rgba(198, 40, 40, 0.08);
    }

    .chip-custom {
      background-color: var(--sidebar-background);
      border-color: var(--border);
    }

    .chip-accept {
      background-color: #163320;
      color: #ffffff;
      border-color: #163320;
    }

    .chip-reject {
      border-color: #c62828;
      color: #c62828;
    }

    /* Counter Offer Drawer */
    .counter-offer-drawer {
      border-bottom: 1px solid var(--border);
      background-color: var(--sidebar-background);
      padding: 14px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .drawer-title-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .drawer-title {
      font-size: 13px;
      font-weight: 700;
    }

    .drawer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }

    .drawer-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .drawer-field label {
      font-size: 11px;
      font-weight: 500;
      color: var(--secondary-text);
    }

    .drawer-field input {
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background-color: var(--background);
      color: var(--primary-text);
      font-size: 13px;
    }

    .computed-total {
      font-size: 16px;
      font-weight: 700;
      padding: 6px 0;
      color: var(--primary-text);
    }

    .drawer-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    /* Messages Feed */
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message-wrapper {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-width: 82%;
    }

    .message-wrapper.my-message {
      align-self: flex-end;
      align-items: flex-end;
    }

    .message-author {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: var(--secondary-text);
      padding: 0 4px;
    }

    .author-name {
      font-weight: 600;
      color: var(--primary-text);
    }

    .lang-detection-pill {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 4px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      color: var(--secondary-text);
    }

    .message-bubble {
      padding: 12px 16px;
      border-radius: 8px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      color: var(--primary-text);
      font-size: 13px;
      line-height: 1.5;
    }

    .my-message .message-bubble {
      background-color: var(--background);
      border-color: var(--border);
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }

    .system-bubble {
      font-style: italic;
      background-color: var(--hover-background);
      font-size: 12px;
    }

    .message-text {
      margin: 0;
      white-space: pre-wrap;
    }

    /* Translation Meta Strip */
    .translation-meta-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px dashed var(--border);
    }

    .trans-active-badge {
      font-size: 10px;
      color: #2e7d32;
      font-weight: 600;
    }

    .btn-toggle-translation {
      background: transparent;
      border: none;
      font-size: 10px;
      font-family: monospace;
      color: var(--secondary-text);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 2px 4px;
      border-radius: 3px;
    }

    .btn-toggle-translation:hover {
      color: var(--primary-text);
      background-color: var(--hover-background);
    }

    /* Offer Chip Details */
    .offer-chip {
      margin-top: 10px;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 14px;
      background-color: var(--background);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .offer-chip-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .offer-chip-badge-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .offer-badge {
      font-size: 10px;
      font-weight: 700;
      color: var(--secondary-text);
    }

    .offer-note-tag {
      font-size: 10px;
      color: var(--secondary-text);
    }

    .offer-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .offer-rate-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .offer-rate-val {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-text);
    }

    .offer-rate-unit {
      font-size: 12px;
      color: var(--secondary-text);
    }

    .offer-total-row {
      font-size: 12px;
      color: var(--secondary-text);
    }

    .offer-note {
      font-size: 12px;
      font-style: italic;
      color: var(--secondary-text);
      border-left: 2px solid var(--border);
      padding-left: 8px;
      margin-top: 4px;
    }

    .offer-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--border);
      flex-wrap: wrap;
    }

    .btn-offer-accept {
      background-color: #163320;
      color: #ffffff;
    }

    .btn-offer-decline {
      color: #c62828;
    }

    .offer-confirmed-strip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      border-radius: 6px;
      background-color: rgba(46, 125, 50, 0.1);
      color: #2e7d32;
      font-size: 11px;
      font-weight: 600;
    }

    /* Input Footer */
    .chat-input-area {
      padding: 12px 20px;
      border-top: 1px solid var(--border);
      background-color: var(--background);
    }

    .chat-input-form {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .input-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .chat-text-input {
      width: 100%;
      padding: 10px 14px;
      font-size: 13px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background-color: var(--background);
      color: var(--primary-text);
      outline: none;
    }

    .chat-text-input:focus {
      border-color: var(--primary-text);
    }

    .input-lang-indicator {
      color: var(--secondary-text);
      padding-left: 2px;
    }

    .chat-send-btn {
      padding: 10px 20px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid var(--primary-text);
      background-color: var(--primary-text);
      color: var(--background);
    }

    .chat-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Buttons */
    .btn-primary {
      padding: 6px 14px;
      border-radius: 6px;
      border: 1px solid var(--primary-text);
      background-color: var(--primary-text);
      color: var(--background);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-secondary {
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background-color: var(--background);
      color: var(--primary-text);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
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

    .btn-ghost:hover {
      color: var(--primary-text);
    }

    .empty-chat-main {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }

    .empty-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .empty-desc {
      font-size: 13px;
      color: var(--secondary-text);
      max-width: 440px;
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .font-mono {
      font-family: monospace;
    }

    @media (max-width: 800px) {
      .negotiation-desk {
        grid-template-columns: 1fr;
      }
      .threads-sidebar {
        display: none;
      }
      .drawer-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class NegotiationsComponent implements OnInit {
  negotiationService = inject(NegotiationService);
  authService = inject(AuthService);
  i18nService = inject(I18nService);

  messageText = '';
  isSendingMessage = false;
  isCounterOfferBoxOpen = signal<boolean>(false);
  counterRate: number = 2050;
  counterQuantity: number = 85;
  counterNote: string = '';

  // Track "Show Original" state per message ID
  showOriginalMap: Record<string, boolean> = {};

  get currentThread() {
    return this.negotiationService.activeThread();
  }

  get currentChatLanguage(): I18nLanguage {
    return this.i18nService.chatLanguage();
  }

  ngOnInit(): void {
    // Check if there are active threads and sync initial counter values
    if (this.currentThread) {
      this.counterRate = this.currentThread.askingPricePerTon;
      this.counterQuantity = this.currentThread.quantityTons;
      this.translatePendingMessages();
    }
  }

  selectThread(id: string): void {
    this.negotiationService.selectThread(id);
    if (this.currentThread) {
      this.counterRate = this.currentThread.askingPricePerTon;
      this.counterQuantity = this.currentThread.quantityTons;
      this.translatePendingMessages();
    }
  }

  onChatLanguageChange(lang: I18nLanguage): void {
    this.i18nService.setChatLanguage(lang);
    this.translatePendingMessages();
  }

  getLanguageName(code?: string): string {
    if (!code) return 'English';
    const opt = this.i18nService.languages.find(l => l.code === code);
    return opt ? `${opt.flag} ${opt.name}` : code.toUpperCase();
  }

  hasTranslation(msg: ChatMessage): boolean {
    const targetLang = this.currentChatLanguage;
    return !!(msg.translations && msg.translations[targetLang] && msg.translations[targetLang] !== msg.text);
  }

  isShowingOriginal(msgId: string): boolean {
    return !!this.showOriginalMap[msgId];
  }

  toggleShowOriginal(msgId: string): void {
    this.showOriginalMap[msgId] = !this.showOriginalMap[msgId];
  }

  getDisplayMessage(msg: ChatMessage): string {
    if (this.isShowingOriginal(msg.id)) {
      return msg.text;
    }
    const targetLang = this.currentChatLanguage;
    if (msg.translations && msg.translations[targetLang]) {
      return msg.translations[targetLang];
    }
    return msg.text;
  }

  getPendingOffer(): PriceOffer | undefined {
    if (!this.currentThread || !this.currentThread.messages) return undefined;
    for (let i = this.currentThread.messages.length - 1; i >= 0; i--) {
      const offer = this.currentThread.messages[i].offer;
      if (offer && offer.status === 'pending') {
        return offer;
      }
    }
    return undefined;
  }

  async sendMessage(): Promise<void> {
    const text = this.messageText.trim();
    if (!text || this.isSendingMessage) return;

    this.isSendingMessage = true;
    this.messageText = '';

    const senderName = this.authService.currentUser()?.name || 'You';

    try {
      // 1. Send optimistic message to local signal
      this.negotiationService.sendMessage(text, senderName);

      // 2. Fetch full 8-language translations and language detection from backend
      const transResult = await this.i18nService.translateFullMessage(text);

      const targetThread = this.currentThread;
      if (targetThread && targetThread.messages.length > 0) {
        const lastMsg = targetThread.messages[targetThread.messages.length - 1];
        if (lastMsg) {
          this.negotiationService.updateMessageTranslations(
            lastMsg.id,
            transResult.detectedLanguage,
            transResult.translations
          );
        }
      }
    } finally {
      this.isSendingMessage = false;
    }
  }

  private async translatePendingMessages(): Promise<void> {
    if (!this.currentThread) return;
    const messages = this.currentThread.messages;
    for (const msg of messages) {
      if (msg.senderName !== 'System' && (!msg.translations || Object.keys(msg.translations).length === 0)) {
        try {
          const res = await this.i18nService.translateFullMessage(msg.text);
          this.negotiationService.updateMessageTranslations(msg.id, res.detectedLanguage, res.translations);
        } catch {}
      }
    }
  }

  applyPriceDelta(delta: number): void {
    const pending = this.getPendingOffer();
    const baseRate = pending ? pending.offeredPricePerTon : (this.currentThread?.askingPricePerTon || 2000);
    const newRate = Math.max(500, baseRate + delta);
    const qty = pending ? pending.quantityTons : (this.currentThread?.quantityTons || 50);

    const deltaSign = delta > 0 ? `+₹${delta}` : `-₹${Math.abs(delta)}`;
    const note = `Quick Counter-Offer (${deltaSign}/Tonne adjustment)`;

    this.negotiationService.sendOffer(newRate, qty, note);
  }

  openCounterBox(suggestedRate: number, suggestedQty: number): void {
    this.counterRate = suggestedRate;
    this.counterQuantity = suggestedQty;
    this.isCounterOfferBoxOpen.set(true);
  }

  submitCounterOffer(): void {
    if (this.counterRate <= 0 || this.counterQuantity <= 0) return;
    this.negotiationService.sendOffer(this.counterRate, this.counterQuantity, this.counterNote);
    this.isCounterOfferBoxOpen.set(false);
    this.counterNote = '';
  }

  acceptOffer(messageId: string): void {
    this.negotiationService.acceptOffer(messageId);
  }

  acceptPendingOffer(): void {
    const pending = this.getPendingOffer();
    if (!pending || !this.currentThread) return;
    const msg = this.currentThread.messages.find(m => m.offer?.id === pending.id);
    if (msg) {
      this.negotiationService.acceptOffer(msg.id);
    }
  }

  declineOffer(messageId: string): void {
    this.negotiationService.declineOffer(messageId);
  }

  declinePendingOffer(): void {
    const pending = this.getPendingOffer();
    if (!pending || !this.currentThread) return;
    const msg = this.currentThread.messages.find(m => m.offer?.id === pending.id);
    if (msg) {
      this.negotiationService.declineOffer(msg.id);
    }
  }
}
