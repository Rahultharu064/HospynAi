"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkStatusUpdateSchema = exports.availabilityQuerySchema = exports.queueTokenSchema = exports.appointmentQuerySchema = exports.appointmentIdSchema = exports.cancelAppointmentSchema = exports.rescheduleAppointmentSchema = exports.updateAppointmentSchema = exports.createAppointmentSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Time validation regex (HH:mm format)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
// Date validation (YYYY-MM-DD format)
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
exports.createAppointmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string({
            required_error: 'Patient ID is required',
        }).cuid('Invalid patient ID'),
        doctorId: zod_1.z.string({
            required_error: 'Doctor ID is required',
        }).cuid('Invalid doctor ID'),
        branchId: zod_1.z.string().cuid('Invalid branch ID').optional().nullable(),
        organizationId: zod_1.z.string().cuid('Invalid organization ID').optional().nullable(),
        appointmentDate: zod_1.z.string({
            required_error: 'Appointment date is required',
        }).regex(dateRegex, 'Date must be in YYYY-MM-DD format')
            .refine((date) => {
            const appointmentDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return appointmentDate >= today;
        }, 'Appointment date cannot be in the past'),
        startTime: zod_1.z.string({
            required_error: 'Start time is required',
        }).regex(timeRegex, 'Time must be in HH:mm format'),
        endTime: zod_1.z.string().regex(timeRegex, 'Time must be in HH:mm format').optional().nullable(),
        duration: zod_1.z.number().min(5, 'Minimum duration is 5 minutes')
            .max(120, 'Maximum duration is 120 minutes')
            .optional()
            .default(15),
        type: zod_1.z.nativeEnum(client_1.AppointmentType).optional().default(client_1.AppointmentType.IN_PERSON),
        reason: zod_1.z.string().max(500, 'Reason must be less than 500 characters').optional().nullable(),
        symptoms: zod_1.z.string().max(1000, 'Symptoms must be less than 1000 characters').optional().nullable(),
        notes: zod_1.z.string().max(2000, 'Notes must be less than 2000 characters').optional().nullable(),
        isFollowUp: zod_1.z.boolean().optional().default(false),
        followUpForId: zod_1.z.string().cuid('Invalid appointment ID').optional().nullable(),
    }).refine((data) => {
        // If endTime is provided, it must be after startTime
        if (data.endTime) {
            return data.endTime > data.startTime;
        }
        return true;
    }, {
        message: 'End time must be after start time',
        path: ['endTime'],
    }),
});
exports.updateAppointmentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid appointment ID'),
    }),
    body: zod_1.z.object({
        appointmentDate: zod_1.z.string().regex(dateRegex, 'Invalid date format').optional(),
        startTime: zod_1.z.string().regex(timeRegex, 'Invalid time format').optional(),
        endTime: zod_1.z.string().regex(timeRegex, 'Invalid time format').optional(),
        type: zod_1.z.nativeEnum(client_1.AppointmentType).optional(),
        status: zod_1.z.nativeEnum(client_1.AppointmentStatus).optional(),
        reason: zod_1.z.string().max(500).optional().nullable(),
        symptoms: zod_1.z.string().max(1000).optional().nullable(),
        notes: zod_1.z.string().max(2000).optional().nullable(),
    }),
});
exports.rescheduleAppointmentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid appointment ID'),
    }),
    body: zod_1.z.object({
        appointmentDate: zod_1.z.string({
            required_error: 'New date is required',
        }).regex(dateRegex, 'Date must be in YYYY-MM-DD format')
            .refine((date) => {
            const appointmentDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return appointmentDate >= today;
        }, 'New date cannot be in the past'),
        startTime: zod_1.z.string({
            required_error: 'New time is required',
        }).regex(timeRegex, 'Time must be in HH:mm format'),
        endTime: zod_1.z.string().regex(timeRegex, 'Invalid time format').optional().nullable(),
        reason: zod_1.z.string().max(500, 'Reason must be less than 500 characters').optional().nullable(),
    }),
});
exports.cancelAppointmentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid appointment ID'),
    }),
    body: zod_1.z.object({
        reason: zod_1.z.string().max(500, 'Reason must be less than 500 characters').optional().nullable(),
    }),
});
exports.appointmentIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid appointment ID'),
    }),
});
exports.appointmentQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('10'),
        patientId: zod_1.z.string().cuid().optional(),
        doctorId: zod_1.z.string().cuid().optional(),
        branchId: zod_1.z.string().cuid().optional(),
        organizationId: zod_1.z.string().cuid().optional(),
        status: zod_1.z.nativeEnum(client_1.AppointmentStatus).optional(),
        type: zod_1.z.nativeEnum(client_1.AppointmentType).optional(),
        dateFrom: zod_1.z.string().regex(dateRegex).optional(),
        dateTo: zod_1.z.string().regex(dateRegex).optional(),
        search: zod_1.z.string().max(200).optional(),
        sortBy: zod_1.z.enum([
            'appointmentDate', 'startTime', 'createdAt', 'status', 'type'
        ]).optional().default('appointmentDate'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
    }),
});
exports.queueTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string({
            required_error: 'Patient ID is required',
        }).cuid('Invalid patient ID'),
        doctorId: zod_1.z.string({
            required_error: 'Doctor ID is required',
        }).cuid('Invalid doctor ID'),
        branchId: zod_1.z.string().cuid('Invalid branch ID').optional().nullable(),
        appointmentType: zod_1.z.nativeEnum(client_1.AppointmentType).optional().default(client_1.AppointmentType.WALK_IN),
        reason: zod_1.z.string().max(500, 'Reason must be less than 500 characters').optional().nullable(),
    }),
});
exports.availabilityQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        doctorId: zod_1.z.string().cuid('Invalid doctor ID'),
        date: zod_1.z.string().regex(dateRegex, 'Invalid date format'),
        branchId: zod_1.z.string().cuid('Invalid branch ID').optional(),
    }),
});
exports.bulkStatusUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        appointmentIds: zod_1.z.array(zod_1.z.string().cuid()).min(1, 'At least one appointment required').max(100, 'Maximum 100 appointments'),
        status: zod_1.z.nativeEnum(client_1.AppointmentStatus),
        reason: zod_1.z.string().max(500).optional().nullable(),
    }),
});
//# sourceMappingURL=appointmentValidator.js.map