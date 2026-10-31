import { Component, inject, signal, computed, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { I18nService } from '../../../core/services/i18n.service';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../icon/icon.component';

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  category?: 'price' | 'logistics' | 'escrow' | 'listing' | 'general';
  quickActions?: { label: string; route?: string; prompt?: string }[];
}

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <!-- Floating Widget Container -->
    <div class="ai-widget-wrapper">
      <!-- Chat Window Dialog -->
      <div *ngIf="isOpen()" class="chat-window shadow-xl animate-fade-in" [class.maximized]="isMaximized()">
        <!-- Header -->
        <div class="chat-header">
          <div class="header-left">
            <div class="bot-avatar-box">
              <span class="bot-emoji">🤖</span>
              <span class="online-indicator-dot"></span>
            </div>
            <div class="header-info">
              <div class="bot-title-row">
                <span class="bot-name">{{ botName() }}</span>
                <span class="ai-tag">AI 2.0</span>
              </div>
              <span class="bot-subtext">{{ botSubtitle() }}</span>
            </div>
          </div>
          <div class="header-actions">
            <button
              type="button"
              class="icon-action-btn"
              (click)="clearHistory()"
              title="Clear chat / चैट साफ़ करें"
            >
              <app-icon name="trash" [size]="14"></app-icon>
            </button>
            <button
              type="button"
              class="icon-action-btn"
              (click)="toggleMaximize()"
              [title]="isMaximized() ? 'Restore size' : 'Expand window'"
            >
              <app-icon [name]="isMaximized() ? 'filter' : 'layers'" [size]="14"></app-icon>
            </button>
            <button
              type="button"
              class="icon-action-btn close-btn"
              (click)="toggleOpen()"
              title="Close chat / बंद करें"
            >
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>
        </div>

        <!-- Language Pill Banner -->
        <div class="active-lang-strip">
          <span class="lang-dot">🌐</span>
          <span class="lang-text">
            {{ langNotice() }} ({{ i18nService.currentLanguage().toUpperCase() }})
          </span>
        </div>

        <!-- Messages Feed -->
        <div class="messages-container" #scrollArea>
          <!-- Welcome Intro Card -->
          <div class="intro-bubble">
            <div class="intro-icon">🌾</div>
            <div class="intro-content">
              <h4>{{ introHeading() }}</h4>
              <p>{{ introDesc() }}</p>
            </div>
          </div>

          <!-- Chat History -->
          <div
            *ngFor="let msg of messages()"
            class="message-row"
            [class.user-row]="msg.sender === 'user'"
            [class.bot-row]="msg.sender === 'bot'"
          >
            <!-- Bot Avatar -->
            <div *ngIf="msg.sender === 'bot'" class="msg-avatar">
              🌾
            </div>

            <!-- Message Bubble -->
            <div class="msg-bubble" [class.user-bubble]="msg.sender === 'user'" [class.bot-bubble]="msg.sender === 'bot'">
              <div class="msg-body" [innerHTML]="formatMessage(msg.text)"></div>
              <div class="msg-meta">
                <span class="msg-time">{{ msg.timestamp }}</span>
                <span *ngIf="msg.sender === 'bot'" class="verified-tag">✓ AgriMech AI</span>
              </div>

              <!-- Quick Action Chips within Message -->
              <div *ngIf="msg.quickActions && msg.quickActions.length > 0" class="msg-action-chips">
                <ng-container *ngFor="let act of msg.quickActions">
                  <a
                    *ngIf="act.route"
                    [routerLink]="act.route"
                    (click)="toggleOpen()"
                    class="action-chip link-chip"
                  >
                    <span>{{ act.label }}</span>
                    <app-icon name="arrow-right" [size]="11"></app-icon>
                  </a>
                  <button
                    *ngIf="act.prompt"
                    type="button"
                    (click)="sendUserQuery(act.prompt)"
                    class="action-chip prompt-chip"
                  >
                    <span>{{ act.label }}</span>
                  </button>
                </ng-container>
              </div>
            </div>

            <!-- User Avatar -->
            <div *ngIf="msg.sender === 'user'" class="msg-avatar user-icon">
              {{ authService.currentUser()?.name?.substring(0, 1) || 'U' }}
            </div>
          </div>

          <!-- Typing Indicator -->
          <div *ngIf="isTyping()" class="message-row bot-row typing-row">
            <div class="msg-avatar">🌾</div>
            <div class="msg-bubble bot-bubble typing-bubble">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-hint">{{ typingHintText() }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Suggestions Carousel -->
        <div class="quick-chips-wrapper">
          <div class="chips-label">{{ suggestionsLabel() }}</div>
          <div class="chips-scroll">
            <button
              *ngFor="let chip of currentSuggestionChips()"
              type="button"
              class="quick-chip-btn"
              (click)="sendUserQuery(chip.query)"
            >
              <span>{{ chip.label }}</span>
            </button>
          </div>
        </div>

        <!-- Chat Input Form -->
        <form class="chat-input-bar" (submit)="onSubmit($event)">
          <input
            type="text"
            class="user-text-input"
            [(ngModel)]="userInput"
            name="userInput"
            [placeholder]="inputPlaceholder()"
            [disabled]="isTyping()"
            autocomplete="off"
          />
          <button
            type="submit"
            class="send-btn"
            [disabled]="!userInput.trim() || isTyping()"
            title="Send query / संदेश भेजें"
          >
            <app-icon name="send" [size]="15"></app-icon>
          </button>
        </form>
      </div>

      <!-- Floating Trigger Button (FAB) -->
      <button
        type="button"
        class="ai-fab-btn"
        [class.open-state]="isOpen()"
        (click)="toggleOpen()"
        title="Agri-Mitra AI Assistant / एग्री मित्र"
        aria-label="Open AI Assistant"
      >
        <span class="pulse-ring"></span>
        <div class="fab-inner">
          <span *ngIf="!isOpen()" class="fab-icon-symbol">🤖</span>
          <app-icon *ngIf="isOpen()" name="x" [size]="20"></app-icon>
        </div>
        <div *ngIf="!isOpen()" class="fab-pill-label">
          <span class="live-fab-dot"></span>
          <span class="fab-title-text">{{ fabLabel() }}</span>
        </div>
      </button>
    </div>
  `,
  styles: [`
    .ai-widget-wrapper {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1050;
      font-family: inherit;
    }

    /* Floating Action Button (FAB) */
    .ai-fab-btn {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #163320 0%, #1e4a2c 100%);
      color: #ffffff;
      border: 1.5px solid rgba(138, 201, 38, 0.45);
      border-radius: 9999px;
      padding: 8px 16px 8px 10px;
      cursor: pointer;
      box-shadow: 0 10px 25px -5px rgba(22, 51, 32, 0.45), 0 8px 10px -6px rgba(22, 51, 32, 0.3);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .ai-fab-btn:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 14px 28px -4px rgba(22, 51, 32, 0.55), 0 10px 12px -5px rgba(22, 51, 32, 0.35);
      border-color: #8ac926;
    }
    .ai-fab-btn.open-state {
      padding: 12px;
      background: #1f2937;
      border-color: rgba(255, 255, 255, 0.15);
    }

    .pulse-ring {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 9999px;
      border: 2px solid #8ac926;
      opacity: 0;
      animation: fabPulse 2.8s infinite cubic-bezier(0.24, 0, 0.38, 1);
      pointer-events: none;
    }
    @keyframes fabPulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      70% { transform: scale(1.35); opacity: 0; }
      100% { transform: scale(1.35); opacity: 0; }
    }

    .fab-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.12);
      font-size: 19px;
    }
    .fab-pill-label {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .live-fab-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #8ac926;
      box-shadow: 0 0 6px #8ac926;
      animation: blinkDot 1.4s infinite ease-in-out;
    }
    @keyframes blinkDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(0.8); }
    }
    .fab-title-text {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    /* Chat Window */
    .chat-window {
      position: absolute;
      bottom: 60px;
      right: 0;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 540px;
      max-height: calc(100vh - 110px);
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 18px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-bottom: 8px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05);
      transition: all 0.25s ease-in-out;
    }
    .chat-window.maximized {
      width: 520px;
      height: 680px;
    }

    /* Header */
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: linear-gradient(135deg, #163320 0%, #1b3d26 100%);
      color: #ffffff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .bot-avatar-box {
      position: relative;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .online-indicator-dot {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      background: #8ac926;
      border: 1.5px solid #163320;
      border-radius: 50%;
    }
    .header-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .bot-title-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .bot-name {
      font-size: 14px;
      font-weight: 700;
      color: #f8fafc;
    }
    .ai-tag {
      font-size: 9px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 4px;
      background: #8ac926;
      color: #163320;
      letter-spacing: 0.5px;
    }
    .bot-subtext {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.75);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .icon-action-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.75);
      width: 26px;
      height: 26px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .icon-action-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    /* Active Language Strip */
    .active-lang-strip {
      background: rgba(138, 201, 38, 0.12);
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary, #374151);
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Messages container */
    .messages-container {
      flex: 1;
      padding: 14px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: var(--bg-body, #f9fafb);
    }

    /* Intro Card */
    .intro-bubble {
      display: flex;
      gap: 10px;
      padding: 10px 12px;
      background: rgba(22, 51, 32, 0.05);
      border: 1px dashed rgba(22, 51, 32, 0.2);
      border-radius: 12px;
      font-size: 12px;
    }
    .intro-icon {
      font-size: 20px;
      line-height: 1;
    }
    .intro-content h4 {
      margin: 0 0 2px 0;
      font-size: 12px;
      font-weight: 700;
      color: #163320;
    }
    .intro-content p {
      margin: 0;
      color: var(--text-secondary, #4b5563);
      line-height: 1.35;
    }

    /* Message rows */
    .message-row {
      display: flex;
      gap: 8px;
      max-width: 88%;
      align-items: flex-start;
    }
    .bot-row {
      align-self: flex-start;
    }
    .user-row {
      align-self: flex-end;
      flex-direction: row-reverse;
    }
    .msg-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #163320;
      color: #ffffff;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .msg-avatar.user-icon {
      background: #2563eb;
      font-size: 11px;
      font-weight: 700;
    }

    /* Bubbles */
    .msg-bubble {
      padding: 9px 12px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.45;
      word-break: break-word;
    }
    .bot-bubble {
      background: var(--bg-surface, #ffffff);
      color: var(--text-primary, #111827);
      border: 1px solid var(--border-color, #e5e7eb);
      border-top-left-radius: 3px;
    }
    .user-bubble {
      background: linear-gradient(135deg, #163320 0%, #1e4a2c 100%);
      color: #ffffff;
      border-top-right-radius: 3px;
    }
    .msg-meta {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      margin-top: 4px;
      font-size: 10px;
      opacity: 0.65;
    }
    .verified-tag {
      color: #15803d;
      font-weight: 700;
    }

    /* Quick action chips inside message */
    .msg-action-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }
    .action-chip {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .link-chip {
      background: rgba(22, 51, 32, 0.08);
      color: #163320;
      border: 1px solid rgba(22, 51, 32, 0.2);
    }
    .link-chip:hover {
      background: #163320;
      color: #ffffff;
    }
    .prompt-chip {
      background: rgba(37, 99, 235, 0.08);
      color: #1d4ed8;
      border: 1px solid rgba(37, 99, 235, 0.2);
    }
    .prompt-chip:hover {
      background: #1d4ed8;
      color: #ffffff;
    }

    /* Typing indicator */
    .typing-bubble {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
    }
    .typing-dot {
      width: 6px;
      height: 6px;
      background: #163320;
      border-radius: 50%;
      animation: typingBounce 1.2s infinite ease-in-out;
    }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typingBounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-4px); opacity: 1; }
    }
    .typing-hint {
      margin-left: 6px;
      font-size: 11px;
      color: var(--text-secondary, #6b7280);
      font-style: italic;
    }

    /* Quick Chips Tray */
    .quick-chips-wrapper {
      padding: 8px 12px;
      background: var(--bg-surface, #ffffff);
      border-top: 1px solid var(--border-color, #e5e7eb);
    }
    .chips-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--text-secondary, #6b7280);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .chips-scroll {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 2px;
      scrollbar-width: none;
    }
    .chips-scroll::-webkit-scrollbar {
      display: none;
    }
    .quick-chip-btn {
      white-space: nowrap;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 9999px;
      background: var(--bg-body, #f3f4f6);
      color: var(--text-primary, #374151);
      border: 1px solid var(--border-color, #d1d5db);
      cursor: pointer;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }
    .quick-chip-btn:hover {
      background: #163320;
      color: #ffffff;
      border-color: #163320;
      transform: translateY(-1px);
    }

    /* Input Bar */
    .chat-input-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: var(--bg-surface, #ffffff);
      border-top: 1px solid var(--border-color, #e5e7eb);
    }
    .user-text-input {
      flex: 1;
      padding: 9px 12px;
      border-radius: 9999px;
      border: 1px solid var(--border-color, #d1d5db);
      background: var(--bg-body, #f9fafb);
      color: var(--text-primary, #111827);
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s ease;
    }
    .user-text-input:focus {
      border-color: #163320;
      background: var(--bg-surface, #ffffff);
    }
    .send-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #163320 0%, #1e4a2c 100%);
      color: #ffffff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
    .send-btn:hover:not(:disabled) {
      transform: scale(1.08);
      background: #8ac926;
      color: #163320;
    }
    .send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Animation */
    .animate-fade-in {
      animation: fadeInScale 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeInScale {
      from { opacity: 0; transform: translateY(12px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Mobile media query */
    @media (max-width: 640px) {
      .ai-widget-wrapper {
        bottom: 16px;
        right: 16px;
      }
      .chat-window {
        bottom: 56px;
        right: 0;
        width: calc(100vw - 32px);
        height: 75vh;
      }
      .chat-window.maximized {
        width: calc(100vw - 32px);
        height: 85vh;
      }
    }
  `]
})
export class AiChatbotComponent implements AfterViewChecked {
  i18nService = inject(I18nService);
  authService = inject(AuthService);

  @ViewChild('scrollArea') private scrollArea?: ElementRef;

  isOpen = signal<boolean>(false);
  isMaximized = signal<boolean>(false);
  isTyping = signal<boolean>(false);
  userInput: string = '';

  // Local Chat History
  messages = signal<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: 'नमस्ते! मैं एग्री-मित्र हूँ, आपका AI सहायक। फसल अवशेष भाव, 100% खरीदार-भुगतान ट्रांसपोर्ट, एस्क्रो पेमेंट या नई लिस्टिंग के बारे में कुछ भी पूछें!',
      timestamp: this.getNowTime(),
      category: 'general',
      quickActions: [
        { label: '📊 मंडी भाव (Rates)', prompt: 'धान और गेहूं पराली का आज का मंडी भाव क्या है?' },
        { label: '🚛 ट्रांसपोर्ट पॉलिसी', prompt: 'ट्रांसपोर्ट का खर्च कौन देता है?' },
        { label: '🛡️ एस्क्रो पेमेंट', prompt: 'एस्क्रो पेमेंट की सुरक्षा कैसे काम करती है?' }
      ]
    }
  ]);

  private needScroll: boolean = false;

  // Multi-lingual Dynamic Labels
  botName = computed(() => {
    const lang = this.i18nService.currentLanguage();
    if (lang === 'hi') return 'एग्री-मित्र (AgriBot)';
    if (lang === 'kn') return 'ಕೃಷಿ-ಮಿತ್ರ (AgriBot)';
    if (lang === 'ta') return 'அக்ரி-மித்ரா (AgriBot)';
    if (lang === 'te') return 'అగ్రి-మిత్ర (AgriBot)';
    if (lang === 'bn') return 'এগ্রি-মিত্র (AgriBot)';
    if (lang === 'mr') return 'एग्री-मित्र (AgriBot)';
    if (lang === 'ml') return 'അഗ്രി-മിത്ര (AgriBot)';
    return 'Agri-Mitra (AI Assistant)';
  });

  botSubtitle = computed(() => {
    const lang = this.i18nService.currentLanguage();
    if (lang === 'hi') return '24x7 कृषि व अवशेष समाधान';
    if (lang === 'kn') return '24x7 ಕೃಷಿ ಮತ್ತು ತ್ಯಾಜ್ಯ ಸಹಾಯ';
    return '24x7 Intelligent Biomass Co-Pilot';
  });

  fabLabel = computed(() => {
    const lang = this.i18nService.currentLanguage();
    if (lang === 'hi') return 'एग्री मित्र AI';
    if (lang === 'kn') return 'ಕೃಷಿ ಮಿತ್ರ AI';
    if (lang === 'ta') return 'அக்ரி AI';
    if (lang === 'te') return 'అగ్రి AI';
    return 'AgriBot AI';
  });

  langNotice = computed(() => {
    const lang = this.i18nService.currentLanguage();
    if (lang === 'hi') return 'सक्रिय भाषा: हिंदी में उत्तर';
    if (lang === 'kn') return 'ಸಕ್ರಿಯ ಭಾಷೆ: ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರ';
    return 'Conversing in active system language';
  });

  introHeading = computed(() => {
    const lang = this.i18nService.currentLanguage();
    if (lang === 'hi') return 'एग्री-मित्र AI सहायक में आपका स्वागत है';
    if (lang === 'kn') return 'ಕೃಷಿ-ಮಿತ್ರ AI ಸಹಾಯಕ್ಕೆ ಸುಸ್ವಾಗತ';
    return 'Welcome to Agri-Mitra Biomass AI';
  });

  introDesc = computed(() => {
    const lang = this.i18nService.currentLanguage();
    if (lang === 'hi') return 'पराली के सटीक भाव, शून्य किसान भाड़ा नीति, 50% एस्क्रो एडवांस और 100 किमी रडार पर त्वरित जानकारी पाएं।';
    if (lang === 'kn') return 'ಬೆಳೆ ತ್ಯಾಜ್ಯದ ನಿಖರ ಬೆಲೆ, ಉಚಿತ ರೈತ ಸಾರಿಗೆ, 50% ಎಸ್ಕ್ರೋ ಗ್ಯಾರಂಟಿ ಮತ್ತು 100 ಕಿಮೀ ರೇಡಾರ್ ಬಗ್ಗೆ ತಿಳಿದುಕೊಳ್ಳಿ.';
    return 'Ask about fair mandi residue prices, 100% buyer-paid transport, AgriPay Escrow, and 100 km live radar.';
  });

  suggestionsLabel = computed(() => {
    const lang = this.i18nService.currentLanguage();
    if (lang === 'hi') return 'त्वरित सुझाव / Quick Topics:';
    if (lang === 'kn') return 'ತ್ವರಿತ ಸಲಹೆಗಳು:';
    return 'Quick Suggestions:';
  });

  inputPlaceholder = computed(() => {
    const lang = this.i18nService.currentLanguage();
    if (lang === 'hi') return 'अपना प्रश्न यहाँ लिखें... (उदा. पराली का भाव)';
    if (lang === 'kn') return 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ...';
    return 'Type your question... (e.g. straw rates, escrow)';
  });

  typingHintText = computed(() => {
    const lang = this.i18nService.currentLanguage();
    if (lang === 'hi') return 'एग्री-मित्र विश्लेषण कर रहा है...';
    if (lang === 'kn') return 'ಕೃಷಿ-ಮಿತ್ರ ಉತ್ತರಿಸುತ್ತಿದೆ...';
    return 'AgriBot is typing...';
  });

  // Current Quick Suggestion Chips based on Language
  currentSuggestionChips = computed(() => {
    const lang = this.i18nService.currentLanguage();
    if (lang === 'hi') {
      return [
        { label: '🌾 धान पराली भाव', query: 'धान पराली का आज का मंडी भाव क्या है?' },
        { label: '🚛 ट्रांसपोर्ट कौन देगा?', query: 'ट्रांसपोर्ट का खर्च कौन देता है?' },
        { label: '🛡️ एस्क्रो पेमेंट गारंटी', query: 'एस्क्रो पेमेंट की सुरक्षा कैसे काम करती है?' },
        { label: '➕ नई लिस्टिंग जोड़ें', query: 'नई फसल अवशेष लिस्ट कैसे करें?' },
        { label: '📈 2% प्लेटफॉर्म शुल्क', query: 'प्लेटफॉर्म का कमीशन कितना है?' }
      ];
    } else if (lang === 'kn') {
      return [
        { label: '🌾 ಭತ್ತದ ಹುಲ್ಲಿನ ದರ', query: 'ಭತ್ತದ ಹುಲ್ಲಿನ ಇಂದಿನ ದರ ಎಷ್ಟು?' },
        { label: '🚛 ಸಾರಿಗೆ ವೆಚ್ಚ ಯಾರು?', query: 'ಸಾರಿಗೆ ವೆಚ್ಚ ಯಾರು ಪಾವತಿಸುತ್ತಾರೆ?' },
        { label: '🛡️ ಎಸ್ಕ್ರೋ ಭದ್ರತೆ', query: 'ಎಸ್ಕ್ರೋ ಪಾವತಿ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?' },
        { label: '➕ ಹೊಸ ಲಿಸ್ಟಿಂಗ್', query: 'ಹೊಸ ಬೆಳೆ ತ್ಯಾಜ್ಯ ಲಿಸ್ಟ್ ಮಾಡುವುದು ಹೇಗೆ?' },
        { label: '📈 2% ಕಮಿಷನ್ ಶುಲ್ಕ', query: 'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಶುಲ್ಕ ಎಷ್ಟು?' }
      ];
    } else {
      return [
        { label: '🌾 Paddy Straw Price', query: 'What is today\'s Paddy Straw rate?' },
        { label: '🚛 Transport Policy', query: 'Who pays for transportation freight?' },
        { label: '🛡️ AgriPay Escrow', query: 'How does AgriPay Escrow guarantee payment?' },
        { label: '➕ Create Listing', query: 'How do I add a new residue listing?' },
        { label: '📈 2% Commission', query: 'What are platform commission fees?' }
      ];
    }
  });

  ngAfterViewChecked(): void {
    if (this.needScroll && this.scrollArea) {
      try {
        this.scrollArea.nativeElement.scrollTop = this.scrollArea.nativeElement.scrollHeight;
      } catch (err) {}
      this.needScroll = false;
    }
  }

  toggleOpen(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.needScroll = true;
    }
  }

  toggleMaximize(): void {
    this.isMaximized.update(v => !v);
  }

  clearHistory(): void {
    const initText = this.i18nService.currentLanguage() === 'hi'
      ? 'चैट इतिहास साफ़ किया गया। आप फसल अवशेष, ट्रांसपोर्ट या पेमेंट से जुड़े नए सवाल पूछ सकते हैं!'
      : this.i18nService.currentLanguage() === 'kn'
      ? 'ಚಾಟ್ ಇತಿಹಾಸವನ್ನು ತೆರವುಗೊಳಿಸಲಾಗಿದೆ. ನೀವು ಹೊಸ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಬಹುದು!'
      : 'Chat cleared. Ask anything regarding crop residue, freight, or escrow payments!';

    this.messages.set([
      {
        id: 'cleared-1',
        sender: 'bot',
        text: initText,
        timestamp: this.getNowTime(),
        category: 'general'
      }
    ]);
  }

  sendUserQuery(promptText: string): void {
    if (!promptText.trim() || this.isTyping()) return;

    // Push User Message
    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: promptText.trim(),
      timestamp: this.getNowTime()
    };

    this.messages.update(msgs => [...msgs, userMsg]);
    this.needScroll = true;
    this.isTyping.set(true);

    // AI Response generation delay (450ms - 800ms)
    setTimeout(() => {
      const response = this.generateAiResponse(promptText);
      const botMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: response.text,
        timestamp: this.getNowTime(),
        category: response.category,
        quickActions: response.quickActions
      };

      this.messages.update(msgs => [...msgs, botMsg]);
      this.isTyping.set(false);
      this.needScroll = true;
    }, 600);
  }

  onSubmit(e: Event): void {
    e.preventDefault();
    if (!this.userInput.trim() || this.isTyping()) return;
    const text = this.userInput;
    this.userInput = '';
    this.sendUserQuery(text);
  }

  private generateAiResponse(query: string): {
    text: string;
    category: ChatMessage['category'];
    quickActions?: ChatMessage['quickActions'];
  } {
    const q = query.toLowerCase();
    const lang = this.i18nService.currentLanguage();

    // 1. PRICE / MANDI RATES QUERY
    if (q.includes('price') || q.includes('rate') || q.includes('भाव') || q.includes('दरा') || q.includes('ಬೆಲೆ') || q.includes('ದರ') || q.includes('straw') || q.includes('पराली') || q.includes('भूसा') || q.includes('bagasse')) {
      if (lang === 'hi') {
        return {
          text: `🌾 <b>आज के सत्यापित मंडी भाव (AgriMech Real-time Atlas Rates):</b><br><br>
• <b>धान पराली (Paddy Straw):</b> ₹1,800 – ₹2,200 / टन<br>
• <b>गेहूं भूसा (Wheat Straw):</b> ₹2,200 – ₹2,600 / टन<br>
• <b>गन्ने की खोई (Sugarcane Bagasse):</b> ₹2,500 – ₹3,000 / टन<br>
• <b>सरसों का डंठल (Mustard Husk):</b> ₹1,600 – ₹2,000 / टन<br>
• <b>कपास डंठल (Cotton Stalks):</b> ₹1,900 – ₹2,300 / टन<br>
• <b>मक्का डंठल (Corn Stover):</b> ₹1,500 – ₹1,900 / टन<br><br>
💡 <i>नोट: नमी <12% होने पर ₹150/टन अतिरिक्त प्रीमियम मिलता है।</i>`,
          category: 'price',
          quickActions: [
            { label: '➕ अपनी फसल लिस्ट करें', route: '/new-listing' },
            { label: '🗺️ 100 km रडार देखें', route: '/proximity-radar' }
          ]
        };
      } else if (lang === 'kn') {
        return {
          text: `🌾 <b>ಇಂದಿನ ಅಧಿಕೃತ ಮಂಡಿ ಬೆಲೆಗಳು (AgriMech Rates):</b><br><br>
• <b>ಭತ್ತದ ಹುಲ್ಲು (Paddy Straw):</b> ₹1,800 – ₹2,200 / ಟನ್<br>
• <b>ಗೋಧಿ ಹುಲ್ಲು (Wheat Straw):</b> ₹2,200 – ₹2,600 / ಟನ್<br>
• <b>ಕಬ್ಬಿನ ಸಿಪ್ಪೆ (Sugarcane Bagasse):</b> ₹2,500 – ₹3,000 / ಟನ್<br>
• <b>ಸಾಸಿವೆ ತ್ಯಾಜ್ಯ (Mustard Husk):</b> ₹1,600 – ₹2,000 / ಟನ್<br><br>
💡 <i>ತೇವಾಂಶ 12% ಕ್ಕಿಂತ ಕಡಿಮೆಯಿದ್ದರೆ ಹೆಚ್ಚುವರಿ ಪ್ರೀಮಿಯಂ ಲಭ್ಯವಿದೆ.</i>`,
          category: 'price',
          quickActions: [
            { label: '➕ ಹೊಸ ಲಿಸ್ಟಿಂಗ್', route: '/new-listing' },
            { label: '🗺️ 100 km ರೇಡಾರ್', route: '/proximity-radar' }
          ]
        };
      } else {
        return {
          text: `🌾 <b>Today's Live Mandi Rates (Verified Atlas Feedstock):</b><br><br>
• <b>Paddy Straw:</b> ₹1,800 – ₹2,200 / Ton<br>
• <b>Wheat Straw:</b> ₹2,200 – ₹2,600 / Ton<br>
• <b>Sugarcane Bagasse:</b> ₹2,500 – ₹3,000 / Ton<br>
• <b>Mustard Husk:</b> ₹1,600 – ₹2,000 / Ton<br>
• <b>Cotton Stalks:</b> ₹1,900 – ₹2,300 / Ton<br><br>
💡 <i>Stock with <12% moisture earns a ₹150/T quality bonus!</i>`,
          category: 'price',
          quickActions: [
            { label: '➕ Post New Listing', route: '/new-listing' },
            { label: '🗺️ Open Proximity Radar', route: '/proximity-radar' }
          ]
        };
      }
    }

    // 2. TRANSPORT / FREIGHT / 100% BUYER PAID
    if (q.includes('transport') || q.includes('freight') || q.includes('भाड़ा') || q.includes('ट्रांसपोर्ट') || q.includes('ಸಾರಿಗೆ') || q.includes('ಖರ್ಚು') || q.includes('गाड़ी') || q.includes('3pl') || q.includes('ट्रक')) {
      if (lang === 'hi') {
        return {
          text: `🚛 <b>100% खरीदार-भुगतान परिवहन नीति (Zero Farmer Freight):</b><br><br>
✅ <b>किसान का खर्च: ₹0</b> — किसान को किसी भी ट्रांसपोर्ट या लोडिंग का भाड़ा नहीं देना होता!<br>
✅ <b>100% भाड़ा इंडस्ट्रियल खरीदार देता है:</b> खरीदार सीधे सत्यापित 3PL ट्रांसपोर्टर को धर्मकांटा (Weighbridge POD) पर्ची अपलोड होने पर भुगतान करता है।<br>
✅ <b>स्मार्ट डायनामिक फॉर्मूला:</b> ₹35/टन बेस + ₹3.20/किमी/टन दर + खाली वापसी छूट।`,
          category: 'logistics',
          quickActions: [
            { label: '🚚 फ्रेट कैलकुलेटर (USP 2)', route: '/logistics-calculator' },
            { label: '🚛 3PL वर्कस्पेस', route: '/transporter-dashboard' }
          ]
        };
      } else if (lang === 'kn') {
        return {
          text: `🚛 <b>100% ಖರೀದಿದಾರ-ಪಾವತಿಸಿದ ಸಾರಿಗೆ ನೀತಿ:</b><br><br>
✅ <b>ರೈತನ ಖರ್ಚು: ₹0</b> — ರೈತರು ಯಾವುದೇ ಸಾರಿಗೆ ಶುಲ್ಕ ಪಾವತಿಸಬೇಕಾಗಿಲ್ಲ!<br>
✅ <b>ಖರೀದಿದಾರರು 100% ಸಾರಿಗೆ ವೆಚ್ಚ ಪಾವತಿಸುತ್ತಾರೆ:</b> ವೆಯಿಂಗ್ ಬ್ರಿಡ್ಜ್ ರಶೀದಿ ಪರಿಶೀಲನೆಯ ನಂತರ 3PL ಟ್ರಾನ್ಸ್‌ಪೋರ್ಟರ್‌ಗೆ ನೇರ ಪಾವತಿ ಆಗುತ್ತದೆ.<br>
✅ <b>ಸ್ಮಾರ್ಟ್ ಲೆಕ್ಕಾಚಾರ:</b> ₹35 ಮೂಲ ದರ + ₹3.20/ಕಿಮೀ/ಟನ್.`,
          category: 'logistics',
          quickActions: [
            { label: '🚚 ಸಾರಿಗೆ ಕ್ಯಾಲ್ಕುಲೇಟರ್', route: '/logistics-calculator' },
            { label: '🚛 3PL ವರ್ಕ್‌ಸ್ಪೇಸ್', route: '/transporter-dashboard' }
          ]
        };
      } else {
        return {
          text: `🚛 <b>100% Buyer-Paid Transport Policy (Farmer Pays ₹0):</b><br><br>
✅ <b>Farmer Freight: ₹0</b> — Farmers never pay for transport or dispatch costs.<br>
✅ <b>Buyer Pays Transporter:</b> The industrial buyer settles the freight directly with the verified 3PL fleet upon weighbridge digital POD upload.<br>
✅ <b>Formula:</b> ₹35/T base + ₹3.20/km/T with empty return efficiency discount.`,
          category: 'logistics',
          quickActions: [
            { label: '🚚 Smart Logistics Calculator', route: '/logistics-calculator' },
            { label: '🚛 3PL Workspace', route: '/transporter-dashboard' }
          ]
        };
      }
    }

    // 3. ESCROW / PAYMENT / SECURITY
    if (q.includes('escrow') || q.includes('pay') || q.includes('पेमेंट') || q.includes('एस्क्रो') || q.includes('पैसे') || q.includes('ಭದ್ರತೆ') || q.includes('ಹಣ') || q.includes('security') || q.includes('guarantee')) {
      if (lang === 'hi') {
        return {
          text: `🛡️ <b>AgriPay डिजिटल एस्क्रो सुरक्षा (100% सुरक्षित भुगतान):</b><br><br>
1️⃣ <b>50% एडवांस लॉक:</b> सौदा पक्का होते ही खरीदार की राशि बैंक एस्क्रो वॉल्ट में लॉक हो जाती है।<br>
2️⃣ <b>लोडिंग सत्यापन:</b> जीपीएस जियो-टैग्ड स्टॉक और वाहन डिस्पैच की पुष्टि होती है।<br>
3️⃣ <b>तत्काल रिलीज:</b> फैक्ट्री धर्मकांटे पर तौल और नमी (<12%) की पुष्टि होते ही शेष 50% राशि सीधे किसान के खाते में जमा हो जाती है। कोई धोखाधड़ी नहीं!`,
          category: 'escrow',
          quickActions: [
            { label: '📦 ऑर्डर व रसीदें देखें', route: '/orders' },
            { label: '💬 नेगोशिएशन डेस्क', route: '/negotiations' }
          ]
        };
      } else if (lang === 'kn') {
        return {
          text: `🛡️ <b>AgriPay ಎಸ್ಕ್ರೋ ಪಾವತಿ ಭದ್ರತೆ:</b><br><br>
1️⃣ <b>50% ಮುಂಗಡ ಎಸ್ಕ್ರೋ ಲಾಕ್:</b> ಒಪ್ಪಂದವಾದ ತಕ್ಷಣ ಖರೀದಿದಾರರ ಹಣ ಸುರಕ್ಷಿತವಾಗಿ ಲಾಕ್ ಆಗುತ್ತದೆ.<br>
2️⃣ <b>ವೆಯಿಂಗ್ ಬ್ರಿಡ್ಜ್ ಪರಿಶೀಲನೆ:</b> ಸರಕು ತಲುಪಿದ ತಕ್ಷಣ ತೇವಾಂಶ ಮತ್ತು ತೂಕ ಪರೀಕ್ಷೆ.<br>
3️⃣ <b>ನೇರ ಖಾತೆಗೆ ಜಮೆ:</b> ಪರಿಶೀಲನೆಯ ನಂತರ ತಕ್ಷಣ ಉಳಿದ ಹಣ ರೈತರ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಬಿಡುಗಡೆ!`,
          category: 'escrow',
          quickActions: [
            { label: '📦 ಆರ್ಡರ್ ವಿವರಗಳು', route: '/orders' }
          ]
        };
      } else {
        return {
          text: `🛡️ <b>AgriPay Escrow Guarantee (Zero Default Risk):</b><br><br>
1️⃣ <b>50% Locked Advance:</b> Buyer locks funds into RBI-compliant escrow when the deal is confirmed.<br>
2️⃣ <b>Geo-Tagged Dispatch:</b> Transport GPS tracking and stock validation.<br>
3️⃣ <b>Instant Release:</b> Balance released directly to the farmer within 2 hours of weighbridge POD upload (<12% moisture).`,
          category: 'escrow',
          quickActions: [
            { label: '📦 View Orders & Escrows', route: '/orders' },
            { label: '💬 Negotiation Desk', route: '/negotiations' }
          ]
        };
      }
    }

    // 4. LISTING / HOW TO SELL
    if (q.includes('listing') || q.includes('sell') || q.includes('list') || q.includes('बेचना') || q.includes('लिस्ट') || q.includes('ಲಿಸ್ಟ್') || q.includes('ಮಾರುವುದು') || q.includes('add')) {
      if (lang === 'hi') {
        return {
          text: `➕ <b>नया फसल अवशेष लिस्ट करने का तरीका:</b><br><br>
1. ऊपर या साइडबार में <b>'New Listing'</b> बटन पर क्लिक करें।<br>
2. फसल का प्रकार चुनें (धान पराली, गेहूं भूसा, गन्ने की खोई आदि)।<br>
3. कुल टन भार, नमी प्रतिशत और अपेक्षित प्रति टन भाव दर्ज करें।<br>
4. जीपीएस लोकेशन और खेत की लाइव फोटो अपलोड करें।<br>
5. <b>'Submit Listing'</b> दबाते ही 100 किमी दायरे के सभी बॉयलर्स व कारखानों को तुरंत अलर्ट चला जाता है!`,
          category: 'listing',
          quickActions: [
            { label: '➕ अभी लिस्ट करें (New Listing)', route: '/new-listing' }
          ]
        };
      } else if (lang === 'kn') {
        return {
          text: `➕ <b>ಹೊಸ ಬೆಳೆ ತ್ಯಾಜ್ಯ ಲಿಸ್ಟ್ ಮಾಡುವ ವಿಧಾನ:</b><br><br>
1. <b>'New Listing'</b> ಬಟನ್ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ.<br>
2. ಬೆಳೆ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ (ಭತ್ತ, ಗೋಧಿ, ಕಬ್ಬು ಇತ್ಯಾದಿ).<br>
3. ಒಟ್ಟು ಟನ್, ತೇವಾಂಶ ಪ್ರಮಾಣ ಮತ್ತು ದರ ನಮೂದಿಸಿ.<br>
4. ಜಿಪಿಎಸ್ ಸ್ಥಳ ದೃಢೀಕರಿಸಿ ಸಲ್ಲಿಸಿ. 100 ಕಿಮೀ ವ್ಯಾಪ್ತಿಯ ಎಲ್ಲಾ ಖರೀದಿದಾರರಿಗೆ ತಕ್ಷಣ ತಲುಪುತ್ತದೆ!`,
          category: 'listing',
          quickActions: [
            { label: '➕ ಈಗಲೇ ಲಿಸ್ಟ್ ಮಾಡಿ', route: '/new-listing' }
          ]
        };
      } else {
        return {
          text: `➕ <b>How to List Crop Residue on AgriMech:</b><br><br>
1. Click <b>'New Listing'</b> in the sidebar or top bar.<br>
2. Select residue category (Paddy Straw, Wheat Straw, Bagasse, etc.).<br>
3. Enter available tonnage, moisture %, and desired price per ton.<br>
4. Pin your field GPS and upload photos.<br>
5. Hit <b>'Submit Listing'</b> — nearby industrial plants within 100 km will receive immediate purchase alerts!`,
          category: 'listing',
          quickActions: [
            { label: '➕ Create Listing Now', route: '/new-listing' }
          ]
        };
      }
    }

    // 5. COMMISSION / PLATFORM FEES
    if (q.includes('fee') || q.includes('commission') || q.includes('कमीशन') || q.includes('शुल्क') || q.includes('ಕಮಿಷನ್') || q.includes('charge')) {
      if (lang === 'hi') {
        return {
          text: `📈 <b>AgriMech पारदर्शी प्लेटफॉर्म शुल्क संरचना:</b><br><br>
• <b>फसल अवशेष लेनदेन:</b> केवल 2% प्लेटफॉर्म कमीशन (सफल डिलीवरी पर)।<br>
• <b>लॉजिस्टिक्स फ्रेट:</b> केवल 5% ट्रांसपोर्टेशन शुल्क।<br>
• <b>छिपे हुए शुल्क:</b> बिल्कुल ₹0! कोई पंजीकरण या सदस्यता शुल्क नहीं।`,
          category: 'general',
          quickActions: [
            { label: '🛡️ एडमिन रेवेन्यू लेजर', route: '/admin-dashboard' }
          ]
        };
      } else {
        return {
          text: `📈 <b>Transparent AgriMech Platform Commission:</b><br><br>
• <b>Residue Trade:</b> Strictly 2% on verified settlement.<br>
• <b>Logistics Freight:</b> Strictly 5% on completed dispatch.<br>
• <b>Zero Hidden Costs:</b> Free farmer onboarding, no monthly subscriptions.`,
          category: 'general',
          quickActions: [
            { label: '🛡️ View Admin Ledger', route: '/admin-dashboard' }
          ]
        };
      }
    }

    // 6. MULTI-FARMER OPTIMIZER (USP 1) / RADAR
    if (q.includes('optimizer') || q.includes('multi') || q.includes('radar') || q.includes('रडार') || q.includes('pool') || q.includes('ಮಲ್ಟಿ')) {
      if (lang === 'hi') {
        return {
          text: `⚡ <b>मल्टी-फार्मर ऑप्टिमाइज़र (USP 1) & 100 km लाइव रडार:</b><br><br>
बड़े खरीदार (पावर प्लांट्स, इथेनॉल फैक्ट्रियां) 5 से 10 छोटे किसानों के स्टॉक को एक साथ क्लब करके एक ही 200+ टन का बड़ा ऑर्डर बुक कर सकते हैं। इससे ट्रांसपोर्ट रूट सबसे छोटा होता है और भाड़े में 28% की बचत होती है!`,
          category: 'general',
          quickActions: [
            { label: '⚡ आर्डर ऑप्टिमाइज़र (USP 1)', route: '/order-optimizer' },
            { label: '🗺️ 100 km लाइव रडार', route: '/proximity-radar' }
          ]
        };
      } else {
        return {
          text: `⚡ <b>Multi-Farmer Order Optimizer (USP 1) & 100 km Radar:</b><br><br>
Industrial buyers can automatically aggregate 5-10 proximate smallholders into a single bulk consignment, cutting logistics overhead by 28% through AI-guided route clustering.`,
          category: 'general',
          quickActions: [
            { label: '⚡ Launch Optimizer (USP 1)', route: '/order-optimizer' },
            { label: '🗺️ Open Proximity Radar', route: '/proximity-radar' }
          ]
        };
      }
    }

    // 7. DEFAULT / FALLBACK RESPONSE
    if (lang === 'hi') {
      return {
        text: `नमस्ते! मैं आपके सवाल को समझ गया हूँ। AgriMech पर आप पराली के मंडी भाव जान सकते हैं, 100% खरीदार-भुगतान ट्रांसपोर्ट सुविधा पा सकते हैं, और सुरक्षित एस्क्रो के साथ सौदा कर सकते हैं।<br><br>कृपया नीचे दिए गए किसी विषय पर क्लिक करें या अपना प्रश्न विस्तार से लिखें:`,
        category: 'general',
        quickActions: [
          { label: '🌾 आज के भाव', prompt: 'धान और गेहूं पराली का आज का मंडी भाव क्या है?' },
          { label: '🚛 ट्रांसपोर्ट नीति', prompt: 'ट्रांसपोर्ट का खर्च कौन देता है?' },
          { label: '➕ नई लिस्टिंग बनाएं', route: '/new-listing' },
          { label: '💬 नेगोशिएशन शुरू करें', route: '/negotiations' }
        ]
      };
    } else if (lang === 'kn') {
      return {
        text: `ನಮಸ್ಕಾರ! AgriMech ನಲ್ಲಿ ನೀವು ಬೆಳೆ ತ್ಯಾಜ್ಯದ ಮಂಡಿ ಬೆಲೆಗಳು, ಉಚಿತ ಸಾರಿಗೆ ಸೌಲಭ್ಯ ಮತ್ತು ಸುರಕ್ಷಿತ ಎಸ್ಕ್ರೋ ಪಾವತಿ ಮಾಹಿತಿಯನ್ನು ಪಡೆಯಬಹುದು.<br><br>ದಯವಿಟ್ಟು ಕೆಳಗಿನ ವಿಷಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ:`,
        category: 'general',
        quickActions: [
          { label: '🌾 ಮಂಡಿ ದರಗಳು', prompt: 'ಭತ್ತದ ಹುಲ್ಲಿನ ಇಂದಿನ ದರ ಎಷ್ಟು?' },
          { label: '🚛 ಸಾರಿಗೆ ನಿಯಮಗಳು', prompt: 'ಸಾರಿಗೆ ವೆಚ್ಚ ಯಾರು ಪಾವತಿಸುತ್ತಾರೆ?' },
          { label: '➕ ಹೊಸ ಲಿಸ್ಟಿಂಗ್', route: '/new-listing' }
        ]
      };
    } else {
      return {
        text: `Hello! I am your AgriMech AI co-pilot. I can assist you with real-time residue rates, 100% buyer-paid logistics, AgriPay escrow security, and listing crops.<br><br>Choose an option below or type your query:`,
        category: 'general',
        quickActions: [
          { label: '🌾 Today\'s Mandi Rates', prompt: 'What is today\'s Paddy Straw rate?' },
          { label: '🚛 Transport Policy', prompt: 'Who pays for transportation freight?' },
          { label: '➕ Create Listing', route: '/new-listing' },
          { label: '🗺️ Live 100km Radar', route: '/proximity-radar' }
        ]
      };
    }
  }

  formatMessage(text: string): string {
    // Preserve linebreaks and HTML styling safely
    return text.replace(/\n/g, '<br>');
  }

  private getNowTime(): string {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
