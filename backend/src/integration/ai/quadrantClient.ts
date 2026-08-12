import { QdrantClient } from '@qdrant/js-client-rest';
import logger from '../../utils/logger';

export class QdrantService {
  private client: QdrantClient;
  private collectionName = 'voicemed_knowledge';
  private memoryCollection = 'voicemed_memories';

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  /**
   * Initialize collections
   */
  async initialize(): Promise<void> {
    await this.createCollectionIfNotExists(this.collectionName, 1536);
    await this.createCollectionIfNotExists(this.memoryCollection, 1536);
    logger.info('Qdrant collections initialized');
  }

  /**
   * Upsert vectors for RAG
   */
  async upsertVectors(
    vectors: Array<{
      id: string;
      vector: number[];
      payload: Record<string, any>;
    }>
  ): Promise<void> {
    try {
      await this.client.upsert(this.collectionName, {
        points: vectors.map((v) => ({
          id: v.id,
          vector: v.vector,
          payload: v.payload,
        })),
        wait: true,
      });
    } catch (error) {
      logger.error('Qdrant upsert failed:', error);
      throw error;
    }
  }

  /**
   * Search similar documents
   */
  async search(
    vector: number[],
    limit: number = 5,
    scoreThreshold: number = 0.7,
    filter?: Record<string, any>
  ): Promise<Array<{
    id: string;
    score: number;
    payload: Record<string, any>;
  }>> {
    try {
      const results = await this.client.search(this.collectionName, {
        vector,
        limit,
        score_threshold: scoreThreshold,
        filter: filter ? { must: [filter] } : undefined,
        with_payload: true,
      });

      return results.map((r) => ({
        id: r.id as string,
        score: r.score,
        payload: r.payload as Record<string, any>,
      }));
    } catch (error) {
      logger.error('Qdrant search failed:', error);
      return [];
    }
  }

  /**
   * Save memory
   */
  async saveMemory(
    id: string,
    vector: number[],
    payload: Record<string, any>
  ): Promise<void> {
    await this.client.upsert(this.memoryCollection, {
      points: [{ id, vector, payload }],
      wait: true,
    });
  }

  /**
   * Search memories
   */
  async searchMemories(
    vector: number[],
    limit: number = 10,
    scoreThreshold?: number
  ): Promise<Array<{ id: string; score: number; payload: any }>> {
    const results = await this.client.search(this.memoryCollection, {
      vector,
      limit,
      score_threshold: scoreThreshold,
      with_payload: true,
    });

    return results.map((r) => ({
      id: r.id as string,
      score: r.score,
      payload: r.payload,
    }));
  }

  /**
   * Delete vectors
   */
  async deleteVectors(ids: string[]): Promise<void> {
    await this.client.delete(this.collectionName, {
      points: ids,
      wait: true,
    });
  }

  /**
   * Delete document by filter
   */
  async deleteByFilter(filter: Record<string, any>): Promise<void> {
    await this.client.delete(this.collectionName, {
      filter: { must: [filter] },
      wait: true,
    });
  }

  private async createCollectionIfNotExists(name: string, size: number): Promise<void> {
    try {
      await this.client.getCollection(name);
    } catch {
      await this.client.createCollection(name, {
        vectors: { size, distance: 'Cosine' },
      });
      logger.info(`Collection created: ${name}`);
    }
  }
}


export const qdrantService = new QdrantService();
