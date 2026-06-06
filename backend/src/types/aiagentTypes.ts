// ============================================
// AGENTIC AI TYPES
// ============================================

export interface AgentChatDto {
  message: string;
  sessionId?: string;
  patientId?: string;
  context?: Record<string, any>;
  stream?: boolean;
}

export interface AgentTaskDto {
  taskType: AgentTaskType;
  parameters: Record<string, any>;
  patientId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  callbackUrl?: string;
}

export type AgentTaskType =
  | 'SCHEDULE_APPOINTMENT'
  | 'CREATE_PRESCRIPTION'
  | 'ORDER_LAB_TEST'
  | 'ANALYZE_SYMPTOMS'
  | 'GENERATE_REFERRAL'
  | 'SUMMARIZE_RECORDS'
  | 'CHECK_DRUG_INTERACTIONS'
  | 'TRIAGE_PATIENT'
  | 'GENERATE_REPORT'
  | 'SEND_NOTIFICATION';

export interface ToolExecutionDto {
  toolName: string;
  parameters: Record<string, any>;
  agentId?: string;
}

export interface AgentQueryDto {
  page?: number;
  limit?: number;
  userId?: string;
  taskType?: AgentTaskType;
  status?: AgentStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type AgentStatus = 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// ============================================
// RAG TYPES
// ============================================

export interface IngestDocumentDto {
  title: string;
  description?: string;
  sourceType: RagSourceType;
  language?: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface RagQueryDto {
  query: string;
  sourceType?: RagSourceType;
  maxResults?: number;
  minRelevance?: number;
  includeCitations?: boolean;
  patientId?: string;
  context?: Record<string, any>;
}

export type RagSourceType = 'FAQ' | 'MEDICAL_GUIDE' | 'POLICY' | 'RESEARCH' | 'CUSTOM';

export interface RagDocumentQueryDto {
  page?: number;
  limit?: number;
  sourceType?: RagSourceType;
  isActive?: boolean;
  search?: string;
}

// ============================================
// AI MEMORY TYPES
// ============================================

export interface SaveMemoryDto {
  userId?: string;
  patientId?: string;
  memoryType: MemoryType;
  content: string;
  metadata?: Record<string, any>;
}

export interface MemoryQueryDto {
  userId?: string;
  patientId?: string;
  memoryType?: MemoryType;
  limit?: number;
  minRelevance?: number;
}

export type MemoryType = 'PREFERENCE' | 'INTERACTION' | 'MEDICAL' | 'CONTEXT';

// ============================================
// RESPONSE TYPES
// ============================================

export interface AgentChatResponse {
  sessionId: string;
  message: string;
  reasoning: string | null;
  actions: AgentAction[];
  toolsUsed: string[];
  data: any;
  confidence: number;
  suggestedActions: SuggestedAction[];
  tokensUsed: number;
  responseTime: number;
}

export interface AgentAction {
  action: string;
  description: string;
  tool: string;
  parameters: Record<string, any>;
  result: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface SuggestedAction {
  action: string;
  label: string;
  description: string;
  endpoint?: string;
  params?: Record<string, any>;
}

export interface AgentTaskResponse {
  taskId: string;
  status: AgentStatus;
  progress: number;
  steps: AgentTaskStep[];
  result: any;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface AgentTaskStep {
  step: number;
  action: string;
  tool: string;
  input: any;
  output: any;
  status: 'completed' | 'failed' | 'skipped';
  duration: number;
}

export interface AgentLogResponse {
  id: string;
  userId: string | null;
  sessionId: string;
  taskType: string;
  input: any;
  output: any;
  toolCalls: any;
  status: string;
  duration: number | null;
  tokensUsed: number | null;
  cost: number | null;
  createdAt: string;
}

export interface RagQueryResponse {
  query: string;
  answer: string;
  citations: RagCitation[];
  sources: RagSource[];
  confidence: number;
  tokensUsed: number;
  responseTime: number;
}

export interface RagCitation {
  text: string;
  source: string;
  documentId: string;
  relevance: number;
  page?: number;
}

export interface RagSource {
  id: string;
  title: string;
  sourceType: string;
  relevance: number;
  excerpt: string;
}

export interface RagDocumentResponse {
  id: string;
  title: string;
  description: string | null;
  sourceType: string;
  fileName: string;
  fileSize: number;
  chunkCount: number;
  isActive: boolean;
  version: number;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MemoryResponse {
  id: string;
  memoryType: string;
  content: string;
  relevanceScore: number | null;
  metadata: any;
  createdAt: string;
}

export interface AiStats {
  agent: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageCompletionTime: number;
    byTaskType: Record<string, number>;
    successRate: number;
  };
  rag: {
    totalDocuments: number;
    totalChunks: number;
    totalQueries: number;
    averageConfidence: number;
    bySourceType: Record<string, number>;
  };
  memory: {
    totalMemories: number;
    byType: Record<string, number>;
    averageRelevance: number;
  };
}