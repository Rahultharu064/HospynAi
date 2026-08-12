import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

const dayScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6, 'Day must be between 0 (Sunday) and 6 (Saturday)'),
  startTime: z.string().regex(timeRegex, 'Time must be in HH:mm format'),
  endTime: z.string().regex(timeRegex, 'Time must be in HH:mm format'),
  slotDuration: z.number().min(5).max(60).optional().default(15),
  isActive: z.boolean().optional().default(true),
  breakStart: z.string().regex(timeRegex).optional().nullable(),
  breakEnd: z.string().regex(timeRegex).optional().nullable(),
}).refine((data) => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const createDoctorSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email').transform((v) => v.toLowerCase().trim()),
    password: passwordSchema,
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
    phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone format').optional().nullable(),
    
    specialization: z.string().max(100).optional().nullable(),
    subSpecialization: z.string().max(100).optional().nullable(),
    qualification: z.string().max(200).optional().nullable(),
    experience: z.number().min(0).max(60).optional().nullable(),
    licenseNumber: z.string().max(50).optional().nullable(),
    licenseExpiry: z.string().datetime().optional().nullable(),
    biography: z.string().max(5000).optional().nullable(),
    
    consultationFee: z.number().min(0).max(10000).optional().nullable(),
    telemedicineFee: z.number().min(0).max(10000).optional().nullable(),
    followUpFee: z.number().min(0).max(10000).optional().nullable(),
    maxPatientsPerDay: z.number().min(1).max(100).optional().default(20),
    availableForTelemed: z.boolean().optional().default(false),
    timezone: z.string().optional().default('UTC'),
    
    organizationId: z.string().cuid('Invalid organization ID').optional().nullable(),
    branchId: z.string().cuid('Invalid branch ID').optional().nullable(),
    
    schedule: z.object({
      days: z.array(dayScheduleSchema).min(1, 'At least one day schedule is required').max(7, 'Maximum 7 days'),
    }).optional(),
  }),
});

export const updateDoctorSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid doctor ID'),
  }),
  body: z.object({
    firstName: z.string().min(2).max(50).optional(),
    lastName: z.string().min(2).max(50).optional(),
    phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone format').optional().nullable(),
    
    specialization: z.string().max(100).optional().nullable(),
    subSpecialization: z.string().max(100).optional().nullable(),
    qualification: z.string().max(200).optional().nullable(),
    experience: z.number().min(0).max(60).optional().nullable(),
    licenseNumber: z.string().max(50).optional().nullable(),
    licenseExpiry: z.string().datetime().optional().nullable(),
    biography: z.string().max(5000).optional().nullable(),
    
    consultationFee: z.number().min(0).max(10000).optional().nullable(),
    telemedicineFee: z.number().min(0).max(10000).optional().nullable(),
    followUpFee: z.number().min(0).max(10000).optional().nullable(),
    maxPatientsPerDay: z.number().min(1).max(100).optional(),
    availableForTelemed: z.boolean().optional(),
    timezone: z.string().optional(),
    
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  }),
});

export const updateScheduleSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid doctor ID'),
  }),
  body: z.object({
    days: z.array(dayScheduleSchema).min(1).max(7),
  }),
});

export const doctorIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid doctor ID'),
  }),
});

export const doctorQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('10'),
    search: z.string().max(200).optional(),
    specialization: z.string().optional(),
    organizationId: z.string().cuid().optional(),
    branchId: z.string().cuid().optional(),
    availableForTelemed: z.string().transform((v) => v === 'true').optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    sortBy: z.enum(['firstName', 'lastName', 'specialization', 'experience', 'createdAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const availabilityQuerySchema = z.object({
  query: z.object({
    doctorId: z.string().cuid('Invalid doctor ID'),
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  }),
});

// Type exports
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>['body'];
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>['body'];
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>['body'];
export type DoctorQueryInput = z.infer<typeof doctorQuerySchema>['query'];