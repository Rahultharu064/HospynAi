// ============================================
// TELEMEDICINE DTOs
// ============================================

export interface CreateSessionDto {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  scheduledAt?: string;
  duration?: number; // minutes
  recordSession?: boolean;
}

export interface JoinSessionDto {
  sessionId: string;
  userId: string;
  role: 'DOCTOR' | 'PATIENT';
}

export interface SessionSignalDto {
  sessionId: string;
  signal: any; // WebRTC signal data
  type: 'offer' | 'answer' | 'ice-candidate';
}

export interface SessionMessageDto {
  sessionId: string;
  message: string;
  type?: 'text' | 'file' | 'image';
  fileUrl?: string;
}

export interface EndSessionDto {
  sessionId: string;
  reason?: string;
  notes?: string;
}

export interface SessionQueryDto {
  page?: number;
  limit?: number;
  patientId?: string;
  doctorId?: string;
  appointmentId?: string;
  status?: SessionStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type SessionStatus = 
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'DISCONNECTED';

export type ParticipantStatus = 
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'RECONNECTING';

// ============================================
// RESPONSE TYPES
// ============================================

export interface TelemedicineSessionResponse {
  id: string;
  roomId: string;
  appointment: {
    id: string;
    appointmentId: string;
    type: string;
  };
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientId: string;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
  };
  status: SessionStatus;
  startedAt: string | null;
  endedAt: string | null;
  duration: number | null;
  recordingUrl: string | null;
  isRecorded: boolean;
  quality: SessionQuality | null;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionQuality {
  videoBitrate: number;
  audioBitrate: number;
  resolution: string;
  packetLoss: number;
  latency: number;
  overallScore: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  type: 'text' | 'file' | 'image';
  fileUrl: string | null;
  timestamp: string;
}

export interface SessionListResponse {
  sessions: TelemedicineSessionResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SessionStats {
  totalSessions: number;
  todaySessions: number;
  activeSessions: number;
  averageDuration: number;
  completionRate: number;
  byStatus: Record<string, number>;
  qualityMetrics: {
    averageLatency: number;
    averagePacketLoss: number;
    averageQualityScore: number;
  };
  dailySessions: Array<{ date: string; count: number }>;
}

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface RoomInfo {
  roomId: string;
  token: string;
  iceServers: IceServer[];
  expiresIn: number;
}