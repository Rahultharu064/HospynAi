// ============================================
// CHAT MESSAGE TYPES
// ============================================

export interface ChatMessageDto {
  message: string;
  sessionId?: string;
  patientId?: string;
  context?: 'GENERAL' | 'DOCTOR' | 'PATIENT' | 'TRIAGE';
  attachments?: ChatAttachment[];
  language?: string;
  stream?: boolean;
}

export interface ChatAttachment {
  type: 'image' | 'document' | 'audio';
  url: string;
  name: string;
  mimeType: string;
  size?: number;
}

export interface AudioMessageDto {
  audio: Buffer | string; // File buffer or base64
  format?: 'webm' | 'mp3' | 'wav' | 'm4a';
  language?: string;
  sessionId?: string;
  patientId?: string;
  context?: 'GENERAL' | 'DOCTOR' | 'PATIENT' | 'TRIAGE';
}

export interface ChatHistoryDto {
  sessionId?: string;
  patientId?: string;
  page?: number;
  limit?: number;
}

export interface ClearHistoryDto {
  sessionId?: string;
  patientId?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface ChatResponse {
  sessionId: string;
  message: string;
  type: 'text' | 'voice' | 'mixed';
  intent: string;
  confidence: number;
  sentiment: string;
  urgency: string;
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
    result?: any;
  };
  suggestedActions: SuggestedAction[];
  medicalDisclaimer: string;
  tokensUsed: number;
  responseTime: number;
  timestamp: string;
}

export interface SuggestedAction {
  action: string;
  label: string;
  description: string;
  icon?: string;
  endpoint?: string;
  params?: Record<string, any>;
  color?: string;
}

export interface AudioChatResponse extends ChatResponse {
  audioUrl?: string;
  audioDuration?: number;
  transcription: string;
  segments?: any[];
}

export interface ChatHistoryResponse {
  sessionId: string;
  messages: ChatHistoryMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ChatHistoryMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type: 'text' | 'voice' | 'file';
  intent?: string;
  confidence?: number;
  attachments?: any[];
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string | null;
  patientId: string | null;
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  context: string;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatStats {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  todayMessages: number;
  averageResponseTime: number;
  averageConfidence: number;
  topIntents: Array<{ intent: string; count: number }>;
  hourlyActivity: Array<{ hour: number; count: number }>;
  patientSatisfaction: number;
}