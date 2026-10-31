import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Vehicle, TransportBooking, TransportQuotation, ProofOfDelivery } from '../models/marketplace.model';
import { getApiBaseUrl } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class TransportService {
  private http = inject(HttpClient);
  private apiUrl = `${getApiBaseUrl()}/transport`;

  vehicles = signal<Vehicle[]>([]);
  transportRequests = signal<TransportBooking[]>([]);
  activeDeliveries = signal<TransportBooking[]>([]);

  private getHeaders(): { [key: string]: string } {
    const token = localStorage.getItem('agrimech_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  fetchVehicles(): Observable<{ success: boolean; data: Vehicle[] }> {
    return this.http.get<{ success: boolean; data: Vehicle[] }>(`${this.apiUrl}/vehicles`, {
      headers: this.getHeaders()
    }).pipe(
      tap(res => {
        if (res && res.data) {
          this.vehicles.set(res.data);
        }
      })
    );
  }

  createVehicle(vehicleData: Partial<Vehicle>): Observable<{ success: boolean; data: Vehicle; message: string }> {
    return this.http.post<{ success: boolean; data: Vehicle; message: string }>(`${this.apiUrl}/vehicles`, vehicleData, {
      headers: this.getHeaders()
    }).pipe(
      tap(res => {
        if (res && res.data) {
          this.vehicles.update(list => [res.data, ...list]);
        }
      })
    );
  }

  updateVehicleStatus(id: string, status: string): Observable<{ success: boolean; data: Vehicle }> {
    return this.http.patch<{ success: boolean; data: Vehicle }>(`${this.apiUrl}/vehicles/${id}/status`, { status }, {
      headers: this.getHeaders()
    }).pipe(
      tap(res => {
        if (res && res.data) {
          this.vehicles.update(list => list.map(v => (v._id === id || v.id === id) ? res.data : v));
        }
      })
    );
  }

  fetchTransportRequests(status?: string): Observable<{ success: boolean; data: TransportBooking[] }> {
    const url = status ? `${this.apiUrl}/requests?status=${status}` : `${this.apiUrl}/requests`;
    return this.http.get<{ success: boolean; data: TransportBooking[] }>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(res => {
        if (res && res.data) {
          this.transportRequests.set(res.data);
          this.activeDeliveries.set(res.data.filter(b => ['booked', 'dispatched', 'in_transit', 'delivered'].includes(b.status)));
        }
      })
    );
  }

  getBookingById(id: string): Observable<{ success: boolean; data: TransportBooking }> {
    return this.http.get<{ success: boolean; data: TransportBooking }>(`${this.apiUrl}/requests/${id}`, {
      headers: this.getHeaders()
    });
  }

  submitQuotation(quoteData: {
    bookingId: string;
    vehicleType: string;
    vehicleCapacityTonnes: number;
    vehicleRegistrationNumber?: string;
    driverName?: string;
    driverPhone?: string;
    quoteAmount: number;
    estimatedDays: number;
    notes?: string;
  }): Observable<{ success: boolean; data: TransportQuotation; message: string }> {
    return this.http.post<{ success: boolean; data: TransportQuotation; message: string }>(`${this.apiUrl}/quotations`, quoteData, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.fetchTransportRequests().subscribe();
      })
    );
  }

  selectQuotation(bookingId: string, quotationId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/select-quotation`, {
      bookingId,
      quotationId
    }, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.fetchTransportRequests().subscribe();
      })
    );
  }

  updateLiveTracking(bookingId: string, trackingData: {
    lat: number;
    lng: number;
    locationName: string;
    statusNote: string;
    status?: string;
  }): Observable<{ success: boolean; data: TransportBooking }> {
    return this.http.post<{ success: boolean; data: TransportBooking }>(`${this.apiUrl}/tracking/${bookingId}`, trackingData, {
      headers: this.getHeaders()
    }).pipe(
      tap(res => {
        if (res && res.data) {
          this.activeDeliveries.update(list => list.map(b => (b._id === bookingId || b.id === bookingId) ? res.data : b));
        }
      })
    );
  }

  submitProofOfDelivery(bookingId: string, podData: {
    slipNumber: string;
    weighbridgeGrossTonnes: number;
    weighbridgeTareTonnes: number;
    documentUrl?: string;
    receiverNotes?: string;
  }): Observable<{ success: boolean; data: ProofOfDelivery; message: string }> {
    return this.http.post<{ success: boolean; data: ProofOfDelivery; message: string }>(`${this.apiUrl}/pod/${bookingId}`, podData, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.fetchTransportRequests().subscribe();
      })
    );
  }

  verifyProofOfDelivery(bookingId: string): Observable<{ success: boolean; data: any; message: string }> {
    return this.http.post<{ success: boolean; data: any; message: string }>(`${this.apiUrl}/verify-pod/${bookingId}`, {}, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.fetchTransportRequests().subscribe();
      })
    );
  }
}
