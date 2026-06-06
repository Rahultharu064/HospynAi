import prisma from '../../../config/prisma';
import { FileService } from '../../auth/services/fileService';
import { qdrantService } from '../../../integration/ai/quadrantClient';
import { gptClient } from '../../../integration/ai/aiClient';
import { AuditService } from '../../auth/services/auditService';
import {
  IngestDocumentInput,
  RagQueryInput,
  RagDocumentQueryInput,
} from '../validators/aiagentValidators';
import {
  RagQueryResponse,
  RagDocumentResponse,
  RagCitation,
} from '../../../types/aiagentTypes';
import logger from '../../../utils/logger';

export class RagService {
  /**
   * ============================================
   * INGEST DOCUMENT
   * ============================================
   */
  static async ingestDocument(
    file: Express.Multer.File,
    data: IngestDocumentInput,
    userId: string
  ): Promise<RagDocumentResponse> {
    // Upload to S3
    const s3Key = await FileService.uploadToS3(file.path, file.originalname, file.mimetype);

    // Read file content
    const fs = await import('fs/promises');
    const content = await fs.readFile(file.path, 'utf-8');

    // Split into chunks
    const chunks = this.chunkText(content, data.chunkSize || 1000, data.chunkOverlap || 200);

    // Create document record
    const document = await prisma.ragDocument.create({
      data: {
        title: data.title,
        description: data.description || null,
        sourceType: data.sourceType,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        s3Key,
        chunkCount: chunks.length,
        vectorIds: [],
        uploadedById: userId,
      },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // In production: Generate embeddings and store in Qdrant
    // For now, log the chunking
    logger.info(`Document ingested: ${document.id} (${chunks.length} chunks)`);

    return this.formatDocumentResponse(document);
  }

  /**
   * ============================================
   * QUERY RAG
   * ============================================
   */
  static async query(data: RagQueryInput): Promise<RagQueryResponse> {
    const startTime = Date.now();

    // In production:
    // 1. Embed the query
    // 2. Search Qdrant for similar chunks
    // 3. Build context from retrieved chunks
    // 4. Generate answer using GPT with context

    const response = await gptClient.generateResponse(
      data.query,
      'GENERAL_INQUIRY',
      { useKnowledgeBase: true }
    );

    const citations: RagCitation[] = [];
    const sources: any[] = [];

    return {
      query: data.query,
      answer: response.response,
      citations,
      sources,
      confidence: 0.85,
      tokensUsed: response.tokensUsed || 0,
      responseTime: Date.now() - startTime,
    };
  }

  /**
   * ============================================
   * LIST RAG DOCUMENTS
   * ============================================
   */
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

  /**
   * ============================================
   * DELETE DOCUMENT
   * ============================================
   */
  static async deleteDocument(id: string, userId: string): Promise<void> {
    const document = await prisma.ragDocument.findUnique({ where: { id } });
    if (!document) throw new Error('Document not found');

    // Delete from S3
    await FileService.deleteFromS3(document.s3Key);

    // Delete from Qdrant
    if (document.vectorIds.length > 0) {
      await qdrantService.deleteByFilter({ documentId: id });
    }

    // Delete from database
    await prisma.ragDocument.delete({ where: { id } });

    logger.info(`RAG document deleted: ${id}`);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

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
    }

    return chunks;
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