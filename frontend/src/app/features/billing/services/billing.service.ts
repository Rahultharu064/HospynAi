import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';
import { toHttpParams } from '../../../shared/utils/http-params.util';
import { CreatePaymentRequest, PaymentQuery, PaymentResponse, ProcessPaymentRequest, RevenueStats } from '../models/billing.model';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly baseUrl = `${environment.apiUrl}/billing`;

  private http = inject(HttpClient);

  list(query: PaymentQuery): Observable<PaginatedResponse<PaymentResponse>> {
    return this.http.get<PaginatedResponse<PaymentResponse>>(`${this.baseUrl}/payments`, { params: toHttpParams(query) });
  }

  getById(id: string): Observable<ApiResponse<PaymentResponse>> {
    return this.http.get<ApiResponse<PaymentResponse>>(`${this.baseUrl}/payments/${id}`);
  }

  create(payload: CreatePaymentRequest): Observable<ApiResponse<PaymentResponse>> {
    return this.http.post<ApiResponse<PaymentResponse>>(`${this.baseUrl}/payments`, payload);
  }

  process(payload: ProcessPaymentRequest): Observable<ApiResponse<PaymentResponse>> {
    return this.http.post<ApiResponse<PaymentResponse>>(`${this.baseUrl}/payments/process`, payload);
  }

  refund(id: string, amount?: number, reason?: string): Observable<ApiResponse<PaymentResponse>> {
    return this.http.post<ApiResponse<PaymentResponse>>(`${this.baseUrl}/payments/${id}/refund`, { amount, reason });
  }

  getRevenue(): Observable<ApiResponse<RevenueStats>> {
    return this.http.get<ApiResponse<RevenueStats>>(`${this.baseUrl}/revenue`);
  }
}
