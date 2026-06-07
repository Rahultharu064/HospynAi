"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionQuerySchema = exports.endSessionSchema = exports.messageSchema = exports.signalSchema = exports.joinSessionSchema = exports.createSessionSchema = void 0;
const zod_1 = require("zod");
exports.createSessionSchema = zod_1.z.object({
    body: zod_1.z.object({
        appointmentId: zod_1.z.string({
            required_error: 'Appointment ID is required',
        }).cuid('Invalid appointment ID'),
        patientId: zod_1.z.string().cuid('Invalid patient ID'),
        doctorId: zod_1.z.string().cuid('Invalid doctor ID'),
        scheduledAt: zod_1.z.string().datetime().optional().nullable(),
        duration: zod_1.z.number().min(5).max(180).optional().default(30),
        recordSession: zod_1.z.boolean().optional().default(false),
    }),
});
exports.joinSessionSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().min(1, 'Session ID is required'),
    }),
    body: zod_1.z.object({
        userId: zod_1.z.string().cuid('Invalid user ID'),
        role: zod_1.z.enum(['DOCTOR', 'PATIENT']),
    }),
});
exports.signalSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().min(1),
    }),
    body: zod_1.z.object({
        signal: zod_1.z.any(),
        type: zod_1.z.enum(['offer', 'answer', 'ice-candidate']),
    }),
});
exports.messageSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().min(1),
    }),
    body: zod_1.z.object({
        message: zod_1.z.string().min(1).max(5000),
        type: zod_1.z.enum(['text', 'file', 'image']).optional().default('text'),
        fileUrl: zod_1.z.string().url().optional().nullable(),
    }),
});
exports.endSessionSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().min(1),
    }),
    body: zod_1.z.object({
        reason: zod_1.z.string().max(500).optional().nullable(),
        notes: zod_1.z.string().max(2000).optional().nullable(),
    }),
});
exports.sessionQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(50)).optional().default('20'),
        patientId: zod_1.z.string().cuid().optional(),
        doctorId: zod_1.z.string().cuid().optional(),
        appointmentId: zod_1.z.string().cuid().optional(),
        status: zod_1.z.enum(['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED', 'DISCONNECTED']).optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        sortBy: zod_1.z.enum(['createdAt', 'startedAt', 'duration']).optional().default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
//# sourceMappingURL=telemedicineValidators.js.map