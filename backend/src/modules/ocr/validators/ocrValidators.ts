import { z } from 'zod';

export const scanDocumentSchema = z.object({
  body: z.object({
    patientId: z.string().cuid('Invalid patient ID').optional().nullable(),

    documentType: z.enum([
      'PRESCRIPTION', 'LAB_REPORT', 'INSURANCE_CARD',
      'ID_PROOF', 'MEDICAL_CERTIFICATE', 'DISCHARGE_SUMMARY', 'GENERIC'
    ], {
      required_error: 'Document type is required',
    }),

    language: z.string().length(2).optional().default('en'),
    preprocess: z.boolean().optional().default(true),
    extractFields: z.boolean().optional().default(true),
    confidenceThreshold: z.number().min(0).max(100).optional().default(60),
  }),
});

export const scanPrescriptionSchema = z.object({
  body: z.object({
    patientId: z.string().cuid('Invalid patient ID'),
    doctorId: z.string().cuid('Invalid doctor ID').optional().nullable(),
    language: z.string().length(2).optional().default('en'),
  }),
});

export const scanLabReportSchema = z.object({
  body: z.object({
    patientId: z.string().cuid('Invalid patient ID'),
    doctorId: z.string().cuid('Invalid doctor ID').optional().nullable(),
    language: z.string().length(2).optional().default('en'),
  }),
});

export const scanInsuranceCardSchema = z.object({
  body: z.object({
    patientId: z.string().cuid('Invalid patient ID'),
    language: z.string().length(2).optional().default('en'),
  }),
});

export const verifyOcrDataSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid OCR result ID'),
  }),
  body: z.object({
    corrections: z.record(z.any()),
    confirmed: z.boolean(),
  }),
});

export const ocrIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid OCR result ID'),
  }),
});

export const ocrQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
    patientId: z.string().cuid().optional(),
    documentType: z.enum([
      'PRESCRIPTION', 'LAB_REPORT', 'INSURANCE_CARD',
      'ID_PROOF', 'MEDICAL_CERTIFICATE', 'DISCHARGE_SUMMARY', 'GENERIC'
    ]).optional(),
    status: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    sortBy: z.enum(['createdAt', 'confidence', 'processingTime']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export type ScanDocumentInput = z.infer<typeof scanDocumentSchema>['body'];
export type ScanPrescriptionInput = z.infer<typeof scanPrescriptionSchema>['body'];
export type ScanLabReportInput = z.infer<typeof scanLabReportSchema>['body'];
export type ScanInsuranceCardInput = z.infer<typeof scanInsuranceCardSchema>['body'];
export type VerifyOcrDataInput = z.infer<typeof verifyOcrDataSchema>['body'];
export type OcrQueryInput = z.infer<typeof ocrQuerySchema>['query'];