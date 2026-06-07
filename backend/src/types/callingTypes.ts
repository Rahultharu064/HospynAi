import { CallOutcome } from '@prisma/client';

// ============================================
// CALLING DTOs
// ============================================

export interface InitiateOutboundCallDto {
  patientId: string;
  phoneNumber: string;
  callType: 'REMINDER' | 'FOLLOW_UP' | 'APPOINTMENT_CONFIRMATION' | 'GENERAL';
  appointmentId?: string;
  message?: string;
  callbackUrl?: string;
}

export interface HandleIncomingCallDto {
  callSid: string;
  from: string;
  to: string;
  direction: 'INBOUND';
}

export interface TransferToHumanDto {
  callSid: string;
  reason: string;
  priority?: 'normal' | 'urgent';
  department?: string;
}

export interface UpdateCallStatusDto {
  callSid: string;
  status: string;
  duration?: number;
  recordingUrl?: string;
}

export interface CallQueryDto {
  page?: number;
  limit?: number;
  patientId?: string;
  outcome?: CallOutcome;
  direction?: string;
  dateFrom?: string;
  dateTo?: string;
  aiHandled?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// TWILIO WEBHOOK TYPES
// ============================================

export interface TwilioVoiceRequest {
  CallSid: string;
  From: string;
  To: string;
  CallStatus: string;
  Direction: string;
  CallerName?: string;
  FromCity?: string;
  FromState?: string;
  FromCountry?: string;
  RecordingUrl?: string;
  RecordingDuration?: string;
  Digits?: string;
  SpeechResult?: string;
  Confidence?: string;
}

export interface TwilioStatusCallback {
  CallSid: string;
  CallStatus: string;
  CallDuration?: string;
  RecordingUrl?: string;
  RecordingDuration?: string;
  Timestamp: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface CallResponse {
  id: string;
  callSid: string;
  patient: {
    id: string;
    patientId: string;
    firstName: string;
    lastName: string;
  } | null;
  fromNumber: string;
  toNumber: string;
  direction: string;
  outcome: CallOutcome;
  duration: number | null;
  transcript: string | null;
  recordingUrl: string | null;
  aiHandled: boolean;
  handoffReason: string | null;
  handoffTo: string | null;
  metadata: Record<string, any> | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
}

export interface CallListResponse {
  calls: CallResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TwiMLResponse {
  twiml: string;
}

export interface OutboundCallResponse {
  success: boolean;
  callSid: string;
  status: string;
  message: string;
}

export interface CallStats {
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  aiResolved: number;
  handedOff: number;
  missed: number;
  averageDuration: number;
  aiResolutionRate: number;
  missedCallRate: number;
  averageHandoffTime: number;
  peakHours: Array<{ hour: number; count: number }>;
  dailyVolume: Array<{ date: string; count: number }>;
  outcomes: Record<string, number>;
}

export interface ActiveCall {
  callSid: string;
  patientName: string | null;
  phoneNumber: string;
  status: string;
  duration: number;
  aiHandling: boolean;
  startedAt: string;
}

export interface CallTranscript {
  callSid: string;
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
}

export interface TranscriptSegment {
  speaker: 'AI' | 'PATIENT' | 'HUMAN_AGENT';
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}