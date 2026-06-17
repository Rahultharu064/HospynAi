import OpenAI from 'openai';
import { config } from '../../config';
import logger from '../../utils/logger';

export class EmbeddingClient {
  private openai: OpenAI | null = null;
  private model: string;
  private dimensions = 1536;
  private configured: boolean;

  constructor() {
    this.model = config.openai.embeddingModel;
    this.configured = Boolean(config.openai.apiKey);

    if (this.configured) {
      this.openai = new OpenAI({ apiKey: config.openai.apiKey });
    } else {
      logger.warn('OPENAI_API_KEY not set — RAG embeddings disabled (optional; Groq handles chat/voice)');
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async embed(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('Embeddings not configured');
    }
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        dimensions: this.dimensions,
      });
      return response.data[0].embedding;
    } catch (error) {
      logger.error('Embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Batch embed multiple texts
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.openai) {
      throw new Error('Embeddings not configured');
    }
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
        dimensions: this.dimensions,
      });

      return response.data.map((d) => d.embedding);
    } catch (error) {
      logger.error('Batch embedding failed:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity
   */
  cosineSimilarity(a: number[], b: number[]): number {
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

export const embeddingClient = new EmbeddingClient();