export declare class EmbeddingClient {
    private openai;
    private model;
    private dimensions;
    constructor();
    /**
     * Generate embedding for text
     */
    embed(text: string): Promise<number[]>;
    /**
     * Batch embed multiple texts
     */
    embedBatch(texts: string[]): Promise<number[][]>;
    /**
     * Calculate cosine similarity
     */
    cosineSimilarity(a: number[], b: number[]): number;
}
export declare const embeddingClient: EmbeddingClient;
//# sourceMappingURL=embeddingClient.d.ts.map