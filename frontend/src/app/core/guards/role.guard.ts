import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/marketplace.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/role-select']);
  }

  const expectedRole = route.data['role'] as UserRole | undefined;
  const currentRole = authService.selectedRole();

  if (!expectedRole || currentRole === expectedRole) {
    return true;
  }

  // If wrong role, redirect to their proper dashboard
  if (currentRole === 'farmer') {
    return router.createUrlTree(['/seller-dashboard']);
  } else if (currentRole === 'transporter') {
    return router.createUrlTree(['/transporter-dashboard']);
  } else if (currentRole === 'admin') {
    return router.createUrlTree(['/admin-dashboard']);
  } else {
    return router.createUrlTree(['/buyer-dashboard']);
  }
};
