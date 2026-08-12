import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { toHttpParams } from '../../../shared/utils/http-params.util';
import {
  CreateOrganizationRequest,
  CreateUserRequest,
  OrganizationListResponse,
  OrganizationResponse,
  PlatformStats,
  SystemHealthResponse,
  UpdateUserRequest,
  UserListResponse,
  UserManagementResponse,
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  private http = inject(HttpClient);

  listOrganizations(query: { page?: number; limit?: number; search?: string } = {}): Observable<OrganizationListResponse> {
    return this.http.get<OrganizationListResponse>(`${this.baseUrl}/organizations`, { params: toHttpParams(query) });
  }

  createOrganization(payload: CreateOrganizationRequest): Observable<ApiResponse<OrganizationResponse>> {
    return this.http.post<ApiResponse<OrganizationResponse>>(`${this.baseUrl}/organizations`, payload);
  }

  listUsers(query: { page?: number; limit?: number; search?: string; role?: string; status?: string } = {}): Observable<UserListResponse> {
    return this.http.get<UserListResponse>(`${this.baseUrl}/users`, { params: toHttpParams(query) });
  }

  createUser(payload: CreateUserRequest): Observable<ApiResponse<UserManagementResponse>> {
    return this.http.post<ApiResponse<UserManagementResponse>>(`${this.baseUrl}/users`, payload);
  }

  updateUser(id: string, payload: UpdateUserRequest): Observable<ApiResponse<UserManagementResponse>> {
    return this.http.patch<ApiResponse<UserManagementResponse>>(`${this.baseUrl}/users/${id}`, payload);
  }

  systemHealth(): Observable<ApiResponse<SystemHealthResponse>> {
    return this.http.get<ApiResponse<SystemHealthResponse>>(`${this.baseUrl}/health`);
  }

  platformStats(): Observable<ApiResponse<PlatformStats>> {
    return this.http.get<ApiResponse<PlatformStats>>(`${this.baseUrl}/stats`);
  }
}
