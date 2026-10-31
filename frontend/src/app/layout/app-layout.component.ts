import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { ThemeService } from '../core/services/theme.service';
import { AuthService } from '../core/services/auth.service';
import { NotificationService } from '../core/services/notification.service';
import { MarketplaceService } from '../core/services/marketplace.service';
import { IconComponent } from '../shared/components/icon/icon.component';
import { LogoComponent } from '../shared/components/logo/logo.component';
import { AiChatbotComponent } from '../shared/components/ai-chatbot/ai-chatbot.component';
import { SplashService } from '../core/services/splash.service';
import { I18nService } from '../core/services/i18n.service';
import { I18nLanguage, UserRole } from '../core/models/marketplace.model';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number | string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, LogoComponent, AiChatbotComponent],
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.css']
})
export class AppLayoutComponent {
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  marketplaceService = inject(MarketplaceService);
  splashService = inject(SplashService);
  i18nService = inject(I18nService);
  private router = inject(Router);

  isMobileSidebarOpen = signal<boolean>(false);
  isLangDropdownOpen = signal<boolean>(false);
  currentPageTitle = signal<string>('Overview');

  // Role-specific navigation arrays
  sellerNavItems: NavItem[] = [
    { label: 'Seller Dashboard', route: '/seller-dashboard', icon: 'trending-up' },
    { label: '100 km Live Radar & Map', route: '/proximity-radar', icon: 'radar' },
    { label: 'Residue Categories', route: '/residue-categories', icon: 'grid' },
    { label: 'Freight Calculator', route: '/logistics-calculator', icon: 'truck' },
    { label: 'New Listing', route: '/new-listing', icon: 'plus' },
    { label: 'Offers & Inquiries', route: '/negotiations', icon: 'message' },
    { label: 'Dispatch Orders', route: '/orders', icon: 'truck' },
    { label: 'Notifications', route: '/notifications', icon: 'bell' }
  ];

  buyerNavItems: NavItem[] = [
    { label: 'Buyer Dashboard', route: '/buyer-dashboard', icon: 'scale' },
    { label: 'Multi-Farmer Optimizer', route: '/order-optimizer', icon: 'layers' },
    { label: '100 km Live Radar & Map', route: '/proximity-radar', icon: 'radar' },
    { label: 'Find Suppliers (AQI)', route: '/suppliers', icon: 'search' },
    { label: 'Freight Calculator', route: '/logistics-calculator', icon: 'truck' },
    { label: 'Bulk Requirements', route: '/bulk-requirements', icon: 'layers' },
    { label: 'Residue Categories', route: '/residue-categories', icon: 'grid' },
    { label: 'Negotiations', route: '/negotiations', icon: 'message' },
    { label: 'Active Orders', route: '/orders', icon: 'shopping-bag' },
    { label: 'Notifications', route: '/notifications', icon: 'bell' }
  ];

  transporterNavItems: NavItem[] = [
    { label: '3PL Workspace', route: '/transporter-dashboard', icon: 'truck' },
    { label: 'Freight Calculator', route: '/logistics-calculator', icon: 'dollar-sign' },
    { label: '100 km Live Radar & Map', route: '/proximity-radar', icon: 'radar' },
    { label: 'Transport Deliveries', route: '/orders', icon: 'shopping-bag' },
    { label: 'Negotiations', route: '/negotiations', icon: 'message' },
    { label: 'Notifications', route: '/notifications', icon: 'bell' }
  ];

  adminNavItems: NavItem[] = [
    { label: 'Admin Revenue & Oversight', route: '/admin-dashboard', icon: 'trending-up' },
    { label: 'Marketplace Suppliers', route: '/suppliers', icon: 'search' },
    { label: '100 km Radar & Map', route: '/proximity-radar', icon: 'radar' },
    { label: 'All Orders & Escrows', route: '/orders', icon: 'shopping-bag' },
    { label: 'Notifications', route: '/notifications', icon: 'bell' }
  ];

  activeNavItems = computed(() => {
    const role = this.authService.selectedRole();
    if (role === 'farmer') return this.sellerNavItems;
    if (role === 'transporter') return this.transporterNavItems;
    if (role === 'admin') return this.adminNavItems;
    return this.buyerNavItems;
  });

  currentUrl = signal<string>(this.router.url);

  isAuthRoute = computed(() => {
    const url = this.currentUrl();
    return url.includes('/role-select') || url.includes('/login') || url === '/';
  });

