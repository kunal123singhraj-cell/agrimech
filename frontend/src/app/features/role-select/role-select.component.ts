import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { UserRole } from '../../core/models/marketplace.model';

@Component({
  selector: 'app-role-select',
  standalone: true,
  imports: [CommonModule, IconComponent, LogoComponent],
  template: `
    <div class="role-select-page">
      <!-- Ambient Farmer Sunlight Atmosphere -->
      <div class="ambient-sunlight"></div>

      <div class="role-container">
        <!-- BIG BOLD CENTERED TITLE & OFFICIAL LOGO -->
        <header class="brand-hero-header">
          <div class="logo-wrapper">
            <app-logo [size]="68" [glow]="true"></app-logo>
          </div>

          <div class="title-lockup">
            <h1 class="brand-hero-title font-syne">AGRIMECH</h1>
            <div class="brand-gold-bar"></div>
          </div>

          <p class="brand-hero-sub font-outfit">
            B2B Agricultural Residue & Bio-Energy Marketplace
          </p>

          <div class="network-badge-strip">
            <span class="net-pill pill-farmer">
              <span class="pill-dot green"></span>
              🌾 Verified Farm-Gate Supply
            </span>
            <span class="net-dot">&bull;</span>
            <span class="net-pill pill-radar">
              <span class="pill-dot amber"></span>
              ⚡ 100 KM Proximity Radar
            </span>
            <span class="net-dot">&bull;</span>
            <span class="net-pill pill-buyer">
              <span class="pill-dot blue"></span>
              🏭 Factory Escrow Intake
            </span>
          </div>

          <h2 class="select-prompt">Choose Your Operating Profile</h2>
          <p class="select-desc">
            Directly connect crop stubble sellers with commercial bio-energy, paper, and industrial buyers.
          </p>
        </header>

        <!-- Two Distinct Creative Role Cards -->
        <div class="cards-grid">
          <!-- Card 1: Farmer / Residue Seller -->
          <div class="role-card card-farmer" (click)="chooseRole('farmer')">
            <div class="card-glow-bg green-glow"></div>

            <div class="card-header-bar">
              <span class="role-category-tag font-outfit">🌾 FARMER / SELLER WORKSPACE</span>
              <span class="apmc-tag font-outfit">APMC Weighed</span>
            </div>

            <div class="card-icon-hero">
              <span class="card-emoji">🌾</span>
              <div class="icon-ring"></div>
            </div>

            <div class="role-content">
              <h3 class="card-role-title font-outfit">Farmer & Crop Residue Seller</h3>
              <p class="card-role-desc">
                List post-harvest stubble and agricultural residues. Connect directly with bio-energy refineries, pellet plants, and industrial boilers.
              </p>

              <div class="role-perks-box">
                <div class="perk-row">
                  <span class="check-icon">✓</span>
                  <span>List Paddy straw, Wheat stubble, Ragi, Mulberry & Bagasse</span>
                </div>
                <div class="perk-row">
                  <span class="check-icon">✓</span>
                  <span>Instant factory purchase bids within 100 km of your farm</span>
                </div>
                <div class="perk-row">
                  <span class="check-icon">✓</span>
                  <span><strong>50% Advance Escrow</strong> locked before truck loading</span>
                </div>
                <div class="perk-row">
                  <span class="check-icon">✓</span>
                  <span>Zero broker commission & direct UPI/Bank settlements</span>
                </div>
              </div>
            </div>

            <button class="btn-farmer-action">
              <span>Enter as Farmer / Seller</span>
              <app-icon name="arrow-right" [size]="15"></app-icon>
            </button>
          </div>

          <!-- Card 2: Industrial Buyer / Factory -->
          <div class="role-card card-buyer" (click)="chooseRole('buyer')">
            <div class="card-glow-bg amber-glow"></div>

            <div class="card-header-bar">
              <span class="role-category-tag font-outfit">🏭 INDUSTRIAL BUYER / RECEIVER</span>
              <span class="escrow-tag font-outfit">🔒 Trust Vault Active</span>
            </div>

            <div class="card-icon-hero">
              <span class="card-emoji">🏭</span>
              <div class="icon-ring ring-amber"></div>
            </div>

            <div class="role-content">
              <h3 class="card-role-title font-outfit">Industrial Procurement Buyer</h3>
              <p class="card-role-desc">
                Source commercial biomass feedstock at industrial scale. Scan 100 km radius, broadcast intake quotas, and lock in reliable deliveries.
              </p>

              <div class="role-perks-box">
                <div class="perk-row">
                  <span class="check-icon amber">✓</span>
                  <span>100 km radar scan around your boiler / plant gate</span>
                </div>
                <div class="perk-row">
                  <span class="check-icon amber">✓</span>
                  <span>Aggregate regional FPO lots into 500+ tonne bulk pools</span>
                </div>
                <div class="perk-row">
                  <span class="check-icon amber">✓</span>
                  <span>Compare multiple 3PL quotations with zero hidden costs</span>
                </div>
                <div class="perk-row">
                  <span class="check-icon amber">✓</span>
                  <span>Weighbridge tare clearance & moisture lab fraud protection</span>
                </div>
              </div>
            </div>

            <button class="btn-buyer-action">
              <span>Enter as Industrial Buyer</span>
              <app-icon name="arrow-right" [size]="15"></app-icon>
            </button>
          </div>

          <!-- Card 3: 3PL Transport Partner -->
          <div class="role-card card-transporter" (click)="chooseRole('transporter')">
            <div class="card-glow-bg purple-glow"></div>

            <div class="card-header-bar">
              <span class="role-category-tag font-outfit">🚛 3PL LOGISTICS NETWORK</span>
              <span class="verified-tag font-outfit">95% Net Payout</span>
            </div>

            <div class="card-icon-hero">
              <span class="card-emoji">🚛</span>
              <div class="icon-ring ring-purple"></div>
            </div>

            <div class="role-content">
              <h3 class="card-role-title font-outfit">3PL Transport Company</h3>
              <p class="card-role-desc">
                Independent logistics companies providing dedicated agricultural residue haulage from farms to industrial plants.
              </p>

              <div class="role-perks-box">
                <div class="perk-row">
                  <span class="check-icon purple">✓</span>
                  <span>Register commercial fleet (Pick-Up, Eicher, Taurus, Multi-Axle)</span>
                </div>
                <div class="perk-row">
                  <span class="check-icon purple">✓</span>
                  <span>Receive bulk booking requests and submit custom quotations</span>
                </div>
                <div class="perk-row">
                  <span class="check-icon purple">✓</span>
                  <span>Live GPS milestone updates and Weighbridge POD upload</span>
                </div>
                <div class="perk-row">
                  <span class="check-icon purple">✓</span>
                  <span>Guaranteed 95% freight payout released upon delivery</span>
                </div>
              </div>
            </div>

            <button class="btn-transporter-action">
              <span>Enter as 3PL Partner</span>
              <app-icon name="arrow-right" [size]="15"></app-icon>
            </button>
          </div>

          <!-- Card 4: Platform Administrator -->
          <div class="role-card card-admin" (click)="chooseRole('admin')">
            <div class="card-glow-bg blue-glow"></div>

            <div class="card-header-bar">
              <span class="role-category-tag font-outfit">🛡️ PLATFORM OPERATIONS</span>
              <span class="admin-tag font-outfit">Audit Ledger</span>
            </div>

            <div class="card-icon-hero">
              <span class="card-emoji">🛡️</span>
              <div class="icon-ring ring-blue"></div>
            </div>

            <div class="role-content">
              <h3 class="card-role-title font-outfit">Platform Administrator</h3>
              <p class="card-role-desc">
                Monitor system operations, approve verified 3PL transport companies, and oversee the 2% residue + 5% transport revenue ledger.
              </p>

              <div class="role-perks-box">
                <div class="perk-row">
                  <span class="check-icon blue">✓</span>
                  <span>Transparent 2% residue + 5% transport platform revenue metrics</span>
                </div>
                <div class="perk-row">
                  <span class="check-icon blue">✓</span>
                  <span>Review and approve 3PL transport partner applications</span>
                </div>
                <div class="perk-row">
                  <span class="check-icon blue">✓</span>
                  <span>Real-time financial audit ledger and escrow disbursement tracking</span>
                </div>
                <div class="perk-row">
                  <span class="check-icon blue">✓</span>
                  <span>Zero subscription model enforcement and dispute resolution</span>
                </div>
              </div>
            </div>

            <button class="btn-admin-action">
              <span>Enter as Administrator</span>
              <app-icon name="arrow-right" [size]="15"></app-icon>
            </button>
          </div>
        </div>

        <!-- Clean Footer Guidance -->
        <footer class="footer-note">
          <span class="footer-icon">🌱</span>
          <span>Zero fake data. Live pan-India agricultural dispatch network. You can switch roles at any time from your sidebar.</span>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .role-select-page {
      min-height: 100vh;
      background-color: var(--background);
      color: var(--primary-text);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 20px;
      position: relative;
      overflow-x: hidden;
    }

    .ambient-sunlight {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 700px;
      height: 400px;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 80%);
      pointer-events: none;
    }

    .role-container {
      max-width: 960px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 36px;
      position: relative;
      z-index: 2;
    }

    /* Big Bold Centered Title Header */
    .brand-hero-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 10px;
    }

    .logo-wrapper {
      margin-bottom: 4px;
      transition: transform 0.25s ease;
    }

    .logo-wrapper:hover {
      transform: scale(1.05);
    }

    .title-lockup {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .brand-hero-title {
      font-family: 'Syne', sans-serif !important;
      font-size: clamp(44px, 7vw, 68px);
      font-weight: 900;
      letter-spacing: 0.07em;
      line-height: 1;
      margin: 0;
      background: linear-gradient(135deg, #166534 0%, #15803D 35%, #D97706 70%, #B45309 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 2px 12px rgba(22, 101, 52, 0.2));
    }

    [data-theme="dark"] .brand-hero-title {
      background: linear-gradient(135deg, #FAF7F0 0%, #FDE68A 35%, #F59E0B 70%, #10B981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 4px 20px rgba(245, 158, 11, 0.3));
    }

    .brand-gold-bar {
      width: 120px;
      height: 3px;
      background: linear-gradient(90deg, transparent, #D97706, #10B981, transparent);
      border-radius: 999px;
    }

    .brand-hero-sub {
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: var(--secondary-text);
      letter-spacing: 0.04em;
    }

    .network-badge-strip {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 4px;
      margin-bottom: 12px;
    }

    .net-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 999px;
      font-family: 'Outfit', sans-serif;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .pill-farmer {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #047857;
    }

    [data-theme="dark"] .pill-farmer {
      color: #34D399;
    }

    .pill-radar {
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #B45309;
    }

    [data-theme="dark"] .pill-radar {
      color: #FBBF24;
    }

    .pill-buyer {
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #1D4ED8;
    }

    [data-theme="dark"] .pill-buyer {
      color: #93C5FD;
    }

    .pill-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .pill-dot.green { background-color: #10B981; }
    .pill-dot.amber { background-color: #F59E0B; }
    .pill-dot.blue { background-color: #3B82F6; }

    .net-dot {
      color: var(--border);
      font-size: 12px;
    }

    .select-prompt {
      font-size: 22px;
      font-weight: 700;
      color: var(--primary-text);
      margin: 8px 0 0 0;
    }

    .select-desc {
      font-size: 13px;
      color: var(--secondary-text);
      max-width: 580px;
      line-height: 1.5;
    }

    /* Cards Grid */
    .cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .role-card {
      border: 1.5px solid var(--border);
      border-radius: 16px;
      padding: 28px;
      background-color: var(--card-background);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }

    .card-glow-bg {
      position: absolute;
      top: -40px;
      right: -40px;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(40px);
      transition: opacity 0.25s ease;
      opacity: 0.4;
    }

    .green-glow { background: rgba(16, 185, 129, 0.35); }
    .amber-glow { background: rgba(245, 158, 11, 0.35); }
    .purple-glow { background: rgba(168, 85, 247, 0.35); }
    .blue-glow { background: rgba(59, 130, 246, 0.35); }

    .card-farmer:hover {
      border-color: #10B981;
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(16, 185, 129, 0.15);
    }

    .card-buyer:hover {
      border-color: #F59E0B;
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(245, 158, 11, 0.15);
    }

    .card-transporter:hover {
      border-color: #A855F7;
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(168, 85, 247, 0.18);
    }

    .card-admin:hover {
      border-color: #3B82F6;
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(59, 130, 246, 0.18);
    }

    .card-farmer:hover .card-glow-bg,
    .card-buyer:hover .card-glow-bg,
    .card-transporter:hover .card-glow-bg,
    .card-admin:hover .card-glow-bg {
      opacity: 0.8;
    }

    .card-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .role-category-tag {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--secondary-text);
    }

    .apmc-tag {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #047857;
    }

    [data-theme="dark"] .apmc-tag {
      color: #34D399;
    }

    .escrow-tag {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #B45309;
    }

    .verified-tag {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(168, 85, 247, 0.12);
      border: 1px solid rgba(168, 85, 247, 0.3);
      color: #7E22CE;
    }

    .admin-tag {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #1D4ED8;
    }

    [data-theme="dark"] .escrow-tag {
      color: #FBBF24;
    }

    .card-icon-hero {
      position: relative;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
    }

    .card-emoji {
      font-size: 28px;
    }

    .icon-ring {
      position: absolute;
      inset: -4px;
      border-radius: 16px;
      border: 1.5px dashed rgba(16, 185, 129, 0.3);
    }

    .ring-amber {
      border-color: rgba(245, 158, 11, 0.3);
    }

    .ring-purple {
      border-color: rgba(168, 85, 247, 0.4);
    }

    .ring-blue {
      border-color: rgba(59, 130, 246, 0.4);
    }

    .role-content {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
    }

    .card-role-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-text);
      margin: 0;
    }

    .card-role-desc {
      font-size: 13px;
      line-height: 1.5;
      color: var(--secondary-text);
      margin: 0;
    }

    .role-perks-box {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background-color: var(--sidebar-background);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
      margin-top: 4px;
    }

    .perk-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 12px;
      line-height: 1.4;
      color: var(--primary-text);
    }

    .check-icon {
      color: #10B981;
      font-weight: 800;
      flex-shrink: 0;
    }

    .check-icon.amber {
      color: #F59E0B;
    }

    .check-icon.purple {
      color: #A855F7;
    }

    .check-icon.blue {
      color: #3B82F6;
    }

    .btn-farmer-action {
      width: 100%;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      font-family: 'Outfit', sans-serif;
      background: linear-gradient(135deg, #15803D 0%, #166534 100%);
      color: #FFFFFF;
      border: 1px solid #16A34A;
      box-shadow: 0 4px 14px rgba(22, 101, 52, 0.25);
      margin-top: auto;
      transition: all 0.2s ease;
    }

    .role-card:hover .btn-farmer-action {
      background: linear-gradient(135deg, #16A34A 0%, #15803D 100%);
      box-shadow: 0 6px 18px rgba(22, 101, 52, 0.4);
    }

    .btn-buyer-action {
      width: 100%;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      font-family: 'Outfit', sans-serif;
      background: linear-gradient(135deg, #B45309 0%, #78350F 100%);
      color: #FFFFFF;
      border: 1px solid #F59E0B;
      box-shadow: 0 4px 14px rgba(180, 83, 9, 0.25);
      margin-top: auto;
      transition: all 0.2s ease;
    }

    .role-card:hover .btn-buyer-action {
      background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
      box-shadow: 0 6px 18px rgba(180, 83, 9, 0.4);
    }

    .btn-transporter-action {
      width: 100%;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      font-family: 'Outfit', sans-serif;
      background: linear-gradient(135deg, #7E22CE 0%, #581C87 100%);
      color: #FFFFFF;
      border: 1px solid #A855F7;
      box-shadow: 0 4px 14px rgba(126, 34, 206, 0.25);
      margin-top: auto;
      transition: all 0.2s ease;
    }

    .role-card:hover .btn-transporter-action {
      background: linear-gradient(135deg, #9333EA 0%, #7E22CE 100%);
      box-shadow: 0 6px 18px rgba(126, 34, 206, 0.4);
    }

    .btn-admin-action {
      width: 100%;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      font-family: 'Outfit', sans-serif;
      background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
      color: #FFFFFF;
      border: 1px solid #3B82F6;
      box-shadow: 0 4px 14px rgba(29, 78, 216, 0.25);
      margin-top: auto;
      transition: all 0.2s ease;
    }

    .role-card:hover .btn-admin-action {
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
      box-shadow: 0 6px 18px rgba(29, 78, 216, 0.4);
    }

    .footer-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 12px;
      color: var(--secondary-text);
      text-align: center;
      border-top: 1px dashed var(--border);
      padding-top: 20px;
    }

    .footer-icon {
      font-size: 14px;
    }

    @media (max-width: 800px) {
      .cards-grid {
        grid-template-columns: 1fr;
      }
      .brand-hero-title {
        font-size: 42px;
      }
    }
  `]
})
export class RoleSelectComponent {
  private authService = inject(AuthService);

  chooseRole(role: UserRole): void {
    this.authService.chooseRole(role);
  }
}
