import { z } from 'zod';
import { AppointmentStatus, AppointmentType } from '@prisma/client';

// Time validation regex (HH:mm format)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Date validation (YYYY-MM-DD format)
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string({
      required_error: 'Patient ID is required',
    }).cuid('Invalid patient ID'),

    doctorId: z.string({
      required_error: 'Doctor ID is required',
    }).cuid('Invalid doctor ID'),

    branchId: z.string().cuid('Invalid branch ID').optional().nullable(),
    organizationId: z.string().cuid('Invalid organization ID').optional().nullable(),

    appointmentDate: z.string({
      required_error: 'Appointment date is required',
    }).regex(dateRegex, 'Date must be in YYYY-MM-DD format')
      .refine((date) => {
        const appointmentDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return appointmentDate >= today;
      }, 'Appointment date cannot be in the past'),

    startTime: z.string({
      required_error: 'Start time is required',
    }).regex(timeRegex, 'Time must be in HH:mm format'),

    endTime: z.string().regex(timeRegex, 'Time must be in HH:mm format').optional().nullable(),

    duration: z.number().min(5, 'Minimum duration is 5 minutes')
      .max(120, 'Maximum duration is 120 minutes')
      .optional()
      .default(15),

    type: z.nativeEnum(AppointmentType).optional().default(AppointmentType.IN_PERSON),

    reason: z.string().max(500, 'Reason must be less than 500 characters').optional().nullable(),
    symptoms: z.string().max(1000, 'Symptoms must be less than 1000 characters').optional().nullable(),
    notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional().nullable(),

    isFollowUp: z.boolean().optional().default(false),
    followUpForId: z.string().cuid('Invalid appointment ID').optional().nullable(),
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

export const updateAppointmentSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid appointment ID'),
  }),
  body: z.object({
    appointmentDate: z.string().regex(dateRegex, 'Invalid date format').optional(),
    startTime: z.string().regex(timeRegex, 'Invalid time format').optional(),
    endTime: z.string().regex(timeRegex, 'Invalid time format').optional(),
    type: z.nativeEnum(AppointmentType).optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
    reason: z.string().max(500).optional().nullable(),
    symptoms: z.string().max(1000).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  }),
});

export const rescheduleAppointmentSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid appointment ID'),
  }),
  body: z.object({
    appointmentDate: z.string({
      required_error: 'New date is required',
    }).regex(dateRegex, 'Date must be in YYYY-MM-DD format')
      .refine((date) => {
        const appointmentDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return appointmentDate >= today;
      }, 'New date cannot be in the past'),

    startTime: z.string({
      required_error: 'New time is required',
    }).regex(timeRegex, 'Time must be in HH:mm format'),

    endTime: z.string().regex(timeRegex, 'Invalid time format').optional().nullable(),
    reason: z.string().max(500, 'Reason must be less than 500 characters').optional().nullable(),
  }),
});

export const cancelAppointmentSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid appointment ID'),
  }),
  body: z.object({
    reason: z.string().max(500, 'Reason must be less than 500 characters').optional().nullable(),
  }),
});

export const appointmentIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid appointment ID'),
  }),
});

export const appointmentQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('10'),
    patientId: z.string().cuid().optional(),
    doctorId: z.string().cuid().optional(),
    branchId: z.string().cuid().optional(),
    organizationId: z.string().cuid().optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
    type: z.nativeEnum(AppointmentType).optional(),
    dateFrom: z.string().regex(dateRegex).optional(),
    dateTo: z.string().regex(dateRegex).optional(),
    search: z.string().max(200).optional(),
    sortBy: z.enum([
      'appointmentDate', 'startTime', 'createdAt', 'status', 'type'
    ]).optional().default('appointmentDate'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});

export const queueTokenSchema = z.object({
  body: z.object({
    patientId: z.string({
      required_error: 'Patient ID is required',
    }).cuid('Invalid patient ID'),
    doctorId: z.string({
      required_error: 'Doctor ID is required',
    }).cuid('Invalid doctor ID'),
    branchId: z.string().cuid('Invalid branch ID').optional().nullable(),
    appointmentType: z.nativeEnum(AppointmentType).optional().default(AppointmentType.WALK_IN),
    reason: z.string().max(500, 'Reason must be less than 500 characters').optional().nullable(),
  }),
});

export const availabilityQuerySchema = z.object({
  query: z.object({
    doctorId: z.string().cuid('Invalid doctor ID'),
    date: z.string().regex(dateRegex, 'Invalid date format'),
    branchId: z.string().cuid('Invalid branch ID').optional(),
  }),
});

export const bulkStatusUpdateSchema = z.object({
  body: z.object({
    appointmentIds: z.array(z.string().cuid()).min(1, 'At least one appointment required').max(100, 'Maximum 100 appointments'),
    status: z.nativeEnum(AppointmentStatus),
    reason: z.string().max(500).optional().nullable(),
  }),
});

// Type exports
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>['body'];
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>['body'];
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>['body'];
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>['body'];
export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>['query'];
export type QueueTokenInput = z.infer<typeof queueTokenSchema>['body'];
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>['query'];
export type BulkStatusUpdateInput = z.infer<typeof bulkStatusUpdateSchema>['body'];