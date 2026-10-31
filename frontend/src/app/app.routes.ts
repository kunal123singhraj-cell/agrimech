import { Routes } from '@angular/router';
import { RoleSelectComponent } from './features/role-select/role-select.component';
import { AuthLoginComponent } from './features/auth/login.component';
import { SellerDashboardComponent } from './features/seller-dashboard/seller-dashboard.component';
import { BuyerDashboardComponent } from './features/buyer-dashboard/buyer-dashboard.component';
import { SuppliersComponent } from './features/suppliers/suppliers.component';
import { NewListingComponent } from './features/new-listing/new-listing.component';
import { BulkRequirementsComponent } from './features/bulk-requirements/bulk-requirements.component';
import { ProximityRadarComponent } from './features/proximity-radar/proximity-radar.component';
import { NegotiationsComponent } from './features/negotiations/negotiations.component';
import { OrdersComponent } from './features/orders/orders.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { ProfileComponent } from './features/profile/profile.component';
import { LandingComponent } from './features/landing/landing.component';
import { TransporterDashboardComponent } from './features/transporter-dashboard/transporter-dashboard.component';
import { AdminDashboardComponent } from './features/admin-dashboard/admin-dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // First screen on app load: Role Selection (Seller vs Buyer vs Transporter vs Admin)
  { path: '', redirectTo: 'role-select', pathMatch: 'full' },
  { path: 'role-select', component: RoleSelectComponent },
  { path: 'login', component: AuthLoginComponent },
  { path: 'landing', component: LandingComponent },

  // Seller / Farmer Views (Protected by authGuard and roleGuard)
  {
    path: 'seller-dashboard',
    component: SellerDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'farmer' }
  },
  {
    path: 'new-listing',
    component: NewListingComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'farmer' }
  },

  // Buyer Views (Protected by authGuard and roleGuard)
  {
    path: 'buyer-dashboard',
    component: BuyerDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'buyer' }
  },
  {
    path: 'satellite-intelligence',
    loadComponent: () => import('./features/satellite-intelligence/satellite-intelligence.component').then(m => m.SatelliteIntelligenceComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'buyer' }
  },
  {
    path: 'suppliers',
    component: SuppliersComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'buyer' }
  },
  {
    path: 'proximity-radar',
    component: ProximityRadarComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'buyer' }
  },

  // 3PL Transporter Views (Protected by authGuard and roleGuard)
  {
    path: 'transporter-dashboard',
    component: TransporterDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'transporter' }
  },

  // Admin Views (Protected by authGuard and roleGuard)
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },

  // Shared / Operational Views (Protected by authGuard)
  {
    path: 'bulk-requirements',
    component: BulkRequirementsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'negotiations',
    component: NegotiationsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'orders',
    component: OrdersComponent,
    canActivate: [authGuard]
  },
  {
    path: 'notifications',
    component: NotificationsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'residue-categories',
    loadComponent: () => import('./features/residue-categories/residue-categories.component').then(m => m.ResidueCategoriesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'order-optimizer',
    loadComponent: () => import('./features/order-optimizer/order-optimizer.component').then(m => m.OrderOptimizerComponent),
    canActivate: [authGuard]
  },
  {
    path: 'logistics-calculator',
    loadComponent: () => import('./features/logistics-calculator/logistics-calculator.component').then(m => m.LogisticsCalculatorComponent),
    canActivate: [authGuard]
  },

  // Fallback wildcard route redirects to role selection
  { path: '**', redirectTo: 'role-select' }
];
