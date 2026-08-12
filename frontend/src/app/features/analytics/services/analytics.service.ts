import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { DashboardStats } from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly baseUrl = `${environment.apiUrl}/analytics`;

  private http = inject(HttpClient);

  getDashboard(dateFrom?: string, dateTo?: string): Observable<ApiResponse<DashboardStats>> {
    const params: Record<string, string> = {};
    if (dateFrom) params['dateFrom'] = dateFrom;
    if (dateTo) params['dateTo'] = dateTo;
    return this.http.get<ApiResponse<DashboardStats>>(`${this.baseUrl}/dashboard`, { params });
  }
}
