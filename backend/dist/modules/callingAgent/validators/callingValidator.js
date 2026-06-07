"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callSidSchema = exports.callQuerySchema = exports.updateCallStatusSchema = exports.transferToHumanSchema = exports.initiateCallSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.initiateCallSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string({
            required_error: 'Patient ID is required',
        }).cuid('Invalid patient ID'),
        phoneNumber: zod_1.z.string({
            required_error: 'Phone number is required',
        }).regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format'),
        callType: zod_1.z.enum(['REMINDER', 'FOLLOW_UP', 'APPOINTMENT_CONFIRMATION', 'GENERAL'], {
            required_error: 'Call type is required',
        }),
        appointmentId: zod_1.z.string().cuid().optional().nullable(),
        message: zod_1.z.string().max(1000).optional().nullable(),
        callbackUrl: zod_1.z.string().url().optional().nullable(),
    }),
});
exports.transferToHumanSchema = zod_1.z.object({
    body: zod_1.z.object({
        callSid: zod_1.z.string({
            required_error: 'Call SID is required',
        }).min(1),
        reason: zod_1.z.string().min(1, 'Reason is required').max(500),
        priority: zod_1.z.enum(['normal', 'urgent']).optional().default('normal'),
        department: zod_1.z.string().max(100).optional().nullable(),
    }),
});
exports.updateCallStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        callSid: zod_1.z.string().min(1),
        status: zod_1.z.string().min(1),
        duration: zod_1.z.number().optional(),
        recordingUrl: zod_1.z.string().url().optional().nullable(),
    }),
});
exports.callQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('20'),
        patientId: zod_1.z.string().cuid().optional(),
        outcome: zod_1.z.nativeEnum(client_1.CallOutcome).optional(),
        direction: zod_1.z.enum(['INBOUND', 'OUTBOUND']).optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        aiHandled: zod_1.z.string().transform((v) => v === 'true').optional(),
        search: zod_1.z.string().max(200).optional(),
        sortBy: zod_1.z.enum(['startedAt', 'duration', 'outcome', 'createdAt']).optional().default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
exports.callSidSchema = zod_1.z.object({
    params: zod_1.z.object({
        callSid: zod_1.z.string().min(1, 'Call SID is required'),
    }),
});
//# sourceMappingURL=callingValidator.js.map