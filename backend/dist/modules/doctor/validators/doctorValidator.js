"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availabilityQuerySchema = exports.doctorQuerySchema = exports.doctorIdSchema = exports.updateScheduleSchema = exports.updateDoctorSchema = exports.createDoctorSchema = void 0;
const zod_1 = require("zod");
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const passwordSchema = zod_1.z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');
const dayScheduleSchema = zod_1.z.object({
    dayOfWeek: zod_1.z.number().min(0).max(6, 'Day must be between 0 (Sunday) and 6 (Saturday)'),
    startTime: zod_1.z.string().regex(timeRegex, 'Time must be in HH:mm format'),
    endTime: zod_1.z.string().regex(timeRegex, 'Time must be in HH:mm format'),
    slotDuration: zod_1.z.number().min(5).max(60).optional().default(15),
    isActive: zod_1.z.boolean().optional().default(true),
    breakStart: zod_1.z.string().regex(timeRegex).optional().nullable(),
    breakEnd: zod_1.z.string().regex(timeRegex).optional().nullable(),
}).refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
});
exports.createDoctorSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email').transform((v) => v.toLowerCase().trim()),
        password: passwordSchema,
        firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters').max(50),
        lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters').max(50),
        phone: zod_1.z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone format').optional().nullable(),
        specialization: zod_1.z.string().max(100).optional().nullable(),
        subSpecialization: zod_1.z.string().max(100).optional().nullable(),
        qualification: zod_1.z.string().max(200).optional().nullable(),
        experience: zod_1.z.number().min(0).max(60).optional().nullable(),
        licenseNumber: zod_1.z.string().max(50).optional().nullable(),
        licenseExpiry: zod_1.z.string().datetime().optional().nullable(),
        biography: zod_1.z.string().max(5000).optional().nullable(),
        consultationFee: zod_1.z.number().min(0).max(10000).optional().nullable(),
        telemedicineFee: zod_1.z.number().min(0).max(10000).optional().nullable(),
        followUpFee: zod_1.z.number().min(0).max(10000).optional().nullable(),
        maxPatientsPerDay: zod_1.z.number().min(1).max(100).optional().default(20),
        availableForTelemed: zod_1.z.boolean().optional().default(false),
        timezone: zod_1.z.string().optional().default('UTC'),
        organizationId: zod_1.z.string().cuid('Invalid organization ID').optional().nullable(),
        branchId: zod_1.z.string().cuid('Invalid branch ID').optional().nullable(),
        schedule: zod_1.z.object({
            days: zod_1.z.array(dayScheduleSchema).min(1, 'At least one day schedule is required').max(7, 'Maximum 7 days'),
        }).optional(),
    }),
});
exports.updateDoctorSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid doctor ID'),
    }),
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(2).max(50).optional(),
        lastName: zod_1.z.string().min(2).max(50).optional(),
        phone: zod_1.z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone format').optional().nullable(),
        specialization: zod_1.z.string().max(100).optional().nullable(),
        subSpecialization: zod_1.z.string().max(100).optional().nullable(),
        qualification: zod_1.z.string().max(200).optional().nullable(),
        experience: zod_1.z.number().min(0).max(60).optional().nullable(),
        licenseNumber: zod_1.z.string().max(50).optional().nullable(),
        licenseExpiry: zod_1.z.string().datetime().optional().nullable(),
        biography: zod_1.z.string().max(5000).optional().nullable(),
        consultationFee: zod_1.z.number().min(0).max(10000).optional().nullable(),
        telemedicineFee: zod_1.z.number().min(0).max(10000).optional().nullable(),
        followUpFee: zod_1.z.number().min(0).max(10000).optional().nullable(),
        maxPatientsPerDay: zod_1.z.number().min(1).max(100).optional(),
        availableForTelemed: zod_1.z.boolean().optional(),
        timezone: zod_1.z.string().optional(),
        status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    }),
});
exports.updateScheduleSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid doctor ID'),
    }),
    body: zod_1.z.object({
        days: zod_1.z.array(dayScheduleSchema).min(1).max(7),
    }),
});
exports.doctorIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid doctor ID'),
    }),
});
exports.doctorQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('10'),
        search: zod_1.z.string().max(200).optional(),
        specialization: zod_1.z.string().optional(),
        organizationId: zod_1.z.string().cuid().optional(),
        branchId: zod_1.z.string().cuid().optional(),
        availableForTelemed: zod_1.z.string().transform((v) => v === 'true').optional(),
        status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
        sortBy: zod_1.z.enum(['firstName', 'lastName', 'specialization', 'experience', 'createdAt']).optional().default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
exports.availabilityQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        doctorId: zod_1.z.string().cuid('Invalid doctor ID'),
        dateFrom: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
        dateTo: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    }),
});
//# sourceMappingURL=doctorValidator.js.map