"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vectorlessRagClient = exports.VectorlessRagClient = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Vectorless RAG — PostgreSQL full-text search + keyword fallback.
 * No Qdrant, no embeddings, no external vector database.
 */
class VectorlessRagClient {
    /**
     * Search knowledge chunks by natural-language query.
     */
    async search(query, limit = 5, sourceType, minScore = 0.01) {
        const sanitized = query.trim();
        if (!sanitized)
            return [];
        const ftsResults = await this.fullTextSearch(sanitized, limit, sourceType);
        if (ftsResults.length > 0) {
            return ftsResults.filter((r) => r.score >= minScore);
        }
        return this.keywordSearch(sanitized, limit, sourceType);
    }
    /**
     * Store chunked document text in PostgreSQL.
     */
    async storeChunks(documentId, chunks) {
        if (chunks.length === 0)
            return 0;
        await prisma_1.default.ragChunk.deleteMany({ where: { documentId } });
        await prisma_1.default.ragChunk.createMany({
            data: chunks.map((content, index) => ({
                documentId,
                chunkIndex: index,
                content,
                tokenCount: content.split(/\s+/).filter(Boolean).length,
            })),
        });
        await prisma_1.default.ragDocument.update({
            where: { id: documentId },
            data: { chunkCount: chunks.length },
        });
        return chunks.length;
    }
    async deleteDocumentChunks(documentId) {
        await prisma_1.default.ragChunk.deleteMany({ where: { documentId } });
    }
    async fullTextSearch(query, limit, sourceType) {
        try {
            if (sourceType) {
                return await prisma_1.default.$queryRaw `
          SELECT
            c.id,
            c.content,
            c.chunk_index AS "chunkIndex",
            d.id AS "documentId",
            d.title,
            d.source_type AS "sourceType",
            ts_rank(
              to_tsvector('english', c.content),
              plainto_tsquery('english', ${query})
            )::float AS score
          FROM rag_chunks c
          INNER JOIN rag_documents d ON d.id = c.document_id
          WHERE d.is_active = true
            AND d.source_type = ${sourceType}
            AND to_tsvector('english', c.content) @@ plainto_tsquery('english', ${query})
          ORDER BY score DESC
          LIMIT ${limit}
        `;
            }
            return await prisma_1.default.$queryRaw `
        SELECT
          c.id,
          c.content,
          c.chunk_index AS "chunkIndex",
          d.id AS "documentId",
          d.title,
          d.source_type AS "sourceType",
          ts_rank(
            to_tsvector('english', c.content),
            plainto_tsquery('english', ${query})
          )::float AS score
        FROM rag_chunks c
        INNER JOIN rag_documents d ON d.id = c.document_id
        WHERE d.is_active = true
          AND to_tsvector('english', c.content) @@ plainto_tsquery('english', ${query})
        ORDER BY score DESC
        LIMIT ${limit}
      `;
        }
        catch (error) {
            logger_1.default.warn('PostgreSQL full-text search failed, using keyword fallback:', error);
            return [];
        }
    }
    async keywordSearch(query, limit, sourceType) {
        const terms = query
            .toLowerCase()
            .split(/\s+/)
            .map((t) => t.replace(/[^\w]/g, ''))
            .filter((t) => t.length > 2);
        if (terms.length === 0) {
            terms.push(query.toLowerCase().slice(0, 50));
        }
        const chunks = await prisma_1.default.ragChunk.findMany({
            where: {
                document: {
                    isActive: true,
                    ...(sourceType ? { sourceType } : {}),
                },
                OR: terms.map((term) => ({
                    content: { contains: term, mode: 'insensitive' },
                })),
            },
            include: {
                document: { select: { id: true, title: true, sourceType: true } },
            },
            take: limit * 3,
        });
        const scored = chunks.map((chunk) => {
            const lower = chunk.content.toLowerCase();
            const hits = terms.filter((t) => lower.includes(t)).length;
            const score = hits / terms.length;
            return {
                id: chunk.id,
                content: chunk.content,
                chunkIndex: chunk.chunkIndex,
                documentId: chunk.document.id,
                title: chunk.document.title,
                sourceType: chunk.document.sourceType,
                score,
            };
        });
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
    /**
     * Build a single context string for LLM grounding from search hits.
     */
    buildContext(results) {
        if (results.length === 0)
            return '';
        return results
            .map((r, i) => `[Source ${i + 1}: ${r.title} (${r.sourceType}), relevance ${(r.score * 100).toFixed(0)}%]\n${r.content}`)
            .join('\n\n');
    }
}
exports.VectorlessRagClient = VectorlessRagClient;
exports.vectorlessRagClient = new VectorlessRagClient();
//# sourceMappingURL=vectorlessRagClient.js.map