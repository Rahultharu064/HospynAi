import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  CreateEMRRequest,
  CreateLabReportRequest,
  CreatePrescriptionRequest,
  EMRListResponse,
  EMRResponse,
  LabReportResponse,
  PrescriptionResponse,
} from '../models/emr.model';

@Injectable({ providedIn: 'root' })
export class EmrService {
  private readonly baseUrl = `${environment.apiUrl}/emr`;

  private http = inject(HttpClient);

  getPatientHistory(patientId: string, page = 1, limit = 20): Observable<EMRListResponse> {
    return this.http.get<EMRListResponse>(`${this.baseUrl}/patient/${patientId}`, {
      params: { page, limit },
    });
  }

  getById(id: string): Observable<ApiResponse<EMRResponse>> {
    return this.http.get<ApiResponse<EMRResponse>>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateEMRRequest): Observable<ApiResponse<EMRResponse>> {
    return this.http.post<ApiResponse<EMRResponse>>(this.baseUrl, payload);
  }

  update(id: string, payload: Partial<CreateEMRRequest>): Observable<ApiResponse<EMRResponse>> {
    return this.http.patch<ApiResponse<EMRResponse>>(`${this.baseUrl}/${id}`, payload);
  }

  sign(id: string): Observable<ApiResponse<EMRResponse>> {
    return this.http.post<ApiResponse<EMRResponse>>(`${this.baseUrl}/${id}/sign`, {});
  }

  createPrescription(payload: CreatePrescriptionRequest): Observable<ApiResponse<PrescriptionResponse>> {
    return this.http.post<ApiResponse<PrescriptionResponse>>(`${this.baseUrl}/prescriptions`, payload);
  }

  createLabReport(payload: CreateLabReportRequest): Observable<ApiResponse<LabReportResponse>> {
    return this.http.post<ApiResponse<LabReportResponse>>(`${this.baseUrl}/lab-reports`, payload);
  }
}
