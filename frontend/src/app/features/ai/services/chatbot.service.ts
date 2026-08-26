import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { toHttpParams } from '../../../shared/utils/http-params.util';
import { ChatHistoryResponse, ChatResponse, SendMessageRequest } from '../models/chatbot.model';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly baseUrl = `${environment.apiUrl}/chatbot`;

  private http = inject(HttpClient);

  /** Rate limited to 30/min server-side, so the caller must disable its own send button. */
  sendMessage(payload: SendMessageRequest): Observable<ApiResponse<ChatResponse>> {
    return this.http.post<ApiResponse<ChatResponse>>(`${this.baseUrl}/message`, payload);
  }

  /** Scoped to the signed-in user server-side; a sessionId alone won't reach anyone else's. */
  getHistory(
    query: { sessionId?: string; patientId?: string; page?: number; limit?: number } = {}
  ): Observable<ApiResponse<ChatHistoryResponse>> {
    return this.http.get<ApiResponse<ChatHistoryResponse>>(`${this.baseUrl}/history`, {
      params: toHttpParams(query),
    });
  }

  clearHistory(body: { sessionId?: string; patientId?: string }): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/history`, { body });
  }

  /**
   * Voice input. The endpoint expects multipart with the file under `audio`.
   * Transcription and the reply come back together.
   */
  sendAudio(
    file: Blob,
    options: { sessionId?: string; patientId?: string; language?: string; format?: string } = {}
  ): Observable<ApiResponse<ChatResponse & { transcription: string }>> {
    const formData = new FormData();
    formData.append('audio', file, `recording.${options.format ?? 'webm'}`);
    if (options.sessionId) formData.append('sessionId', options.sessionId);
    if (options.patientId) formData.append('patientId', options.patientId);
    if (options.language) formData.append('language', options.language);
    if (options.format) formData.append('format', options.format);

    return this.http.post<ApiResponse<ChatResponse & { transcription: string }>>(
      `${this.baseUrl}/audio`,
      formData
    );
  }
}
