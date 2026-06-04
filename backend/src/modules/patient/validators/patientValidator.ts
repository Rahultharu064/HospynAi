import { z } from 'zod';
import { PatientStatus, BloodGroup, Gender } from '@prisma/client';

// Custom date validation
const dateStringSchema = z.string().refine(
  (val) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  },
  { message: 'Invalid date format' }
).optional().nullable();

// Name validation
const nameSchema = z.string()
  .min(2, 'Must be at least 2 characters')
  .max(50, 'Must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Can only contain letters, spaces, hyphens, and apostrophes')
  .transform((val) => val.trim());

// Phone validation
const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{6,14}$/, 'Phone number must be in international format (e.g., +1234567890)')
  .optional()
  .nullable();

// Email validation
const emailSchema = z.string()
  .email('Invalid email address')
  .optional()
  .nullable()
  .transform((val) => val ? val.toLowerCase().trim() : val);

// Create patient validation
export const createPatientSchema = z.object({
  body: z.object({
    firstName: z.string({
      required_error: 'First name is required',
    }).min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be less than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
      .transform((val) => val.trim()),

    lastName: z.string({
      required_error: 'Last name is required',
    }).min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
      .transform((val) => val.trim()),

    email: emailSchema,
    phone: phoneSchema,

    dateOfBirth: z.string().refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        if (isNaN(date.getTime())) return false;
        if (date > new Date()) return false; // Can't be future date
        return true;
      },
      { message: 'Invalid date of birth. Must be a valid past date.' }
    ).optional().nullable(),

    gender: z.nativeEnum(Gender).optional().nullable(),
    bloodGroup: z.nativeEnum(BloodGroup).optional().nullable(),

    // Address fields
    address: z.string().max(200, 'Address must be less than 200 characters').optional().nullable(),
    city: z.string().max(100, 'City must be less than 100 characters').optional().nullable(),
    state: z.string().max(100, 'State must be less than 100 characters').optional().nullable(),
    country: z.string().max(100, 'Country must be less than 100 characters').optional().nullable(),
    zipCode: z.string().max(20, 'Zip code must be less than 20 characters').optional().nullable(),

    // Emergency contact
    emergencyContactName: z.string().max(100).optional().nullable(),
    emergencyContactPhone: phoneSchema,
    emergencyContactRelation: z.string().max(50).optional().nullable(),

    // Insurance
    insuranceProvider: z.string().max(100).optional().nullable(),
    insurancePolicyNumber: z.string().max(50).optional().nullable(),
    insuranceValidUntil: dateStringSchema,

    // Medical information
    allergies: z.array(z.string().max(200)).optional().default([]),
    chronicConditions: z.array(z.string().max(200)).optional().default([]),
    currentMedications: z.array(z.string().max(200)).optional().default([]),

    notes: z.string().max(5000, 'Notes must be less than 5000 characters').optional().nullable(),

    // Organization
    organizationId: z.string().cuid('Invalid organization ID').optional().nullable(),
    branchId: z.string().cuid('Invalid branch ID').optional().nullable(),
    primaryDoctorId: z.string().cuid('Invalid doctor ID').optional().nullable(),
  }),
});

// Update patient validation
export const updatePatientSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid patient ID'),
  }),
  body: z.object({
    firstName: nameSchema.optional(),
    lastName: nameSchema.optional(),
    email: emailSchema,
    phone: phoneSchema,
    dateOfBirth: z.string().refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date <= new Date();
      },
      { message: 'Invalid date of birth' }
    ).optional().nullable(),
    gender: z.nativeEnum(Gender).optional().nullable(),
    bloodGroup: z.nativeEnum(BloodGroup).optional().nullable(),
    
    address: z.string().max(200).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    state: z.string().max(100).optional().nullable(),
    country: z.string().max(100).optional().nullable(),
    zipCode: z.string().max(20).optional().nullable(),
    
    emergencyContactName: z.string().max(100).optional().nullable(),
    emergencyContactPhone: phoneSchema,
    emergencyContactRelation: z.string().max(50).optional().nullable(),
    
    insuranceProvider: z.string().max(100).optional().nullable(),
    insurancePolicyNumber: z.string().max(50).optional().nullable(),
    insuranceValidUntil: dateStringSchema,
    
    allergies: z.array(z.string().max(200)).optional(),
    chronicConditions: z.array(z.string().max(200)).optional(),
    currentMedications: z.array(z.string().max(200)).optional(),
    
    notes: z.string().max(5000).optional().nullable(),
    status: z.nativeEnum(PatientStatus).optional(),
    primaryDoctorId: z.string().cuid().optional().nullable(),
  }).refine((data) => {
    // At least one field must be provided
    const fields = Object.keys(data);
    return fields.length > 0;
  }, { message: 'At least one field must be provided for update' }),
});

// Patient ID parameter validation
export const patientIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid patient ID'),
  }),
});

// Patient query validation
export const patientQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('10'),
    search: z.string().max(200).optional(),
    gender: z.nativeEnum(Gender).optional(),
    bloodGroup: z.nativeEnum(BloodGroup).optional(),
    status: z.nativeEnum(PatientStatus).optional(),
    organizationId: z.string().cuid().optional(),
    branchId: z.string().cuid().optional(),
    primaryDoctorId: z.string().cuid().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    sortBy: z.enum([
      'firstName', 'lastName', 'createdAt', 'updatedAt', 
      'dateOfBirth', 'totalVisits', 'lastVisitDate'
    ]).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

// Bulk import validation
export const bulkImportSchema = z.object({
  body: z.object({
    patients: z.array(createPatientSchema.shape.body).min(1, 'At least one patient required').max(1000, 'Maximum 1000 patients per batch'),
    organizationId: z.string().cuid('Invalid organization ID').optional(),
    branchId: z.string().cuid('Invalid branch ID').optional(),
  }),
});

// Upload document validation
export const uploadDocumentSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid patient ID'),
  }),
  body: z.object({
    documentType: z.enum([
      'LAB_REPORT', 'PRESCRIPTION', 'INSURANCE_CARD', 'ID_PROOF',
      'MEDICAL_CERTIFICATE', 'DISCHARGE_SUMMARY', 'OTHER'
    ]),
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    description: z.string().max(1000).optional(),
  }),
});

// Type exports
export type CreatePatientInput = z.infer<typeof createPatientSchema>['body'];
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>['body'];
export type PatientQueryInput = z.infer<typeof patientQuerySchema>['query'];
export type BulkImportInput = z.infer<typeof bulkImportSchema>['body'];
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>['body'];