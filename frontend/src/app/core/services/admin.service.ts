import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { PlatformRevenueMetrics, AuditLedgerEntry, UserProfile } from '../models/marketplace.model';
import { getApiBaseUrl } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${getApiBaseUrl()}/admin`;

  revenueMetrics = signal<PlatformRevenueMetrics | null>(null);
  auditLedger = signal<AuditLedgerEntry[]>([]);
  pending3PLPartners = signal<UserProfile[]>([]);

  private getHeaders(): { [key: string]: string } {
    const token = localStorage.getItem('agrimech_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  fetchRevenueMetrics(): Observable<{ success: boolean; data: PlatformRevenueMetrics }> {
    return this.http.get<{ success: boolean; data: PlatformRevenueMetrics }>(`${this.apiUrl}/revenue-metrics`, {
      headers: this.getHeaders()
    }).pipe(
      tap(res => {
        if (res && res.data) {
          this.revenueMetrics.set(res.data);
        }
      })
    );
  }

  fetchAuditLedger(): Observable<{ success: boolean; data: AuditLedgerEntry[] }> {
    return this.http.get<{ success: boolean; data: AuditLedgerEntry[] }>(`${this.apiUrl}/audit-ledger`, {
      headers: this.getHeaders()
    }).pipe(
      tap(res => {
        if (res && res.data) {
          this.auditLedger.set(res.data);
        }
      })
    );
  }

  fetch3PLPartners(): Observable<{ success: boolean; data: UserProfile[] }> {
    return this.http.get<{ success: boolean; data: UserProfile[] }>(`${this.apiUrl}/3pl-partners`, {
      headers: this.getHeaders()
    }).pipe(
      tap(res => {
        if (res && res.data) {
          this.pending3PLPartners.set(res.data);
        }
      })
    );
  }

  review3PLPartner(userId: string, approvalStatus: 'approved' | 'rejected'): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/review-3pl`, {
      userId,
      approvalStatus
    }, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.fetch3PLPartners().subscribe();
      })
    );
  }

  updateCommissionRates(residueCommissionPercent: number, transportCommissionPercent: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/commission-rates`, {
      residueCommissionPercent,
      transportCommissionPercent
    }, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.fetchRevenueMetrics().subscribe();
      })
    );
  }
}
