import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';
import { toHttpParams } from '../../../shared/utils/http-params.util';
import {
  AppointmentQuery,
  AppointmentResponse,
  CreateAppointmentRequest,
  QueueTokenRequest,
  SlotAvailability,
} from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly baseUrl = `${environment.apiUrl}/appointments`;

  private http = inject(HttpClient);

  list(query: AppointmentQuery): Observable<PaginatedResponse<AppointmentResponse>> {
    return this.http.get<PaginatedResponse<AppointmentResponse>>(this.baseUrl, { params: toHttpParams(query) });
  }

  getById(id: string): Observable<ApiResponse<AppointmentResponse>> {
    return this.http.get<ApiResponse<AppointmentResponse>>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateAppointmentRequest): Observable<ApiResponse<AppointmentResponse>> {
    return this.http.post<ApiResponse<AppointmentResponse>>(this.baseUrl, payload);
  }

  getAvailability(doctorId: string, date: string): Observable<ApiResponse<SlotAvailability>> {
    return this.http.get<ApiResponse<SlotAvailability>>(`${this.baseUrl}/availability`, {
      params: { doctorId, date },
    });
  }

  reschedule(id: string, payload: { appointmentDate: string; startTime: string; reason?: string }): Observable<ApiResponse<AppointmentResponse>> {
    return this.http.patch<ApiResponse<AppointmentResponse>>(`${this.baseUrl}/${id}/reschedule`, payload);
  }

  cancel(id: string, reason: string): Observable<ApiResponse<AppointmentResponse>> {
    return this.http.patch<ApiResponse<AppointmentResponse>>(`${this.baseUrl}/${id}/cancel`, { reason });
  }

  markNoShow(id: string): Observable<ApiResponse<AppointmentResponse>> {
    return this.http.patch<ApiResponse<AppointmentResponse>>(`${this.baseUrl}/${id}/no-show`, {});
  }

  complete(id: string): Observable<ApiResponse<AppointmentResponse>> {
    return this.http.patch<ApiResponse<AppointmentResponse>>(`${this.baseUrl}/${id}/complete`, {});
  }

  generateQueueToken(payload: QueueTokenRequest): Observable<ApiResponse<AppointmentResponse>> {
    return this.http.post<ApiResponse<AppointmentResponse>>(`${this.baseUrl}/queue/token`, payload);
  }

  getLiveQueue(): Observable<ApiResponse<AppointmentResponse[]>> {
    return this.http.get<ApiResponse<AppointmentResponse[]>>(`${this.baseUrl}/queue/live`);
  }

  callNext(doctorId: string): Observable<ApiResponse<AppointmentResponse | null>> {
    return this.http.post<ApiResponse<AppointmentResponse | null>>(`${this.baseUrl}/queue/call-next`, { doctorId });
  }
}
