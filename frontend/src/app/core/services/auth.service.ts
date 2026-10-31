import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { UserProfile, UserRole } from '../models/marketplace.model';
import { getApiBaseUrl } from '../config/api.config';

export interface SendOtpResponse {
  success: boolean;
  message: string;
  phone: string;
  expiresInSeconds?: number;
  provider?: string;
  devOtp?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  isNewUser: boolean;
  token?: string;
  user?: UserProfile;
  phone?: string;
  message: string;
}

export interface CompleteRegResponse {
  success: boolean;
  token: string;
  user: UserProfile;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private apiUrl = `${getApiBaseUrl()}/auth`;

  // State signals
  selectedRole = signal<UserRole | null>(null);
  isLoggedIn = signal<boolean>(false);
  currentUser = signal<UserProfile | null>(null);

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    const savedRole = localStorage.getItem('agrimech_role') as UserRole | null;
    const savedAuth = localStorage.getItem('agrimech_auth') === 'true';

    if (savedRole) {
      this.selectedRole.set(savedRole);
    }

    if (savedAuth && savedRole) {
      const savedUser = localStorage.getItem('agrimech_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          // Purge legacy mock users to enforce Zero Fake Data Policy
          if (parsed && (
            parsed.id === 'USR-FARM-201' ||
            parsed.id === 'USR-BUYER-201' ||
            parsed.name === 'Manjunatha Gowda' ||
            parsed.name === 'Raghavendra Rao'
          )) {
            this.logout();
            return;
          }
          this.currentUser.set(parsed);
          this.isLoggedIn.set(true);
        } catch {
          this.logout();
        }
      }
    }
  }

  chooseRole(role: UserRole): void {
    this.selectedRole.set(role);
    localStorage.setItem('agrimech_role', role);
    this.router.navigate(['/login']);
  }

  setRole(role: UserRole): void {
    this.selectedRole.set(role);
    localStorage.setItem('agrimech_role', role);
  }

  /**
   * Request real 6-digit OTP for 10-digit mobile number
   */
  sendOtp(phone: string): Observable<SendOtpResponse> {
    return this.http.post<SendOtpResponse>(`${this.apiUrl}/send-otp`, { phone });
  }

  /**
   * Verify entered 6-digit OTP code
   */
  verifyOtp(phone: string, otp: string): Observable<VerifyOtpResponse> {
    return this.http.post<VerifyOtpResponse>(`${this.apiUrl}/verify-otp`, { phone, otp }).pipe(
      tap((res) => {
        if (res && res.success && !res.isNewUser && res.user && res.token) {
          this.setRealUserSession(res.user, res.token);
        }
      })
    );
  }

  /**
   * Complete real profile registration in MongoDB Atlas
   */
  completeRegistration(data: {
    phone: string;
    name: string;
    role: UserRole;
    organization?: string;
    district: string;
    state: string;
  }): Observable<CompleteRegResponse> {
    return this.http.post<CompleteRegResponse>(`${this.apiUrl}/complete-registration`, data).pipe(
      tap((res) => {
        if (res && res.success && res.user && res.token) {
          this.setRealUserSession(res.user, res.token);
        }
      })
    );
  }

  /**
   * Stores real user profile, JWT token, and navigates to the relevant dashboard
   */
  setRealUserSession(user: UserProfile, token: string): void {
    this.currentUser.set(user);
    this.selectedRole.set(user.role);
    this.isLoggedIn.set(true);

    localStorage.setItem('agrimech_auth', 'true');
    localStorage.setItem('agrimech_role', user.role);
    localStorage.setItem('agrimech_token', token);
    localStorage.setItem('agrimech_user', JSON.stringify(user));

    if (user.role === 'farmer') {
      this.router.navigate(['/seller-dashboard']);
    } else if (user.role === 'buyer') {
      this.router.navigate(['/buyer-dashboard']);
    } else if (user.role === 'transporter') {
      this.router.navigate(['/transporter-dashboard']);
    } else if (user.role === 'admin') {
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.router.navigate(['/role-select']);
    }
  }

  /**
   * Real credentials login
   */
  login(role: UserRole, credentials?: { loginId?: string; password?: string }): void {
    this.selectedRole.set(role);

    if (!credentials?.loginId) {
      this.router.navigate(['/login']);
      return;
    }

    const payload = {
      role,
      loginId: credentials.loginId,
      password: credentials?.password || 'password123'
    };

    this.http.post<{ success: boolean; token: string; user: UserProfile }>(`${this.apiUrl}/login`, payload).subscribe({
      next: (res) => {
        if (res && res.token && res.user) {
          this.setRealUserSession(res.user, res.token);
        }
      },
      error: (err) => {
        console.warn('[AuthService] Login failed:', err.message);
        this.router.navigate(['/login']);
      }
    });
  }

  logout(): void {
    this.isLoggedIn.set(false);
    this.selectedRole.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('agrimech_auth');
    localStorage.removeItem('agrimech_role');
    localStorage.removeItem('agrimech_token');
    localStorage.removeItem('agrimech_user');
    this.router.navigate(['/role-select']);
  }

  switchRole(): void {
    const current = this.selectedRole();
    const roleCycle: Record<UserRole, UserRole> = {
      farmer: 'buyer',
      buyer: 'transporter',
      transporter: 'admin',
      admin: 'farmer'
    };
    const newRole: UserRole = current ? roleCycle[current] || 'farmer' : 'farmer';
    this.switchRoleTo(newRole);
  }

  switchRoleTo(newRole: UserRole): void {
    this.selectedRole.set(newRole);
    localStorage.setItem('agrimech_role', newRole);

    const user = this.currentUser();
    if (user) {
      const updatedUser = { ...user, role: newRole };
      this.currentUser.set(updatedUser);
      localStorage.setItem('agrimech_user', JSON.stringify(updatedUser));
    }

    if (newRole === 'farmer') {
      this.router.navigate(['/seller-dashboard']);
    } else if (newRole === 'buyer') {
      this.router.navigate(['/buyer-dashboard']);
    } else if (newRole === 'transporter') {
      this.router.navigate(['/transporter-dashboard']);
    } else if (newRole === 'admin') {
      this.router.navigate(['/admin-dashboard']);
    }
  }

  updateProfile(profile: Partial<UserProfile>): void {
    this.currentUser.update(current => current ? { ...current, ...profile } : null);
    const updated = this.currentUser();
    if (updated) {
      localStorage.setItem('agrimech_user', JSON.stringify(updated));
    }
  }
}
