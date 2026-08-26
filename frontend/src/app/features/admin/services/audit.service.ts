import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';
import { toHttpParams } from '../../../shared/utils/http-params.util';
import { AuditLogResponse, AuditQuery, AuditStats } from '../models/audit.model';

/** Admin-only: every endpoint here is behind authorize(SUPER_ADMIN, ADMIN). */
@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly baseUrl = `${environment.apiUrl}/audit`;

  private http = inject(HttpClient);

  queryLogs(query: AuditQuery = {}): Observable<PaginatedResponse<AuditLogResponse>> {
    return this.http.get<PaginatedResponse<AuditLogResponse>>(`${this.baseUrl}/logs`, {
      params: toHttpParams(query),
    });
  }

  getUserTrail(
    userId: string,
    query: { page?: number; limit?: number } = {}
  ): Observable<PaginatedResponse<AuditLogResponse>> {
    return this.http.get<PaginatedResponse<AuditLogResponse>>(`${this.baseUrl}/logs/user/${userId}`, {
      params: toHttpParams(query),
    });
  }

  getResourceTrail(
    resource: string,
    resourceId: string,
    query: { page?: number; limit?: number } = {}
  ): Observable<PaginatedResponse<AuditLogResponse>> {
    return this.http.get<PaginatedResponse<AuditLogResponse>>(
      `${this.baseUrl}/logs/resource/${resource}/${resourceId}`,
      { params: toHttpParams(query) }
    );
  }

  stats(): Observable<ApiResponse<AuditStats>> {
    return this.http.get<ApiResponse<AuditStats>>(`${this.baseUrl}/stats`);
  }
}
