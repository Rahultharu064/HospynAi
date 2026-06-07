"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagService = void 0;
const prisma_1 = __importDefault(require("../../../config/prisma"));
const fileService_1 = require("../../auth/services/fileService");
const quadrantClient_1 = require("../../../integration/ai/quadrantClient");
const aiClient_1 = require("../../../integration/ai/aiClient");
const logger_1 = __importDefault(require("../../../utils/logger"));
class RagService {
    /**
     * ============================================
     * INGEST DOCUMENT
     * ============================================
     */
    static async ingestDocument(file, data, userId) {
        // Upload to S3
        const s3Key = await fileService_1.FileService.uploadToS3(file.path, file.originalname, file.mimetype);
        // Read file content
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const content = await fs.readFile(file.path, 'utf-8');
        // Split into chunks
        const chunks = this.chunkText(content, data.chunkSize || 1000, data.chunkOverlap || 200);
        // Create document record
        const document = await prisma_1.default.ragDocument.create({
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
        logger_1.default.info(`Document ingested: ${document.id} (${chunks.length} chunks)`);
        return this.formatDocumentResponse(document);
    }
    /**
     * ============================================
     * QUERY RAG
     * ============================================
     */
    static async query(data) {
        const startTime = Date.now();
        // In production:
        // 1. Embed the query
        // 2. Search Qdrant for similar chunks
        // 3. Build context from retrieved chunks
        // 4. Generate answer using GPT with context
        const response = await aiClient_1.gptClient.generateResponse(data.query, 'GENERAL_INQUIRY', { useKnowledgeBase: true });
        const citations = [];
        const sources = [];
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
    static async listDocuments(query) {
        const { page = 1, limit = 20, sourceType, isActive, search } = query;
        const where = {};
        if (sourceType)
            where.sourceType = sourceType;
        if (isActive !== undefined)
            where.isActive = isActive;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const skip = (page - 1) * limit;
        const [documents, total] = await Promise.all([
            prisma_1.default.ragDocument.findMany({
                where,
                include: {
                    uploadedBy: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.ragDocument.count({ where }),
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
    static async deleteDocument(id, userId) {
        const document = await prisma_1.default.ragDocument.findUnique({ where: { id } });
        if (!document)
            throw new Error('Document not found');
        // Delete from S3
        await fileService_1.FileService.deleteFromS3(document.s3Key);
        // Delete from Qdrant
        if (document.vectorIds.length > 0) {
            await quadrantClient_1.qdrantService.deleteByFilter({ documentId: id });
        }
        // Delete from database
        await prisma_1.default.ragDocument.delete({ where: { id } });
        logger_1.default.info(`RAG document deleted: ${id}`);
    }
    // ============================================
    // HELPER METHODS
    // ============================================
    static chunkText(text, chunkSize, chunkOverlap) {
        const chunks = [];
        let start = 0;
        while (start < text.length) {
            const end = Math.min(start + chunkSize, text.length);
            chunks.push(text.slice(start, end));
            start += chunkSize - chunkOverlap;
        }
        return chunks;
    }
    static formatDocumentResponse(doc) {
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
exports.RagService = RagService;
//# sourceMappingURL=ragService.js.map