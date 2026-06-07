export declare class QdrantService {
    private client;
    private collectionName;
    private memoryCollection;
    constructor();
    /**
     * Initialize collections
     */
    initialize(): Promise<void>;
    /**
     * Upsert vectors for RAG
     */
    upsertVectors(vectors: Array<{
        id: string;
        vector: number[];
        payload: Record<string, any>;
    }>): Promise<void>;
    /**
     * Search similar documents
     */
    search(vector: number[], limit?: number, scoreThreshold?: number, filter?: Record<string, any>): Promise<Array<{
        id: string;
        score: number;
        payload: Record<string, any>;
    }>>;
    /**
     * Save memory
     */
    saveMemory(id: string, vector: number[], payload: Record<string, any>): Promise<void>;
    /**
     * Search memories
     */
    searchMemories(vector: number[], limit?: number, filter?: Record<string, any>): Promise<Array<{
        id: string;
        score: number;
        payload: any;
    }>>;
    /**
     * Delete vectors
     */
    deleteVectors(ids: string[]): Promise<void>;
    /**
     * Delete document by filter
     */
    deleteByFilter(filter: Record<string, any>): Promise<void>;
    private createCollectionIfNotExists;
}
export declare const qdrantService: QdrantService;
//# sourceMappingURL=quadrantClient.d.ts.map