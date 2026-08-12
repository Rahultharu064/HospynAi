import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api-response.model';
import { DoctorSummary } from '../models/doctor.model';

/** Lightweight doctor lookups shared across Appointments, Patients, EMR and Admin. */
@Injectable({ providedIn: 'root' })
export class DoctorLookupService {
  private readonly baseUrl = `${environment.apiUrl}/doctor`;

  private http = inject(HttpClient);

  list(params: { specialization?: string; search?: string; limit?: number } = {}): Observable<PaginatedResponse<DoctorSummary>> {
    const query: Record<string, string | number> = { limit: params.limit ?? 100 };
    if (params.specialization) query['specialization'] = params.specialization;
    if (params.search) query['search'] = params.search;
    return this.http.get<PaginatedResponse<DoctorSummary>>(this.baseUrl, { params: query });
  }
}
