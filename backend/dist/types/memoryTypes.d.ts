export interface SaveMemoryDto {
    userId?: string;
    patientId?: string;
    memoryType: MemoryType;
    content: string;
    importance?: number;
    metadata?: Record<string, any>;
    tags?: string[];
    expiresAt?: string;
    sessionId?: string;
    source?: string;
}
export interface UpdateMemoryDto {
    content?: string;
    importance?: number;
    metadata?: Record<string, any>;
    tags?: string[];
    expiresAt?: string;
}
export interface SearchMemoryDto {
    query: string;
    userId?: string;
    patientId?: string;
    memoryType?: MemoryType;
    limit?: number;
    minRelevance?: number;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
}
export interface MemoryQueryDto {
    page?: number;
    limit?: number;
    userId?: string;
    patientId?: string;
    memoryType?: MemoryType;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface ConsolidateMemoriesDto {
    userId?: string;
    patientId?: string;
    memoryType?: MemoryType;
    timeRange?: 'day' | 'week' | 'month';
}
export type MemoryType = 'PREFERENCE' | 'INTERACTION' | 'MEDICAL' | 'CONTEXT' | 'BEHAVIOR' | 'CLINICAL_DECISION' | 'PATIENT_HISTORY' | 'APPOINTMENT_PATTERN';
export type MemoryImportance = 'low' | 'medium' | 'high' | 'critical';
export interface MemoryResponse {
    id: string;
    userId: string | null;
    patientId: string | null;
    memoryType: MemoryType;
    content: string;
    summary: string | null;
    importance: number;
    relevanceScore: number | null;
    embeddingId: string | null;
    metadata: Record<string, any> | null;
    tags: string[];
    source: string | null;
    sessionId: string | null;
    accessCount: number;
    lastAccessedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface MemoryListResponse {
    memories: MemoryResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface MemorySearchResponse {
    query: string;
    results: MemorySearchResult[];
    totalFound: number;
    searchTime: number;
}
export interface MemorySearchResult {
    memory: MemoryResponse;
    relevanceScore: number;
    matchedTags: string[];
    highlightSnippet: string;
}
export interface MemoryStats {
    totalMemories: number;
    byType: Record<string, number>;
    byImportance: Record<string, number>;
    averageRelevance: number;
    totalEmbeddings: number;
    storageSize: number;
    recentActivity: Array<{
        date: string;
        created: number;
        accessed: number;
        deleted: number;
    }>;
    topTags: Array<{
        tag: string;
        count: number;
    }>;
}
export interface MemoryConsolidationResult {
    originalCount: number;
    consolidatedCount: number;
    summary: string;
    keyInsights: string[];
    recommendations: string[];
    processingTime: number;
}
export interface PatientContextMemory {
    preferences: string[];
    commonSymptoms: string[];
    medicationHistory: string[];
    appointmentPatterns: string[];
    doctorPreferences: string[];
    communicationPreferences: string[];
    lastUpdated: string;
}
//# sourceMappingURL=memoryTypes.d.ts.map