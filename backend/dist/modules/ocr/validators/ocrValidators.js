"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocrQuerySchema = exports.ocrIdSchema = exports.verifyOcrDataSchema = exports.scanInsuranceCardSchema = exports.scanLabReportSchema = exports.scanPrescriptionSchema = exports.scanDocumentSchema = void 0;
const zod_1 = require("zod");
exports.scanDocumentSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string().cuid('Invalid patient ID').optional().nullable(),
        documentType: zod_1.z.enum([
            'PRESCRIPTION', 'LAB_REPORT', 'INSURANCE_CARD',
            'ID_PROOF', 'MEDICAL_CERTIFICATE', 'DISCHARGE_SUMMARY', 'GENERIC'
        ], {
            required_error: 'Document type is required',
        }),
        language: zod_1.z.string().length(2).optional().default('en'),
        preprocess: zod_1.z.boolean().optional().default(true),
        extractFields: zod_1.z.boolean().optional().default(true),
        confidenceThreshold: zod_1.z.number().min(0).max(100).optional().default(60),
    }),
});
exports.scanPrescriptionSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string().cuid('Invalid patient ID'),
        doctorId: zod_1.z.string().cuid('Invalid doctor ID').optional().nullable(),
        language: zod_1.z.string().length(2).optional().default('en'),
    }),
});
exports.scanLabReportSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string().cuid('Invalid patient ID'),
        doctorId: zod_1.z.string().cuid('Invalid doctor ID').optional().nullable(),
        language: zod_1.z.string().length(2).optional().default('en'),
    }),
});
exports.scanInsuranceCardSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string().cuid('Invalid patient ID'),
        language: zod_1.z.string().length(2).optional().default('en'),
    }),
});
exports.verifyOcrDataSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid OCR result ID'),
    }),
    body: zod_1.z.object({
        corrections: zod_1.z.record(zod_1.z.any()),
        confirmed: zod_1.z.boolean(),
    }),
});
exports.ocrIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid OCR result ID'),
    }),
});
exports.ocrQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('20'),
        patientId: zod_1.z.string().cuid().optional(),
        documentType: zod_1.z.enum([
            'PRESCRIPTION', 'LAB_REPORT', 'INSURANCE_CARD',
            'ID_PROOF', 'MEDICAL_CERTIFICATE', 'DISCHARGE_SUMMARY', 'GENERIC'
        ]).optional(),
        status: zod_1.z.string().optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        sortBy: zod_1.z.enum(['createdAt', 'confidence', 'processingTime']).optional().default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
//# sourceMappingURL=ocrValidators.js.map