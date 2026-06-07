import { z } from 'zod';
export declare const createAppointmentSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        patientId: z.ZodString;
        doctorId: z.ZodString;
        branchId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        organizationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        appointmentDate: z.ZodEffects<z.ZodString, string, string>;
        startTime: z.ZodString;
        endTime: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        duration: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        type: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<{
            IN_PERSON: "IN_PERSON";
            TELEMEDICINE: "TELEMEDICINE";
            WALK_IN: "WALK_IN";
            EMERGENCY: "EMERGENCY";
            FOLLOW_UP: "FOLLOW_UP";
        }>>>;
        reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        symptoms: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        isFollowUp: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        followUpForId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        type: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP";
        patientId: string;
        doctorId: string;
        appointmentDate: string;
        startTime: string;
        duration: number;
        isFollowUp: boolean;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        reason?: string | null | undefined;
        notes?: string | null | undefined;
        endTime?: string | null | undefined;
        symptoms?: string | null | undefined;
        followUpForId?: string | null | undefined;
    }, {
        patientId: string;
        doctorId: string;
        appointmentDate: string;
        startTime: string;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        type?: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP" | undefined;
        reason?: string | null | undefined;
        notes?: string | null | undefined;
        endTime?: string | null | undefined;
        duration?: number | undefined;
        symptoms?: string | null | undefined;
        isFollowUp?: boolean | undefined;
        followUpForId?: string | null | undefined;
    }>, {
        type: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP";
        patientId: string;
        doctorId: string;
        appointmentDate: string;
        startTime: string;
        duration: number;
        isFollowUp: boolean;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        reason?: string | null | undefined;
        notes?: string | null | undefined;
        endTime?: string | null | undefined;
        symptoms?: string | null | undefined;
        followUpForId?: string | null | undefined;
    }, {
        patientId: string;
        doctorId: string;
        appointmentDate: string;
        startTime: string;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        type?: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP" | undefined;
        reason?: string | null | undefined;
        notes?: string | null | undefined;
        endTime?: string | null | undefined;
        duration?: number | undefined;
        symptoms?: string | null | undefined;
        isFollowUp?: boolean | undefined;
        followUpForId?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        type: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP";
        patientId: string;
        doctorId: string;
        appointmentDate: string;
        startTime: string;
        duration: number;
        isFollowUp: boolean;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        reason?: string | null | undefined;
        notes?: string | null | undefined;
        endTime?: string | null | undefined;
        symptoms?: string | null | undefined;
        followUpForId?: string | null | undefined;
    };
}, {
    body: {
        patientId: string;
        doctorId: string;
        appointmentDate: string;
        startTime: string;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        type?: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP" | undefined;
        reason?: string | null | undefined;
        notes?: string | null | undefined;
        endTime?: string | null | undefined;
        duration?: number | undefined;
        symptoms?: string | null | undefined;
        isFollowUp?: boolean | undefined;
        followUpForId?: string | null | undefined;
    };
}>;
export declare const updateAppointmentSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        appointmentDate: z.ZodOptional<z.ZodString>;
        startTime: z.ZodOptional<z.ZodString>;
        endTime: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodNativeEnum<{
            IN_PERSON: "IN_PERSON";
            TELEMEDICINE: "TELEMEDICINE";
            WALK_IN: "WALK_IN";
            EMERGENCY: "EMERGENCY";
            FOLLOW_UP: "FOLLOW_UP";
        }>>;
        status: z.ZodOptional<z.ZodNativeEnum<{
            SCHEDULED: "SCHEDULED";
            CONFIRMED: "CONFIRMED";
            IN_PROGRESS: "IN_PROGRESS";
            COMPLETED: "COMPLETED";
            CANCELLED: "CANCELLED";
            NO_SHOW: "NO_SHOW";
            RESCHEDULED: "RESCHEDULED";
        }>>;
        reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        symptoms: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        status?: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED" | undefined;
        type?: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP" | undefined;
        reason?: string | null | undefined;
        notes?: string | null | undefined;
        appointmentDate?: string | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
        symptoms?: string | null | undefined;
    }, {
        status?: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED" | undefined;
        type?: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP" | undefined;
        reason?: string | null | undefined;
        notes?: string | null | undefined;
        appointmentDate?: string | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
        symptoms?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        status?: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED" | undefined;
        type?: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP" | undefined;
        reason?: string | null | undefined;
        notes?: string | null | undefined;
        appointmentDate?: string | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
        symptoms?: string | null | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        status?: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED" | undefined;
        type?: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP" | undefined;
        reason?: string | null | undefined;
        notes?: string | null | undefined;
        appointmentDate?: string | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
        symptoms?: string | null | undefined;
    };
}>;
export declare const rescheduleAppointmentSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        appointmentDate: z.ZodEffects<z.ZodString, string, string>;
        startTime: z.ZodString;
        endTime: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        appointmentDate: string;
        startTime: string;
        reason?: string | null | undefined;
        endTime?: string | null | undefined;
    }, {
        appointmentDate: string;
        startTime: string;
        reason?: string | null | undefined;
        endTime?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        appointmentDate: string;
        startTime: string;
        reason?: string | null | undefined;
        endTime?: string | null | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        appointmentDate: string;
        startTime: string;
        reason?: string | null | undefined;
        endTime?: string | null | undefined;
    };
}>;
export declare const cancelAppointmentSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        reason?: string | null | undefined;
    }, {
        reason?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        reason?: string | null | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        reason?: string | null | undefined;
    };
}>;
export declare const appointmentIdSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
}, {
    params: {
        id: string;
    };
}>;
export declare const appointmentQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        patientId: z.ZodOptional<z.ZodString>;
        doctorId: z.ZodOptional<z.ZodString>;
        branchId: z.ZodOptional<z.ZodString>;
        organizationId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodNativeEnum<{
            SCHEDULED: "SCHEDULED";
            CONFIRMED: "CONFIRMED";
            IN_PROGRESS: "IN_PROGRESS";
            COMPLETED: "COMPLETED";
            CANCELLED: "CANCELLED";
            NO_SHOW: "NO_SHOW";
            RESCHEDULED: "RESCHEDULED";
        }>>;
        type: z.ZodOptional<z.ZodNativeEnum<{
            IN_PERSON: "IN_PERSON";
            TELEMEDICINE: "TELEMEDICINE";
            WALK_IN: "WALK_IN";
            EMERGENCY: "EMERGENCY";
            FOLLOW_UP: "FOLLOW_UP";
        }>>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        search: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["appointmentDate", "startTime", "createdAt", "status", "type"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortBy: "status" | "createdAt" | "type" | "appointmentDate" | "startTime";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        status?: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        type?: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        doctorId?: string | undefined;
    }, {
        search?: string | undefined;
        status?: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        type?: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "status" | "createdAt" | "type" | "appointmentDate" | "startTime" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        patientId?: string | undefined;
        doctorId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortBy: "status" | "createdAt" | "type" | "appointmentDate" | "startTime";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        status?: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        type?: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        doctorId?: string | undefined;
    };
}, {
    query: {
        search?: string | undefined;
        status?: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        type?: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "status" | "createdAt" | "type" | "appointmentDate" | "startTime" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        patientId?: string | undefined;
        doctorId?: string | undefined;
    };
}>;
export declare const queueTokenSchema: z.ZodObject<{
    body: z.ZodObject<{
        patientId: z.ZodString;
        doctorId: z.ZodString;
        branchId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        appointmentType: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<{
            IN_PERSON: "IN_PERSON";
            TELEMEDICINE: "TELEMEDICINE";
            WALK_IN: "WALK_IN";
            EMERGENCY: "EMERGENCY";
            FOLLOW_UP: "FOLLOW_UP";
        }>>>;
        reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        patientId: string;
        doctorId: string;
        appointmentType: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP";
        branchId?: string | null | undefined;
        reason?: string | null | undefined;
    }, {
        patientId: string;
        doctorId: string;
        branchId?: string | null | undefined;
        reason?: string | null | undefined;
        appointmentType?: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        patientId: string;
        doctorId: string;
        appointmentType: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP";
        branchId?: string | null | undefined;
        reason?: string | null | undefined;
    };
}, {
    body: {
        patientId: string;
        doctorId: string;
        branchId?: string | null | undefined;
        reason?: string | null | undefined;
        appointmentType?: "IN_PERSON" | "TELEMEDICINE" | "WALK_IN" | "EMERGENCY" | "FOLLOW_UP" | undefined;
    };
}>;
export declare const availabilityQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        doctorId: z.ZodString;
        date: z.ZodString;
        branchId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        date: string;
        doctorId: string;
        branchId?: string | undefined;
    }, {
        date: string;
        doctorId: string;
        branchId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        date: string;
        doctorId: string;
        branchId?: string | undefined;
    };
}, {
    query: {
        date: string;
        doctorId: string;
        branchId?: string | undefined;
    };
}>;
export declare const bulkStatusUpdateSchema: z.ZodObject<{
    body: z.ZodObject<{
        appointmentIds: z.ZodArray<z.ZodString, "many">;
        status: z.ZodNativeEnum<{
            SCHEDULED: "SCHEDULED";
            CONFIRMED: "CONFIRMED";
            IN_PROGRESS: "IN_PROGRESS";
            COMPLETED: "COMPLETED";
            CANCELLED: "CANCELLED";
            NO_SHOW: "NO_SHOW";
            RESCHEDULED: "RESCHEDULED";
        }>;
        reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";
        appointmentIds: string[];
        reason?: string | null | undefined;
    }, {
        status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";
        appointmentIds: string[];
        reason?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";
        appointmentIds: string[];
        reason?: string | null | undefined;
    };
}, {
    body: {
        status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";
        appointmentIds: string[];
        reason?: string | null | undefined;
    };
}>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>['body'];
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>['body'];
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>['body'];
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>['body'];
export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>['query'];
export type QueueTokenInput = z.infer<typeof queueTokenSchema>['body'];
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>['query'];
export type BulkStatusUpdateInput = z.infer<typeof bulkStatusUpdateSchema>['body'];
//# sourceMappingURL=appointmentValidator.d.ts.map