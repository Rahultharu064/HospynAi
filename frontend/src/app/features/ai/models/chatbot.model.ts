/**
 * Mirrors backend/src/types/chatbotTypes.ts and the chatMessageSchema validator.
 */

export type ChatContext = 'GENERAL' | 'DOCTOR' | 'PATIENT' | 'TRIAGE';
export type ChatRole = 'user' | 'assistant' | 'system';
export type ChatMessageType = 'text' | 'voice' | 'file';
export type ChatUrgency = 'routine' | 'urgent' | 'emergency' | string;

export interface ChatAttachment {
  type: 'image' | 'document' | 'audio';
  url: string;
  name: string;
  mimeType: string;
  size?: number;
}

export interface SendMessageRequest {
  message: string;
  sessionId?: string;
  patientId?: string;
  context?: ChatContext;
  language?: string;
  stream?: boolean;
  attachments?: ChatAttachment[];
}

/** An action the assistant offers as a follow-up, e.g. "book an appointment". */
export interface SuggestedAction {
  action: string;
  label: string;
  description?: string;
  icon?: string;
  endpoint?: string;
  params?: Record<string, unknown>;
  color?: string;
}

export interface ChatResponse {
  sessionId: string;
  message: string;
  type: 'text' | 'voice' | 'mixed';
  intent: string;
  confidence: number;
  sentiment: string;
  urgency: ChatUrgency;
  functionCall?: {
    name: string;
    arguments: Record<string, unknown>;
    result: unknown;
  };
  suggestedActions: SuggestedAction[];
  medicalDisclaimer: string;
  tokensUsed: number;
  responseTime: number;
  timestamp: string;
}

export interface ChatHistoryMessage {
  id: string;
  role: ChatRole;
  content: string;
  type: ChatMessageType;
  intent?: string;
  confidence?: number;
  attachments?: ChatAttachment[];
  timestamp: string;
}

export interface ChatHistoryResponse {
  sessionId: string;
  messages: ChatHistoryMessage[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * What the panel renders. Wider than ChatHistoryMessage because a message can be
 * in flight or have failed, neither of which the server ever returns.
 */
export interface ChatBubble {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  pending?: boolean;
  failed?: boolean;
  suggestedActions?: SuggestedAction[];
  urgency?: ChatUrgency;
}
