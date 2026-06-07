"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearHistorySchema = exports.chatHistorySchema = exports.audioMessageSchema = exports.chatMessageSchema = void 0;
const zod_1 = require("zod");
exports.chatMessageSchema = zod_1.z.object({
    body: zod_1.z.object({
        message: zod_1.z.string({
            required_error: 'Message is required',
        }).min(1, 'Message cannot be empty').max(10000, 'Message too long'),
        sessionId: zod_1.z.string().optional().nullable(),
        patientId: zod_1.z.string().cuid('Invalid patient ID').optional().nullable(),
        context: zod_1.z.enum(['GENERAL', 'DOCTOR', 'PATIENT', 'TRIAGE']).optional().default('GENERAL'),
        language: zod_1.z.string().length(2).optional().default('en'),
        stream: zod_1.z.boolean().default(false),
        attachments: zod_1.z.array(zod_1.z.object({
            type: zod_1.z.enum(['image', 'document', 'audio']),
            url: zod_1.z.string().url(),
            name: zod_1.z.string().max(200),
            mimeType: zod_1.z.string(),
            size: zod_1.z.number().optional(),
        })).optional(),
    }),
});
exports.audioMessageSchema = zod_1.z.object({
    body: zod_1.z.object({
        language: zod_1.z.string().length(2).optional().default('en'),
        format: zod_1.z.enum(['webm', 'mp3', 'wav', 'm4a']).optional().default('webm'),
        sessionId: zod_1.z.string().optional().nullable(),
        patientId: zod_1.z.string().cuid().optional().nullable(),
        context: zod_1.z.enum(['GENERAL', 'DOCTOR', 'PATIENT', 'TRIAGE']).optional().default('GENERAL'),
    }),
});
exports.chatHistorySchema = zod_1.z.object({
    query: zod_1.z.object({
        sessionId: zod_1.z.string().optional(),
        patientId: zod_1.z.string().cuid().optional(),
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('50'),
    }),
});
exports.clearHistorySchema = zod_1.z.object({
    body: zod_1.z.object({
        sessionId: zod_1.z.string().optional(),
        patientId: zod_1.z.string().cuid().optional(),
    }),
});
//# sourceMappingURL=chatbotValidator.js.map