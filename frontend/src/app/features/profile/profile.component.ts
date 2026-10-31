import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, BadgeComponent],
  template: `
    <div class="profile-page">
      <div class="profile-header">
        <div>
          <h2 class="page-title">Profile & Settings</h2>
          <p class="page-subtitle">Manage organization credentials, dispatch preferences, and monochrome interface settings.</p>
        </div>
        <app-badge [variant]="'solid'">
          {{ authService.selectedRole() === 'farmer' ? 'Farmer / Seller Account' : 'Industrial Procurement Account' }}
        </app-badge>
      </div>

      <div class="settings-grid">
        <div class="settings-card">
          <h3 class="card-title">Identity & Entity Verification</h3>
          <p class="card-subtitle">Verified details displayed on negotiation slips and digital consignment notes.</p>

          <div class="form-fields">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" [(ngModel)]="name" />
            </div>

            <div class="form-group">
              <label>Organization / Farm Cooperative</label>
              <input type="text" [(ngModel)]="organization" />
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" [(ngModel)]="email" />
              </div>

              <div class="form-group">
                <label>Phone Number (SMS & WhatsApp)</label>
                <input type="tel" [(ngModel)]="phone" />
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label>GSTIN / Farmer Registration ID</label>
                <input type="text" [(ngModel)]="registrationId" class="font-mono" />
              </div>

              <div class="form-group">
                <label>Base District & State</label>
                <input type="text" [(ngModel)]="district" />
              </div>
            </div>
          </div>
        </div>

        <!-- Role Switcher -->
        <div class="settings-card">
          <h3 class="card-title">Active Operating Role</h3>
          <p class="card-subtitle">Switch your primary interface view between stubble seller and industrial biomass buyer.</p>

          <div class="role-selector-options">
            <div
              class="role-option"
              [class.selected]="authService.selectedRole() === 'farmer'"
              (click)="authService.login('farmer')"
            >
              <div class="option-radio">
                <span *ngIf="authService.selectedRole() === 'farmer'" class="radio-inner"></span>
              </div>
              <div class="option-details">
                <div class="option-name">Farmer / Seller</div>
                <div class="option-desc">Post crop residue lots, respond to bio-energy bids, and view farmer dispatch earnings.</div>
              </div>
            </div>

            <div
              class="role-option"
              [class.selected]="authService.selectedRole() === 'buyer'"
              (click)="authService.login('buyer')"
            >
              <div class="option-radio">
                <span *ngIf="authService.selectedRole() === 'buyer'" class="radio-inner"></span>
              </div>
              <div class="option-details">
                <div class="option-name">Industrial Buyer</div>
                <div class="option-desc">Search proximity suppliers, post bulk pooling requirements, and issue weighbridge contracts.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Theme & Appearance -->
        <div class="settings-card">
          <h3 class="card-title">Theme & Accessibility</h3>
          <p class="card-subtitle">Strict monochrome color palette inspired by ChatGPT. Respects system dark mode.</p>

          <div class="theme-options-row">
            <button
              class="theme-choice-btn"
              [class.active]="!themeService.isDarkMode()"
              (click)="themeService.setTheme(false)"
            >
              <app-icon name="sun" [size]="16"></app-icon>
              <span>Light Mode (Default)</span>
            </button>

            <button
              class="theme-choice-btn"
              [class.active]="themeService.isDarkMode()"
              (click)="themeService.setTheme(true)"
            >
              <app-icon name="moon" [size]="16"></app-icon>
              <span>Dark Mode (Charcoal / Black)</span>
            </button>
          </div>
        </div>

        <div class="save-bar">
          <span *ngIf="saveSuccessMessage()" class="save-toast font-medium">Settings saved successfully.</span>
          <button class="btn-primary" (click)="saveProfile()">
            <app-icon name="check" [size]="14"></app-icon>
            <span>Save Profile Preferences</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 800px;
    }

    .profile-header {
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

    .settings-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .settings-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      background-color: var(--card-background);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .card-title {
      font-size: 15px;
      font-weight: 600;
    }

    .card-subtitle {
      font-size: 12px;
      color: var(--secondary-text);
      margin-top: -6px;
    }

    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
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

    .role-selector-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .role-option {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      display: flex;
      gap: 12px;
      cursor: pointer;
      background-color: var(--sidebar-background);
      transition: border-color 120ms ease;
    }

    .role-option:hover {
      border-color: var(--chip-border);
    }

    .role-option.selected {
      border-color: var(--primary-text);
      background-color: var(--background);
    }

    .option-radio {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1px solid var(--primary-text);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
    }

    .radio-inner {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--primary-text);
    }

    .option-name {
      font-size: 13px;
      font-weight: 600;
    }

    .option-desc {
      font-size: 12px;
      color: var(--secondary-text);
      line-height: 1.4;
      margin-top: 2px;
    }

    .theme-options-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .theme-choice-btn {
      padding: 12px;
      border: 1px solid var(--border);
      background-color: var(--sidebar-background);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--secondary-text);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: border-color 120ms ease, background-color 120ms ease;
    }

    .theme-choice-btn.active {
      background-color: var(--background);
      border-color: var(--primary-text);
      color: var(--primary-text);
      font-weight: 600;
    }

    .save-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 16px;
      padding-top: 8px;
    }

    .save-toast {
      font-size: 13px;
      color: var(--primary-text);
    }

    .font-mono {
      font-family: monospace;
    }

    .font-medium {
      font-weight: 500;
    }

    @media (max-width: 640px) {
      .form-row-2, .role-selector-options, .theme-options-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfileComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  name: string = '';
  organization: string = '';
  email: string = '';
  phone: string = '';
  registrationId: string = '';
  district: string = '';

  saveSuccessMessage = signal<boolean>(false);

  constructor() {
    const u = this.authService.currentUser();
    if (u) {
      this.name = u.name;
      this.organization = u.organization;
      this.email = u.email || '';
      this.phone = u.phone;
      this.registrationId = u.registrationId;
      this.district = `${u.district}, ${u.state}`;
    }
  }

  saveProfile(): void {
    this.authService.updateProfile({
      name: this.name,
      organization: this.organization,
      email: this.email,
      phone: this.phone,
      registrationId: this.registrationId
    });

    this.saveSuccessMessage.set(true);
    setTimeout(() => {
      this.saveSuccessMessage.set(false);
    }, 2500);
  }
}
