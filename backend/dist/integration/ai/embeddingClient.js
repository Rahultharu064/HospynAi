"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.embeddingClient = exports.EmbeddingClient = void 0;
const openai_1 = __importDefault(require("openai"));
const logger_1 = __importDefault(require("../../utils/logger"));
class EmbeddingClient {
    constructor() {
        this.model = 'text-embedding-3-small';
        this.dimensions = 1536;
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY || '',
        });
    }
    /**
     * Generate embedding for text
     */
    async embed(text) {
        try {
            const response = await this.openai.embeddings.create({
                model: this.model,
                input: text,
                dimensions: this.dimensions,
            });
            return response.data[0].embedding;
        }
        catch (error) {
            logger_1.default.error('Embedding generation failed:', error);
            throw error;
        }
    }
    /**
     * Batch embed multiple texts
     */
    async embedBatch(texts) {
        try {
            const response = await this.openai.embeddings.create({
                model: this.model,
                input: texts,
                dimensions: this.dimensions,
            });
            return response.data.map((d) => d.embedding);
        }
        catch (error) {
            logger_1.default.error('Batch embedding failed:', error);
            throw error;
        }
    }
    /**
     * Calculate cosine similarity
     */
    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
exports.EmbeddingClient = EmbeddingClient;
exports.embeddingClient = new EmbeddingClient();
//# sourceMappingURL=embeddingClient.js.map