  constructor() {
    this.updateTitle(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const activeUrl = event.urlAfterRedirects || event.url;
      this.currentUrl.set(activeUrl);
      this.updateTitle(activeUrl);
      this.isMobileSidebarOpen.set(false);
      this.isLangDropdownOpen.set(false);
    });
  }

  toggleLangDropdown(): void {
    this.isLangDropdownOpen.update(v => !v);
  }

  selectLanguage(lang: I18nLanguage): void {
    this.i18nService.setLanguage(lang);
    this.isLangDropdownOpen.set(false);
  }

  switchRoleDirect(role: UserRole): void {
    this.authService.switchRoleTo(role);
  }

  private updateTitle(url: string): void {
    if (url.includes('/seller-dashboard')) this.currentPageTitle.set(this.i18nService.t('nav.sellerDashboard', 'Seller Dashboard'));
    else if (url.includes('/buyer-dashboard')) this.currentPageTitle.set(this.i18nService.t('nav.buyerDashboard', 'Buyer Dashboard'));
    else if (url.includes('/transporter-dashboard')) this.currentPageTitle.set(this.i18nService.t('nav.transporterDashboard', '3PL Logistics Workspace'));
    else if (url.includes('/admin-dashboard')) this.currentPageTitle.set(this.i18nService.t('nav.adminDashboard', 'Admin Revenue & Oversight'));
    else if (url.includes('/order-optimizer')) this.currentPageTitle.set('Multi-Farmer Order Optimizer (USP 1)');
    else if (url.includes('/logistics-calculator')) this.currentPageTitle.set('Smart Logistics Cost Calculator (USP 2)');
    else if (url.includes('/residue-categories')) this.currentPageTitle.set('Residue Categories');
    else if (url.includes('/new-listing')) this.currentPageTitle.set('Create Residue Listing');
    else if (url.includes('/suppliers')) this.currentPageTitle.set('Find Biomass Suppliers');
    else if (url.includes('/bulk-requirements')) this.currentPageTitle.set('Bulk Demand Pools');
    else if (url.includes('/proximity-radar')) this.currentPageTitle.set('100 km Live Radar & Smart Geospatial Map');
    else if (url.includes('/negotiations')) this.currentPageTitle.set(this.i18nService.t('nav.negotiations', 'Multilingual Negotiation Desk'));
    else if (url.includes('/orders')) this.currentPageTitle.set(this.i18nService.t('nav.orders', 'Consignment Orders'));
    else if (url.includes('/notifications')) this.currentPageTitle.set('Notifications');
    else if (url.includes('/profile')) this.currentPageTitle.set('Profile & Settings');
    else this.currentPageTitle.set('AgriMech');
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  switchRole(): void {
    this.authService.switchRole();
  }

  logout(): void {
    this.authService.logout();
  }

  replayIntro(): void {
    this.splashService.show();
  }

  // Global Location Bar Modal & Live Switcher
  isLocationModalOpen = signal<boolean>(false);
  locationSearchInput: string = '';
  isSearchingLocation = signal<boolean>(false);
  locationSearchMessage = signal<string | null>(null);

  openLocationModal(): void {
    this.isLocationModalOpen.set(true);
    this.locationSearchMessage.set(null);
  }

  closeLocationModal(): void {
    this.isLocationModalOpen.set(false);
  }

  selectHub(hubId: string): void {
    this.marketplaceService.setHub(hubId);
    this.closeLocationModal();
  }

  async triggerLiveGps(): Promise<void> {
    try {
      this.isSearchingLocation.set(true);
      this.locationSearchMessage.set('Detecting GPS coordinates via device browser...');
      const loc = await this.marketplaceService.detectLiveLocation();
      this.locationSearchMessage.set(`Locked on: ${loc.name}`);
      setTimeout(() => {
        this.isSearchingLocation.set(false);
        this.closeLocationModal();
      }, 700);
    } catch (err: any) {
      this.isSearchingLocation.set(false);
      this.locationSearchMessage.set(`GPS Permission or lookup error: ${err.message || 'Please type town name directly'}`);
    }
  }

  async submitLocationSearch(): Promise<void> {
    if (!this.locationSearchInput.trim()) return;
    try {
      this.isSearchingLocation.set(true);
      this.locationSearchMessage.set(`Searching gazetteer and satellite data for "${this.locationSearchInput}"...`);
      const loc = await this.marketplaceService.searchAndSetLocation(this.locationSearchInput);
      this.locationSearchMessage.set(`Location verified: ${loc.name}`);
      this.locationSearchInput = '';
      setTimeout(() => {
        this.isSearchingLocation.set(false);
        this.closeLocationModal();
      }, 700);
    } catch (err: any) {
      this.isSearchingLocation.set(false);
      this.locationSearchMessage.set(`Search error: ${err.message}`);
    }
  }
}
