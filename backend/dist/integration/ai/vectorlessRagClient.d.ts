export interface RagSearchResult {
    id: string;
    content: string;
    chunkIndex: number;
    documentId: string;
    title: string;
    sourceType: string;
    score: number;
}
/**
 * Vectorless RAG — PostgreSQL full-text search + keyword fallback.
 * No Qdrant, no embeddings, no external vector database.
 */
export declare class VectorlessRagClient {
    /**
     * Search knowledge chunks by natural-language query.
     */
    search(query: string, limit?: number, sourceType?: string, minScore?: number): Promise<RagSearchResult[]>;
    /**
     * Store chunked document text in PostgreSQL.
     */
    storeChunks(documentId: string, chunks: string[]): Promise<number>;
    deleteDocumentChunks(documentId: string): Promise<void>;
    private fullTextSearch;
    private keywordSearch;
    /**
     * Build a single context string for LLM grounding from search hits.
     */
    buildContext(results: RagSearchResult[]): string;
}
export declare const vectorlessRagClient: VectorlessRagClient;
//# sourceMappingURL=vectorlessRagClient.d.ts.map