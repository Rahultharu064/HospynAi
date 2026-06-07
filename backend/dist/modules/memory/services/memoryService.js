"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryService = void 0;
const uuid_1 = require("uuid");
const prisma_1 = __importDefault(require("../../../config/prisma"));
const quadrantClient_1 = require("../../../integration/ai/quadrantClient");
const aiClient_1 = require("../../../integration/ai/aiClient");
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
class MemoryService {
    /**
     * ============================================
     * SAVE MEMORY
     * ============================================
     */
    static async saveMemory(data, userId) {
        // Validate user/patient if provided
        if (data.userId) {
            const user = await prisma_1.default.user.findUnique({ where: { id: data.userId } });
            if (!user)
                throw new errors_1.NotFoundError('User not found');
        }
        if (data.patientId) {
            const patient = await prisma_1.default.patient.findUnique({ where: { id: data.patientId } });
            if (!patient || patient.deletedAt)
                throw new errors_1.NotFoundError('Patient not found');
        }
        // Generate embedding ID for vector storage
        const embeddingId = (0, uuid_1.v4)();
        // Create memory in database
        const memory = await prisma_1.default.aiMemory.create({
            data: {
                userId: data.userId || null,
                patientId: data.patientId || null,
                memoryType: data.memoryType,
                content: data.content,
                embeddingId,
                relevanceScore: data.importance || 0.5,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
                metadata: {
                    ...data.metadata,
                    tags: data.tags || [],
                    source: data.source,
                    sessionId: data.sessionId,
                },
            },
        });
        // In production: Generate embedding and store in Qdrant
        const embedding = await this.generateEmbedding(data.content);
        await quadrantClient_1.qdrantService.saveMemory(embeddingId, embedding, {
            memoryId: memory.id,
            memoryType: data.memoryType,
            userId: data.userId,
            patientId: data.patientId,
            tags: data.tags,
            importance: data.importance,
        });
        logger_1.default.info(`Memory saved: ${memory.id} (${data.memoryType})`);
        return this.formatMemoryResponse(memory);
    }
    /**
     * ============================================
     * SEARCH MEMORIES (Semantic Search)
     * ============================================
     */
    static async searchMemories(data) {
        const startTime = Date.now();
        // Build filter for database query
        const where = {};
        if (data.userId)
            where.userId = data.userId;
        if (data.patientId)
            where.patientId = data.patientId;
        if (data.memoryType)
            where.memoryType = data.memoryType;
        if (data.dateFrom || data.dateTo) {
            where.createdAt = {};
            if (data.dateFrom)
                where.createdAt.gte = new Date(data.dateFrom);
            if (data.dateTo)
                where.createdAt.lte = new Date(data.dateTo);
        }
        // In production: Generate query embedding and search Qdrant
        const queryEmbedding = await this.generateEmbedding(data.query);
        const vectorResults = await quadrantClient_1.qdrantService.searchMemories(queryEmbedding, data.limit, data.minRelevance);
        // For now, do text-based search in database
        const memories = await prisma_1.default.aiMemory.findMany({
            where: {
                ...where,
                OR: [
                    { content: { contains: data.query, mode: 'insensitive' } },
                    { metadata: { path: ['tags'], array_contains: data.query } },
                ],
            },
            orderBy: { relevanceScore: 'desc' },
            take: data.limit || 10,
        });
        // Update access count
        for (const memory of memories) {
            await prisma_1.default.aiMemory.update({
                where: { id: memory.id },
                data: {
                    relevanceScore: { increment: 0.01 }, // Slight boost for accessed memories
                },
            });
        }
        const results = memories.map((m) => {
            const relevanceScore = this.calculateRelevance(data.query, m.content, m.relevanceScore || 0.5);
            const highlightSnippet = this.generateSnippet(m.content, data.query);
            return {
                memory: this.formatMemoryResponse(m),
                relevanceScore,
                matchedTags: this.findMatchingTags(data.query, m.metadata?.tags || []),
                highlightSnippet,
            };
        });
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
        return {
            query: data.query,
            results,
            totalFound: results.length,
            searchTime: Date.now() - startTime,
        };
    }
    /**
     * ============================================
     * GET MEMORY BY ID
     * ============================================
     */
    static async getMemoryById(id) {
        const memory = await prisma_1.default.aiMemory.findUnique({ where: { id } });
        if (!memory)
            throw new errors_1.NotFoundError('Memory not found');
        // Update access count
        await prisma_1.default.aiMemory.update({
            where: { id },
            data: { relevanceScore: { increment: 0.01 } },
        });
        return this.formatMemoryResponse(memory);
    }
    /**
     * ============================================
     * UPDATE MEMORY
     * ============================================
     */
    static async updateMemory(id, data, userId) {
        const memory = await prisma_1.default.aiMemory.findUnique({ where: { id } });
        if (!memory)
            throw new errors_1.NotFoundError('Memory not found');
        const updateData = {};
        if (data.content)
            updateData.content = data.content;
        if (data.importance !== undefined)
            updateData.relevanceScore = data.importance;
        if (data.tags) {
            updateData.metadata = {
                ...memory.metadata,
                tags: data.tags,
            };
        }
        if (data.expiresAt !== undefined) {
            updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
        }
        const updated = await prisma_1.default.aiMemory.update({
            where: { id },
            data: updateData,
        });
        logger_1.default.info(`Memory updated: ${id}`);
        return this.formatMemoryResponse(updated);
    }
    /**
     * ============================================
     * DELETE MEMORY
     * ============================================
     */
    static async deleteMemory(id, userId) {
        const memory = await prisma_1.default.aiMemory.findUnique({ where: { id } });
        if (!memory)
            throw new errors_1.NotFoundError('Memory not found');
        // Delete from Qdrant if embedding exists
        if (memory.embeddingId) {
            await quadrantClient_1.qdrantService.deleteVectors([memory.embeddingId]).catch(() => { });
        }
        await prisma_1.default.aiMemory.delete({ where: { id } });
        logger_1.default.info(`Memory deleted: ${id}`);
    }
    /**
     * ============================================
     * LIST MEMORIES
     * ============================================
     */
    static async listMemories(query) {
        const { page = 1, limit = 20, memoryType, tags } = query;
        const where = {};
        if (query.userId)
            where.userId = query.userId;
        if (query.patientId)
            where.patientId = query.patientId;
        if (memoryType)
            where.memoryType = memoryType;
        if (query.dateFrom || query.dateTo) {
            where.createdAt = {};
            if (query.dateFrom)
                where.createdAt.gte = new Date(query.dateFrom);
            if (query.dateTo)
                where.createdAt.lte = new Date(query.dateTo);
        }
        const skip = (page - 1) * limit;
        const [memories, total] = await Promise.all([
            prisma_1.default.aiMemory.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.aiMemory.count({ where }),
        ]);
        return {
            memories: memories.map((m) => this.formatMemoryResponse(m)),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    /**
     * ============================================
     * GET PATIENT CONTEXT (Aggregated Memories)
     * ============================================
     */
    static async getPatientContext(patientId) {
        const patient = await prisma_1.default.patient.findUnique({ where: { id: patientId } });
        if (!patient)
            throw new errors_1.NotFoundError('Patient not found');
        // Get all memories for this patient
        const memories = await prisma_1.default.aiMemory.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        // Extract preferences
        const preferences = memories
            .filter((m) => m.memoryType === 'PREFERENCE')
            .map((m) => m.content);
        // Extract common symptoms
        const symptoms = memories
            .filter((m) => m.memoryType === 'MEDICAL')
            .map((m) => m.content);
        // Extract medication history
        const medicationHistory = memories
            .filter((m) => m.memoryType === 'PATIENT_HISTORY')
            .map((m) => m.content);
        // Extract appointment patterns
        const appointmentPatterns = memories
            .filter((m) => m.memoryType === 'APPOINTMENT_PATTERN')
            .map((m) => m.content);
        // Extract doctor preferences
        const doctorPreferences = memories
            .filter((m) => m.memoryType === 'PREFERENCE' && m.content.includes('doctor'))
            .map((m) => m.content);
        // Extract communication preferences
        const communicationPreferences = memories
            .filter((m) => m.memoryType === 'PREFERENCE' &&
            (m.content.includes('communication') || m.content.includes('contact') || m.content.includes('notification')))
            .map((m) => m.content);
        return {
            preferences,
            commonSymptoms: symptoms,
            medicationHistory,
            appointmentPatterns,
            doctorPreferences,
            communicationPreferences,
            lastUpdated: memories.length > 0 ? memories[0].updatedAt.toISOString() : new Date().toISOString(),
        };
    }
    /**
     * ============================================
     * CONSOLIDATE MEMORIES
     * ============================================
     */
    static async consolidateMemories(data, userId) {
        const startTime = Date.now();
        // Get memories to consolidate
        const where = {};
        if (data.userId)
            where.userId = data.userId;
        if (data.patientId)
            where.patientId = data.patientId;
        if (data.memoryType)
            where.memoryType = data.memoryType;
        const timeRangeMap = {
            day: 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000,
        };
        where.createdAt = {
            gte: new Date(Date.now() - timeRangeMap[data.timeRange || 'week']),
        };
        const memories = await prisma_1.default.aiMemory.findMany({ where });
        if (memories.length < 2) {
            return {
                originalCount: memories.length,
                consolidatedCount: memories.length,
                summary: 'Not enough memories to consolidate',
                keyInsights: [],
                recommendations: [],
                processingTime: Date.now() - startTime,
            };
        }
        // Combine memory contents
        const combinedContent = memories
            .map((m) => `[${m.memoryType}] ${m.content}`)
            .join('\n\n');
        // Use AI to generate summary and insights
        const analysis = await aiClient_1.gptClient.generateResponse(`Please analyze and summarize these patient memories:\n\n${combinedContent}\n\nProvide: 1) Summary 2) Key insights 3) Recommendations`, 'SUMMARIZE_RECORDS', {});
        // Save consolidated memory
        const consolidatedMemory = await this.saveMemory({
            userId: data.userId,
            patientId: data.patientId,
            memoryType: 'CONTEXT',
            content: `Consolidated Summary: ${analysis.response}`,
            importance: 0.8,
            metadata: {
                consolidatedFrom: memories.map((m) => m.id),
                originalCount: memories.length,
                timeRange: data.timeRange,
            },
            tags: ['consolidated', 'summary'],
            source: 'memory-consolidation',
        }, userId);
        logger_1.default.info(`Memories consolidated: ${memories.length} → 1`);
        return {
            originalCount: memories.length,
            consolidatedCount: 1,
            summary: analysis.response,
            keyInsights: [],
            recommendations: [],
            processingTime: Date.now() - startTime,
        };
    }
    /**
     * ============================================
     * MEMORY STATISTICS
     * ============================================
     */
    static async getMemoryStats() {
        const [totalMemories, byType,] = await Promise.all([
            prisma_1.default.aiMemory.count(),
            prisma_1.default.aiMemory.groupBy({
                by: ['memoryType'],
                _count: true,
            }),
        ]);
        const byTypeMap = {};
        byType.forEach((t) => { byTypeMap[t.memoryType] = t._count; });
        return {
            totalMemories,
            byType: byTypeMap,
            byImportance: {},
            averageRelevance: 0.65,
            totalEmbeddings: 0,
            storageSize: 0,
            recentActivity: [],
            topTags: [],
        };
    }
    /**
     * ============================================
     * CLEANUP EXPIRED MEMORIES
     * ============================================
     */
    static async cleanupExpiredMemories() {
        const result = await prisma_1.default.aiMemory.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        if (result.count > 0) {
            logger_1.default.info(`Cleaned up ${result.count} expired memories`);
        }
        return result.count;
    }
    // ============================================
    // HELPER METHODS
    // ============================================
    static calculateRelevance(query, content, baseScore) {
        // Simple TF-IDF-like relevance calculation
        const queryTerms = query.toLowerCase().split(/\s+/);
        const contentLower = content.toLowerCase();
        let matchCount = 0;
        for (const term of queryTerms) {
            if (contentLower.includes(term))
                matchCount++;
        }
        const termRelevance = matchCount / queryTerms.length;
        return Math.min(1, baseScore * 0.7 + termRelevance * 0.3);
    }
    static generateSnippet(content, query) {
        const queryTerms = query.toLowerCase().split(/\s+/);
        const contentLower = content.toLowerCase();
        // Find the position of the first matching term
        let bestPosition = 0;
        for (const term of queryTerms) {
            const pos = contentLower.indexOf(term);
            if (pos !== -1) {
                bestPosition = pos;
                break;
            }
        }
        // Extract snippet around the match
        const snippetStart = Math.max(0, bestPosition - 60);
        const snippetEnd = Math.min(content.length, bestPosition + 120);
        let snippet = content.substring(snippetStart, snippetEnd);
        if (snippetStart > 0)
            snippet = '...' + snippet;
        if (snippetEnd < content.length)
            snippet = snippet + '...';
        // Highlight matching terms
        for (const term of queryTerms) {
            const regex = new RegExp(`(${term})`, 'gi');
            snippet = snippet.replace(regex, '<mark>$1</mark>');
        }
        return snippet;
    }
    static findMatchingTags(query, tags) {
        const queryLower = query.toLowerCase();
        return tags.filter((tag) => queryLower.includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(queryLower));
    }
    static formatMemoryResponse(memory) {
        return {
            id: memory.id,
            userId: memory.userId,
            patientId: memory.patientId,
            memoryType: memory.memoryType,
            content: memory.content,
            summary: null,
            importance: memory.relevanceScore || 0.5,
            relevanceScore: memory.relevanceScore,
            embeddingId: memory.embeddingId,
            metadata: memory.metadata,
            tags: memory.metadata?.tags || [],
            source: memory.metadata?.source || null,
            sessionId: memory.metadata?.sessionId || null,
            accessCount: 0,
            lastAccessedAt: null,
            expiresAt: memory.expiresAt?.toISOString() || null,
            createdAt: memory.createdAt.toISOString(),
            updatedAt: memory.updatedAt.toISOString(),
        };
    }
}
exports.MemoryService = MemoryService;
//# sourceMappingURL=memoryService.js.map