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
const aiClient_1 = require("../../../integration/ai/aiClient");
const vectorlessRagClient_1 = require("../../../integration/ai/vectorlessRagClient");
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
class RagService {
    static async ingestDocument(file, data, userId) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const content = await fs.readFile(file.path, 'utf-8');
        const chunks = this.chunkText(content, data.chunkSize || 1000, data.chunkOverlap || 200);
        const upload = await fileService_1.FileService.uploadMulterFile(file);
        const document = await prisma_1.default.$transaction(async (tx) => {
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
            await vectorlessRagClient_1.vectorlessRagClient.storeChunks(doc.id, chunks);
            return tx.ragDocument.findUniqueOrThrow({
                where: { id: doc.id },
                include: {
                    uploadedBy: { select: { id: true, firstName: true, lastName: true } },
                },
            });
        });
        logger_1.default.info(`RAG document ingested (vectorless): ${document.id} (${chunks.length} chunks)`);
        return this.formatDocumentResponse(document);
    }
    static async query(data) {
        const startTime = Date.now();
        const maxResults = data.maxResults || 5;
        const minRelevance = data.minRelevance ?? 0.05;
        const hits = await vectorlessRagClient_1.vectorlessRagClient.search(data.query, maxResults, data.sourceType, minRelevance);
        const context = vectorlessRagClient_1.vectorlessRagClient.buildContext(hits);
        let answer;
        let tokensUsed = 0;
        if (context) {
            const response = await aiClient_1.llmClient.chat([
                {
                    role: 'system',
                    content: `${aiClient_1.llmClient.getSystemPrompt('GENERAL')}

Answer ONLY using the provided knowledge base excerpts. If the excerpts do not contain enough information, say so clearly. Cite source titles when relevant.`,
                },
                {
                    role: 'system',
                    content: `Knowledge base excerpts:\n\n${context}`,
                },
                { role: 'user', content: data.query },
            ], { temperature: 0.3, maxTokens: 1500 });
            answer = response.message;
            tokensUsed = response.usage.totalTokens;
        }
        else {
            const response = await aiClient_1.llmClient.generateResponse(data.query, 'GENERAL_INQUIRY', { note: 'No matching knowledge base documents found' });
            answer = response.response;
            tokensUsed = response.tokensUsed || 0;
        }
        const citations = hits.map((hit) => ({
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
    static async deleteDocument(id, userId) {
        const document = await prisma_1.default.ragDocument.findUnique({ where: { id } });
        if (!document)
            throw new errors_1.NotFoundError('Document not found');
        await fileService_1.FileService.deleteFile(document.cloudinaryPublicId);
        await vectorlessRagClient_1.vectorlessRagClient.deleteDocumentChunks(id);
        await prisma_1.default.ragDocument.delete({ where: { id } });
        logger_1.default.info(`RAG document deleted (vectorless): ${id}`);
    }
    static chunkText(text, chunkSize, chunkOverlap) {
        const chunks = [];
        let start = 0;
        while (start < text.length) {
            const end = Math.min(start + chunkSize, text.length);
            chunks.push(text.slice(start, end));
            start += chunkSize - chunkOverlap;
            if (start >= text.length)
                break;
            if (chunkSize <= chunkOverlap)
                break;
        }
        return chunks.filter((c) => c.trim().length > 0);
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