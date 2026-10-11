import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { InventoryListResponse, InventoryStats } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly baseUrl = `${environment.apiUrl}/inventory`;
  private readonly http = inject(HttpClient);

  list(query: { page?: number; limit?: number; search?: string; category?: string; lowStock?: boolean } = {}): Observable<ApiResponse<InventoryListResponse>> {
    return this.http.get<ApiResponse<InventoryListResponse>>(this.baseUrl, { params: query as any });
  }

  stats(): Observable<ApiResponse<InventoryStats>> {
    return this.http.get<ApiResponse<InventoryStats>>(`${this.baseUrl}/stats`);
  }
}
