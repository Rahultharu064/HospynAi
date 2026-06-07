"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signEMRSchema = exports.emrQuerySchema = exports.emrIdSchema = exports.createLabReportSchema = exports.createPrescriptionSchema = exports.updateEMRSchema = exports.createEMRSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Vital signs validation
const vitalSignsSchema = zod_1.z.object({
    temperature: zod_1.z.number().min(35).max(42).optional(),
    bloodPressureSystolic: zod_1.z.number().min(60).max(250).optional(),
    bloodPressureDiastolic: zod_1.z.number().min(40).max(150).optional(),
    heartRate: zod_1.z.number().min(30).max(250).optional(),
    respiratoryRate: zod_1.z.number().min(8).max(60).optional(),
    oxygenSaturation: zod_1.z.number().min(50).max(100).optional(),
    height: zod_1.z.number().min(20).max(300).optional(),
    weight: zod_1.z.number().min(1).max(500).optional(),
    bmi: zod_1.z.number().min(10).max(60).optional(),
    painLevel: zod_1.z.number().min(0).max(10).optional(),
}).optional().nullable();
// Create EMR validation
exports.createEMRSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string({
            required_error: 'Patient ID is required',
        }).cuid('Invalid patient ID'),
        appointmentId: zod_1.z.string().cuid('Invalid appointment ID').optional().nullable(),
        doctorId: zod_1.z.string().cuid('Invalid doctor ID').optional().nullable(),
        chiefComplaint: zod_1.z.string().max(2000, 'Must be less than 2000 characters').optional().nullable(),
        diagnosis: zod_1.z.string().max(5000, 'Must be less than 5000 characters').optional().nullable(),
        icd10Codes: zod_1.z.array(zod_1.z.string().max(10)).optional().default([]),
        symptoms: zod_1.z.record(zod_1.z.any()).optional().nullable(),
        vitalSigns: vitalSignsSchema,
        examinationNotes: zod_1.z.string().max(10000, 'Must be less than 10000 characters').optional().nullable(),
        treatmentPlan: zod_1.z.string().max(10000, 'Must be less than 10000 characters').optional().nullable(),
        doctorNotes: zod_1.z.string().max(10000, 'Must be less than 10000 characters').optional().nullable(),
        status: zod_1.z.string().optional().default('DRAFT'),
    }),
});
// Update EMR validation
exports.updateEMRSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid EMR ID'),
    }),
    body: zod_1.z.object({
        chiefComplaint: zod_1.z.string().max(2000).optional().nullable(),
        diagnosis: zod_1.z.string().max(5000).optional().nullable(),
        icd10Codes: zod_1.z.array(zod_1.z.string().max(10)).optional(),
        symptoms: zod_1.z.record(zod_1.z.any()).optional().nullable(),
        vitalSigns: vitalSignsSchema,
        examinationNotes: zod_1.z.string().max(10000).optional().nullable(),
        treatmentPlan: zod_1.z.string().max(10000).optional().nullable(),
        doctorNotes: zod_1.z.string().max(10000).optional().nullable(),
        status: zod_1.z.string().optional(),
    }),
});
// Create prescription validation
exports.createPrescriptionSchema = zod_1.z.object({
    body: zod_1.z.object({
        medicalRecordId: zod_1.z.string().cuid('Invalid medical record ID'),
        patientId: zod_1.z.string().cuid('Invalid patient ID'),
        drugName: zod_1.z.string({
            required_error: 'Drug name is required',
        }).min(1, 'Drug name is required').max(200, 'Drug name must be less than 200 characters'),
        genericName: zod_1.z.string().max(200).optional().nullable(),
        dosage: zod_1.z.string().min(1, 'Dosage is required').max(100),
        frequency: zod_1.z.string().min(1, 'Frequency is required').max(200),
        duration: zod_1.z.string().min(1, 'Duration is required').max(100),
        quantity: zod_1.z.string().max(100).optional().nullable(),
        route: zod_1.z.string().max(50).optional().nullable(),
        instructions: zod_1.z.string().max(2000).optional().nullable(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional().nullable(),
        refillsAllowed: zod_1.z.number().min(0).max(99).optional().default(0),
        isControlled: zod_1.z.boolean().optional().default(false),
    }),
});
// Create lab report validation
exports.createLabReportSchema = zod_1.z.object({
    body: zod_1.z.object({
        medicalRecordId: zod_1.z.string().cuid().optional().nullable(),
        patientId: zod_1.z.string().cuid('Invalid patient ID'),
        doctorId: zod_1.z.string().cuid().optional().nullable(),
        testName: zod_1.z.string({
            required_error: 'Test name is required',
        }).min(1).max(200),
        testCategory: zod_1.z.string().max(100).optional().nullable(),
        results: zod_1.z.record(zod_1.z.any()),
        normalRanges: zod_1.z.record(zod_1.z.any()).optional().nullable(),
        interpretation: zod_1.z.string().max(5000).optional().nullable(),
        status: zod_1.z.nativeEnum(client_1.LabReportStatus).optional().default(client_1.LabReportStatus.PENDING),
    }),
});
// EMR ID parameter validation
exports.emrIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid EMR ID'),
    }),
});
// EMR query validation
exports.emrQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('10'),
        patientId: zod_1.z.string().cuid().optional(),
        doctorId: zod_1.z.string().cuid().optional(),
        appointmentId: zod_1.z.string().cuid().optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        status: zod_1.z.string().optional(),
        search: zod_1.z.string().max(200).optional(),
        sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'status']).optional().default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
// Sign EMR validation
exports.signEMRSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid EMR ID'),
    }),
    body: zod_1.z.object({
        signature: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=emrValidator.js.map