"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocumentSchema = exports.bulkImportSchema = exports.patientQuerySchema = exports.patientIdSchema = exports.updatePatientSchema = exports.createPatientSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Custom date validation
const dateStringSchema = zod_1.z.string().refine((val) => {
    if (!val)
        return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
}, { message: 'Invalid date format' }).optional().nullable();
// Name validation
const nameSchema = zod_1.z.string()
    .min(2, 'Must be at least 2 characters')
    .max(50, 'Must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Can only contain letters, spaces, hyphens, and apostrophes')
    .transform((val) => val.trim());
// Phone validation
const phoneSchema = zod_1.z.string()
    .regex(/^\+?[1-9]\d{6,14}$/, 'Phone number must be in international format (e.g., +1234567890)')
    .optional()
    .nullable();
// Email validation
const emailSchema = zod_1.z.string()
    .email('Invalid email address')
    .optional()
    .nullable()
    .transform((val) => val ? val.toLowerCase().trim() : val);
// Create patient validation
exports.createPatientSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string({
            required_error: 'First name is required',
        }).min(2, 'First name must be at least 2 characters')
            .max(50, 'First name must be less than 50 characters')
            .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
            .transform((val) => val.trim()),
        lastName: zod_1.z.string({
            required_error: 'Last name is required',
        }).min(2, 'Last name must be at least 2 characters')
            .max(50, 'Last name must be less than 50 characters')
            .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
            .transform((val) => val.trim()),
        email: emailSchema,
        phone: phoneSchema,
        dateOfBirth: zod_1.z.string().refine((val) => {
            if (!val)
                return true;
            const date = new Date(val);
            if (isNaN(date.getTime()))
                return false;
            if (date > new Date())
                return false; // Can't be future date
            return true;
        }, { message: 'Invalid date of birth. Must be a valid past date.' }).optional().nullable(),
        gender: zod_1.z.nativeEnum(client_1.Gender).optional().nullable(),
        bloodGroup: zod_1.z.nativeEnum(client_1.BloodGroup).optional().nullable(),
        // Address fields
        address: zod_1.z.string().max(200, 'Address must be less than 200 characters').optional().nullable(),
        city: zod_1.z.string().max(100, 'City must be less than 100 characters').optional().nullable(),
        state: zod_1.z.string().max(100, 'State must be less than 100 characters').optional().nullable(),
        country: zod_1.z.string().max(100, 'Country must be less than 100 characters').optional().nullable(),
        zipCode: zod_1.z.string().max(20, 'Zip code must be less than 20 characters').optional().nullable(),
        // Emergency contact
        emergencyContactName: zod_1.z.string().max(100).optional().nullable(),
        emergencyContactPhone: phoneSchema,
        emergencyContactRelation: zod_1.z.string().max(50).optional().nullable(),
        // Insurance
        insuranceProvider: zod_1.z.string().max(100).optional().nullable(),
        insurancePolicyNumber: zod_1.z.string().max(50).optional().nullable(),
        insuranceValidUntil: dateStringSchema,
        // Medical information
        allergies: zod_1.z.array(zod_1.z.string().max(200)).optional().default([]),
        chronicConditions: zod_1.z.array(zod_1.z.string().max(200)).optional().default([]),
        currentMedications: zod_1.z.array(zod_1.z.string().max(200)).optional().default([]),
        notes: zod_1.z.string().max(5000, 'Notes must be less than 5000 characters').optional().nullable(),
        // Organization
        organizationId: zod_1.z.string().cuid('Invalid organization ID').optional().nullable(),
        branchId: zod_1.z.string().cuid('Invalid branch ID').optional().nullable(),
        primaryDoctorId: zod_1.z.string().cuid('Invalid doctor ID').optional().nullable(),
    }),
});
// Update patient validation
exports.updatePatientSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid patient ID'),
    }),
    body: zod_1.z.object({
        firstName: nameSchema.optional(),
        lastName: nameSchema.optional(),
        email: emailSchema,
        phone: phoneSchema,
        dateOfBirth: zod_1.z.string().refine((val) => {
            if (!val)
                return true;
            const date = new Date(val);
            return !isNaN(date.getTime()) && date <= new Date();
        }, { message: 'Invalid date of birth' }).optional().nullable(),
        gender: zod_1.z.nativeEnum(client_1.Gender).optional().nullable(),
        bloodGroup: zod_1.z.nativeEnum(client_1.BloodGroup).optional().nullable(),
        address: zod_1.z.string().max(200).optional().nullable(),
        city: zod_1.z.string().max(100).optional().nullable(),
        state: zod_1.z.string().max(100).optional().nullable(),
        country: zod_1.z.string().max(100).optional().nullable(),
        zipCode: zod_1.z.string().max(20).optional().nullable(),
        emergencyContactName: zod_1.z.string().max(100).optional().nullable(),
        emergencyContactPhone: phoneSchema,
        emergencyContactRelation: zod_1.z.string().max(50).optional().nullable(),
        insuranceProvider: zod_1.z.string().max(100).optional().nullable(),
        insurancePolicyNumber: zod_1.z.string().max(50).optional().nullable(),
        insuranceValidUntil: dateStringSchema,
        allergies: zod_1.z.array(zod_1.z.string().max(200)).optional(),
        chronicConditions: zod_1.z.array(zod_1.z.string().max(200)).optional(),
        currentMedications: zod_1.z.array(zod_1.z.string().max(200)).optional(),
        notes: zod_1.z.string().max(5000).optional().nullable(),
        status: zod_1.z.nativeEnum(client_1.PatientStatus).optional(),
        primaryDoctorId: zod_1.z.string().cuid().optional().nullable(),
    }).refine((data) => {
        // At least one field must be provided
        const fields = Object.keys(data);
        return fields.length > 0;
    }, { message: 'At least one field must be provided for update' }),
});
// Patient ID parameter validation
exports.patientIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid patient ID'),
    }),
});
// Patient query validation
exports.patientQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('10'),
        search: zod_1.z.string().max(200).optional(),
        gender: zod_1.z.nativeEnum(client_1.Gender).optional(),
        bloodGroup: zod_1.z.nativeEnum(client_1.BloodGroup).optional(),
        status: zod_1.z.nativeEnum(client_1.PatientStatus).optional(),
        organizationId: zod_1.z.string().cuid().optional(),
        branchId: zod_1.z.string().cuid().optional(),
        primaryDoctorId: zod_1.z.string().cuid().optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        sortBy: zod_1.z.enum([
            'firstName', 'lastName', 'createdAt', 'updatedAt',
            'dateOfBirth', 'totalVisits', 'lastVisitDate'
        ]).optional().default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
// Bulk import validation
exports.bulkImportSchema = zod_1.z.object({
    body: zod_1.z.object({
        patients: zod_1.z.array(exports.createPatientSchema.shape.body).min(1, 'At least one patient required').max(1000, 'Maximum 1000 patients per batch'),
        organizationId: zod_1.z.string().cuid('Invalid organization ID').optional(),
        branchId: zod_1.z.string().cuid('Invalid branch ID').optional(),
    }),
});
// Upload document validation
exports.uploadDocumentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid patient ID'),
    }),
    body: zod_1.z.object({
        documentType: zod_1.z.enum([
            'LAB_REPORT', 'PRESCRIPTION', 'INSURANCE_CARD', 'ID_PROOF',
            'MEDICAL_CERTIFICATE', 'DISCHARGE_SUMMARY', 'OTHER'
        ]),
        title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
        description: zod_1.z.string().max(1000).optional(),
    }),
});
//# sourceMappingURL=patientValidator.js.map