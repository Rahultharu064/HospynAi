import prisma from '../../../config/prisma';
import { FileService } from '../../auth/services/fileService';
import { llmClient } from '../../../integration/ai/aiClient';
import { vectorlessRagClient } from '../../../integration/ai/vectorlessRagClient';
import {
  IngestDocumentInput,
  RagQueryInput,
  RagDocumentQueryInput,
} from '../validators/aiagentValidators';
import { NotFoundError } from '../../../utils/errors';
import {
  RagQueryResponse,
  RagDocumentResponse,
  RagCitation,
} from '../../../types/aiagentTypes';
import logger from '../../../utils/logger';

export class RagService {
  static async ingestDocument(
    file: Express.Multer.File,
    data: IngestDocumentInput,
    userId: string
  ): Promise<RagDocumentResponse> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(file.path, 'utf-8');
    const chunks = this.chunkText(content, data.chunkSize || 1000, data.chunkOverlap || 200);

    const upload = await FileService.uploadMulterFile(file);

    const document = await prisma.$transaction(async (tx) => {
      const doc = await tx.ragDocument.create({
        data: {
          title: data.title,
          description: data.description || null,
          sourceType: data.sourceType,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          cloudinaryPublicId: upload.publicId,
          chunkCount: 0,
          vectorIds: [],
          uploadedById: userId,
        },
        include: {
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await vectorlessRagClient.storeChunks(doc.id, chunks);

      return tx.ragDocument.findUniqueOrThrow({
        where: { id: doc.id },
        include: {
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });

    logger.info(`RAG document ingested (vectorless): ${document.id} (${chunks.length} chunks)`);
    return this.formatDocumentResponse(document);
  }

  static async query(data: RagQueryInput): Promise<RagQueryResponse> {
    const startTime = Date.now();
    const maxResults = data.maxResults || 5;
    const minRelevance = data.minRelevance ?? 0.05;

    const hits = await vectorlessRagClient.search(
      data.query,
      maxResults,
      data.sourceType,
      minRelevance
    );

    const context = vectorlessRagClient.buildContext(hits);

    let answer: string;
    let tokensUsed = 0;

    if (context) {
      const response = await llmClient.chat(
        [
          {
            role: 'system',
            content: `${llmClient.getSystemPrompt('GENERAL')}

Answer ONLY using the provided knowledge base excerpts. If the excerpts do not contain enough information, say so clearly. Cite source titles when relevant.`,
          },
          {
            role: 'system',
            content: `Knowledge base excerpts:\n\n${context}`,
          },
          { role: 'user', content: data.query },
        ],
        { temperature: 0.3, maxTokens: 1500 }
      );
      answer = response.message;
      tokensUsed = response.usage.totalTokens;
    } else {
      const response = await llmClient.generateResponse(
        data.query,
        'GENERAL_INQUIRY',
        { note: 'No matching knowledge base documents found' }
      );
      answer = response.response;
      tokensUsed = response.tokensUsed || 0;
    }

    const citations: RagCitation[] = hits.map((hit) => ({
      text: hit.content.slice(0, 300),
      source: hit.title,
      documentId: hit.documentId,
      relevance: hit.score,
    }));

    const sources = hits.map((h) => ({
      id: h.documentId,
      title: h.title,
      sourceType: h.sourceType,
      relevance: h.score,
      excerpt: h.content.slice(0, 200),
    }));

    const avgScore = hits.length > 0
      ? hits.reduce((sum, h) => sum + h.score, 0) / hits.length
      : 0;

    return {
      query: data.query,
      answer,
      citations: data.includeCitations !== false ? citations : [],
      sources,
      confidence: Math.min(0.99, avgScore || 0.5),
      tokensUsed,
      responseTime: Date.now() - startTime,
      retrievalMethod: 'postgresql_fts',
    };
  }

  static async listDocuments(query: RagDocumentQueryInput): Promise<{
    documents: RagDocumentResponse[];
    pagination: any;
  }> {
    const { page = 1, limit = 20, sourceType, isActive, search } = query;

    const where: any = {};
    if (sourceType) where.sourceType = sourceType;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      prisma.ragDocument.findMany({
        where,
        include: {
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ragDocument.count({ where }),
    ]);

    return {
      documents: documents.map((d) => this.formatDocumentResponse(d)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async deleteDocument(id: string, userId: string): Promise<void> {
    const document = await prisma.ragDocument.findUnique({ where: { id } });
    if (!document) throw new NotFoundError('Document not found');

    await FileService.deleteFile(document.cloudinaryPublicId);
    await vectorlessRagClient.deleteDocumentChunks(id);
    await prisma.ragDocument.delete({ where: { id } });

    logger.info(`RAG document deleted (vectorless): ${id}`);
  }

  private static chunkText(
    text: string,
    chunkSize: number,
    chunkOverlap: number
  ): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += chunkSize - chunkOverlap;
      if (start >= text.length) break;
      if (chunkSize <= chunkOverlap) break;
    }

    return chunks.filter((c) => c.trim().length > 0);
  }

  private static formatDocumentResponse(doc: any): RagDocumentResponse {
    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      sourceType: doc.sourceType,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      chunkCount: doc.chunkCount,
      isActive: doc.isActive,
      version: doc.version,
      uploadedBy: doc.uploadedBy,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }
}
