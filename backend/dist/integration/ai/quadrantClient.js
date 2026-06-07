"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qdrantService = exports.QdrantService = void 0;
const js_client_rest_1 = require("@qdrant/js-client-rest");
const logger_1 = __importDefault(require("../../utils/logger"));
class QdrantService {
    constructor() {
        this.collectionName = 'voicemed_knowledge';
        this.memoryCollection = 'voicemed_memories';
        this.client = new js_client_rest_1.QdrantClient({
            url: process.env.QDRANT_URL || 'http://localhost:6333',
            apiKey: process.env.QDRANT_API_KEY,
        });
    }
    /**
     * Initialize collections
     */
    async initialize() {
        await this.createCollectionIfNotExists(this.collectionName, 1536);
        await this.createCollectionIfNotExists(this.memoryCollection, 1536);
        logger_1.default.info('Qdrant collections initialized');
    }
    /**
     * Upsert vectors for RAG
     */
    async upsertVectors(vectors) {
        try {
            await this.client.upsert(this.collectionName, {
                points: vectors.map((v) => ({
                    id: v.id,
                    vector: v.vector,
                    payload: v.payload,
                })),
                wait: true,
            });
        }
        catch (error) {
            logger_1.default.error('Qdrant upsert failed:', error);
            throw error;
        }
    }
    /**
     * Search similar documents
     */
    async search(vector, limit = 5, scoreThreshold = 0.7, filter) {
        try {
            const results = await this.client.search(this.collectionName, {
                vector,
                limit,
                score_threshold: scoreThreshold,
                filter: filter ? { must: [filter] } : undefined,
                with_payload: true,
            });
            return results.map((r) => ({
                id: r.id,
                score: r.score,
                payload: r.payload,
            }));
        }
        catch (error) {
            logger_1.default.error('Qdrant search failed:', error);
            return [];
        }
    }
    /**
     * Save memory
     */
    async saveMemory(id, vector, payload) {
        await this.client.upsert(this.memoryCollection, {
            points: [{ id, vector, payload }],
            wait: true,
        });
    }
    /**
     * Search memories
     */
    async searchMemories(vector, limit = 10, filter) {
        const results = await this.client.search(this.memoryCollection, {
            vector,
            limit,
            filter: filter ? { must: [filter] } : undefined,
            with_payload: true,
        });
        return results.map((r) => ({
            id: r.id,
            score: r.score,
            payload: r.payload,
        }));
    }
    /**
     * Delete vectors
     */
    async deleteVectors(ids) {
        await this.client.delete(this.collectionName, {
            points: ids,
            wait: true,
        });
    }
    /**
     * Delete document by filter
     */
    async deleteByFilter(filter) {
        await this.client.delete(this.collectionName, {
            filter: { must: [filter] },
            wait: true,
        });
    }
    async createCollectionIfNotExists(name, size) {
        try {
            await this.client.getCollection(name);
        }
        catch {
            await this.client.createCollection(name, {
                vectors: { size, distance: 'Cosine' },
            });
            logger_1.default.info(`Collection created: ${name}`);
        }
    }
}
exports.QdrantService = QdrantService;
exports.qdrantService = new QdrantService();
//# sourceMappingURL=quadrantClient.js.map