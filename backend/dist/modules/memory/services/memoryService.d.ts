import { SaveMemoryInput, UpdateMemoryInput, SearchMemoryInput, MemoryQueryInput, ConsolidateMemoriesInput } from '../validators/memoryValidators';
import { MemoryResponse, MemoryListResponse, MemorySearchResponse, MemoryStats, MemoryConsolidationResult, PatientContextMemory } from '../../../types/memoryTypes';
export declare class MemoryService {
    /**
     * ============================================
     * SAVE MEMORY
     * ============================================
     */
    static saveMemory(data: SaveMemoryInput, userId: string): Promise<MemoryResponse>;
    /**
     * ============================================
     * SEARCH MEMORIES (Semantic Search)
     * ============================================
     */
    static searchMemories(data: SearchMemoryInput): Promise<MemorySearchResponse>;
    /**
     * ============================================
     * GET MEMORY BY ID
     * ============================================
     */
    static getMemoryById(id: string): Promise<MemoryResponse>;
    /**
     * ============================================
     * UPDATE MEMORY
     * ============================================
     */
    static updateMemory(id: string, data: UpdateMemoryInput, userId: string): Promise<MemoryResponse>;
    /**
     * ============================================
     * DELETE MEMORY
     * ============================================
     */
    static deleteMemory(id: string, userId: string): Promise<void>;
    /**
     * ============================================
     * LIST MEMORIES
     * ============================================
     */
    static listMemories(query: MemoryQueryInput): Promise<MemoryListResponse>;
    /**
     * ============================================
     * GET PATIENT CONTEXT (Aggregated Memories)
     * ============================================
     */
    static getPatientContext(patientId: string): Promise<PatientContextMemory>;
    /**
     * ============================================
     * CONSOLIDATE MEMORIES
     * ============================================
     */
    static consolidateMemories(data: ConsolidateMemoriesInput, userId: string): Promise<MemoryConsolidationResult>;
    /**
     * ============================================
     * MEMORY STATISTICS
     * ============================================
     */
    static getMemoryStats(): Promise<MemoryStats>;
    /**
     * ============================================
     * CLEANUP EXPIRED MEMORIES
     * ============================================
     */
    static cleanupExpiredMemories(): Promise<number>;
    private static calculateRelevance;
    private static generateSnippet;
    private static findMatchingTags;
    private static formatMemoryResponse;
}
//# sourceMappingURL=memoryService.d.ts.map