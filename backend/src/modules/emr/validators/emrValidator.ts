import { z } from 'zod';
import { PrescriptionStatus, LabReportStatus } from '@prisma/client';

// Vital signs validation
const vitalSignsSchema = z.object({
  temperature: z.number().min(35).max(42).optional(),
  bloodPressureSystolic: z.number().min(60).max(250).optional(),
  bloodPressureDiastolic: z.number().min(40).max(150).optional(),
  heartRate: z.number().min(30).max(250).optional(),
  respiratoryRate: z.number().min(8).max(60).optional(),
  oxygenSaturation: z.number().min(50).max(100).optional(),
  height: z.number().min(20).max(300).optional(),
  weight: z.number().min(1).max(500).optional(),
  bmi: z.number().min(10).max(60).optional(),
  painLevel: z.number().min(0).max(10).optional(),
}).optional().nullable();

// Create EMR validation
export const createEMRSchema = z.object({
  body: z.object({
    patientId: z.string({
      required_error: 'Patient ID is required',
    }).cuid('Invalid patient ID'),

    appointmentId: z.string().cuid('Invalid appointment ID').optional().nullable(),
    doctorId: z.string().cuid('Invalid doctor ID').optional().nullable(),

    chiefComplaint: z.string().max(2000, 'Must be less than 2000 characters').optional().nullable(),
    diagnosis: z.string().max(5000, 'Must be less than 5000 characters').optional().nullable(),
    icd10Codes: z.array(z.string().max(10)).optional().default([]),
    symptoms: z.record(z.any()).optional().nullable(),
    vitalSigns: vitalSignsSchema,
    examinationNotes: z.string().max(10000, 'Must be less than 10000 characters').optional().nullable(),
    treatmentPlan: z.string().max(10000, 'Must be less than 10000 characters').optional().nullable(),
    doctorNotes: z.string().max(10000, 'Must be less than 10000 characters').optional().nullable(),
    status: z.string().optional().default('DRAFT'),
  }),
});

// Update EMR validation
export const updateEMRSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid EMR ID'),
  }),
  body: z.object({
    chiefComplaint: z.string().max(2000).optional().nullable(),
    diagnosis: z.string().max(5000).optional().nullable(),
    icd10Codes: z.array(z.string().max(10)).optional(),
    symptoms: z.record(z.any()).optional().nullable(),
    vitalSigns: vitalSignsSchema,
    examinationNotes: z.string().max(10000).optional().nullable(),
    treatmentPlan: z.string().max(10000).optional().nullable(),
    doctorNotes: z.string().max(10000).optional().nullable(),
    status: z.string().optional(),
  }),
});

// Create prescription validation
export const createPrescriptionSchema = z.object({
  body: z.object({
    medicalRecordId: z.string().cuid('Invalid medical record ID'),
    patientId: z.string().cuid('Invalid patient ID'),

    drugName: z.string({
      required_error: 'Drug name is required',
    }).min(1, 'Drug name is required').max(200, 'Drug name must be less than 200 characters'),

    genericName: z.string().max(200).optional().nullable(),
    dosage: z.string().min(1, 'Dosage is required').max(100),
    frequency: z.string().min(1, 'Frequency is required').max(200),
    duration: z.string().min(1, 'Duration is required').max(100),
    quantity: z.string().max(100).optional().nullable(),
    route: z.string().max(50).optional().nullable(),

    instructions: z.string().max(2000).optional().nullable(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional().nullable(),
    refillsAllowed: z.number().min(0).max(99).optional().default(0),
    isControlled: z.boolean().optional().default(false),
  }),
});

// Create lab report validation
export const createLabReportSchema = z.object({
  body: z.object({
    medicalRecordId: z.string().cuid().optional().nullable(),
    patientId: z.string().cuid('Invalid patient ID'),
    doctorId: z.string().cuid().optional().nullable(),

    testName: z.string({
      required_error: 'Test name is required',
    }).min(1).max(200),

    testCategory: z.string().max(100).optional().nullable(),
    results: z.record(z.any()),
    normalRanges: z.record(z.any()).optional().nullable(),
    interpretation: z.string().max(5000).optional().nullable(),
    status: z.nativeEnum(LabReportStatus).optional().default(LabReportStatus.PENDING),
  }),
});

// EMR ID parameter validation
export const emrIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid EMR ID'),
  }),
});

// EMR query validation
export const emrQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('10'),
    patientId: z.string().cuid().optional(),
    doctorId: z.string().cuid().optional(),
    appointmentId: z.string().cuid().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    status: z.string().optional(),
    search: z.string().max(200).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'status']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

// Sign EMR validation
export const signEMRSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid EMR ID'),
  }),
  body: z.object({
    signature: z.string().optional(),
  }),
});

// Type exports
export type CreateEMRInput = z.infer<typeof createEMRSchema>['body'];
export type UpdateEMRInput = z.infer<typeof updateEMRSchema>['body'];
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>['body'];
export type CreateLabReportInput = z.infer<typeof createLabReportSchema>['body'];
export type EMRQueryInput = z.infer<typeof emrQuerySchema>['query'];