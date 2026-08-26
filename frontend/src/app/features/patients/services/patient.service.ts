import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';
import { toHttpParams } from '../../../shared/utils/http-params.util';
import {
  CreatePatientRequest,
  PatientDocumentResponse,
  PatientQuery,
  PatientResponse,
  PatientStats,
  UpdatePatientRequest,
} from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly baseUrl = `${environment.apiUrl}/patient`;

  private http = inject(HttpClient);

  list(query: PatientQuery): Observable<PaginatedResponse<PatientResponse>> {
    return this.http.get<PaginatedResponse<PatientResponse>>(this.baseUrl, { params: toHttpParams(query) });
  }

  /**
   * The clinical record belonging to the signed-in user. A patient's login and their
   * chart are separate rows joined only by email, so this is the one way the app can
   * turn "who is signed in" into the patientId that appointments and EMR need.
   * 404s when no chart matches the account.
   */
  me(): Observable<ApiResponse<PatientResponse>> {
    return this.http.get<ApiResponse<PatientResponse>>(`${this.baseUrl}/me`);
  }

  getById(id: string): Observable<ApiResponse<PatientResponse>> {
    return this.http.get<ApiResponse<PatientResponse>>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreatePatientRequest): Observable<ApiResponse<PatientResponse>> {
    return this.http.post<ApiResponse<PatientResponse>>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdatePatientRequest): Observable<ApiResponse<PatientResponse>> {
    return this.http.patch<ApiResponse<PatientResponse>>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }

  stats(): Observable<ApiResponse<PatientStats>> {
    return this.http.get<ApiResponse<PatientStats>>(`${this.baseUrl}/stats`);
  }

  getDocuments(patientId: string): Observable<ApiResponse<PatientDocumentResponse[]>> {
    return this.http.get<ApiResponse<PatientDocumentResponse[]>>(`${this.baseUrl}/${patientId}/documents`);
  }

  uploadDocument(
    patientId: string,
    documentType: string,
    title: string,
    file: File,
    description?: string
  ): Observable<ApiResponse<PatientDocumentResponse>> {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('document', file);
    return this.http.post<ApiResponse<PatientDocumentResponse>>(`${this.baseUrl}/${patientId}/documents`, formData);
  }
}
