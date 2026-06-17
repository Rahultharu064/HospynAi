import prisma from '../../config/prisma';
import logger from '../../utils/logger';

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
export class VectorlessRagClient {
  /**
   * Search knowledge chunks by natural-language query.
   */
  async search(
    query: string,
    limit: number = 5,
    sourceType?: string,
    minScore: number = 0.01
  ): Promise<RagSearchResult[]> {
    const sanitized = query.trim();
    if (!sanitized) return [];

    const ftsResults = await this.fullTextSearch(sanitized, limit, sourceType);
    if (ftsResults.length > 0) {
      return ftsResults.filter((r) => r.score >= minScore);
    }

    return this.keywordSearch(sanitized, limit, sourceType);
  }

  /**
   * Store chunked document text in PostgreSQL.
   */
  async storeChunks(
    documentId: string,
    chunks: string[]
  ): Promise<number> {
    if (chunks.length === 0) return 0;

    await prisma.ragChunk.deleteMany({ where: { documentId } });

    await prisma.ragChunk.createMany({
      data: chunks.map((content, index) => ({
        documentId,
        chunkIndex: index,
        content,
        tokenCount: content.split(/\s+/).filter(Boolean).length,
      })),
    });

    await prisma.ragDocument.update({
      where: { id: documentId },
      data: { chunkCount: chunks.length },
    });

    return chunks.length;
  }

  async deleteDocumentChunks(documentId: string): Promise<void> {
    await prisma.ragChunk.deleteMany({ where: { documentId } });
  }

  private async fullTextSearch(
    query: string,
    limit: number,
    sourceType?: string
  ): Promise<RagSearchResult[]> {
    try {
      if (sourceType) {
        return await prisma.$queryRaw<RagSearchResult[]>`
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

      return await prisma.$queryRaw<RagSearchResult[]>`
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
    } catch (error) {
      logger.warn('PostgreSQL full-text search failed, using keyword fallback:', error);
      return [];
    }
  }

  private async keywordSearch(
    query: string,
    limit: number,
    sourceType?: string
  ): Promise<RagSearchResult[]> {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^\w]/g, ''))
      .filter((t) => t.length > 2);

    if (terms.length === 0) {
      terms.push(query.toLowerCase().slice(0, 50));
    }

    const chunks = await prisma.ragChunk.findMany({
      where: {
        document: {
          isActive: true,
          ...(sourceType ? { sourceType } : {}),
        },
        OR: terms.map((term) => ({
          content: { contains: term, mode: 'insensitive' as const },
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
  buildContext(results: RagSearchResult[]): string {
    if (results.length === 0) return '';
    return results
      .map(
        (r, i) =>
          `[Source ${i + 1}: ${r.title} (${r.sourceType}), relevance ${(r.score * 100).toFixed(0)}%]\n${r.content}`
      )
      .join('\n\n');
  }
}

export const vectorlessRagClient = new VectorlessRagClient();
