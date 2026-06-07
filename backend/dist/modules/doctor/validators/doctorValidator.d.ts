import { z } from 'zod';
export declare const createDoctorSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodEffects<z.ZodString, string, string>;
        password: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        specialization: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        subSpecialization: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        qualification: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        experience: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        licenseNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        licenseExpiry: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        biography: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        consultationFee: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        telemedicineFee: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        followUpFee: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        maxPatientsPerDay: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        availableForTelemed: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        timezone: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        organizationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        branchId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        schedule: z.ZodOptional<z.ZodObject<{
            days: z.ZodArray<z.ZodEffects<z.ZodObject<{
                dayOfWeek: z.ZodNumber;
                startTime: z.ZodString;
                endTime: z.ZodString;
                slotDuration: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
                isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
                breakStart: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                breakEnd: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                startTime: string;
                endTime: string;
                dayOfWeek: number;
                slotDuration: number;
                isActive: boolean;
                breakStart?: string | null | undefined;
                breakEnd?: string | null | undefined;
            }, {
                startTime: string;
                endTime: string;
                dayOfWeek: number;
                slotDuration?: number | undefined;
                isActive?: boolean | undefined;
                breakStart?: string | null | undefined;
                breakEnd?: string | null | undefined;
            }>, {
                startTime: string;
                endTime: string;
                dayOfWeek: number;
                slotDuration: number;
                isActive: boolean;
                breakStart?: string | null | undefined;
                breakEnd?: string | null | undefined;
            }, {
                startTime: string;
                endTime: string;
                dayOfWeek: number;
                slotDuration?: number | undefined;
                isActive?: boolean | undefined;
                breakStart?: string | null | undefined;
                breakEnd?: string | null | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            days: {
                startTime: string;
                endTime: string;
                dayOfWeek: number;
                slotDuration: number;
                isActive: boolean;
                breakStart?: string | null | undefined;
                breakEnd?: string | null | undefined;
            }[];
        }, {
            days: {
                startTime: string;
                endTime: string;
                dayOfWeek: number;
                slotDuration?: number | undefined;
                isActive?: boolean | undefined;
                breakStart?: string | null | undefined;
                breakEnd?: string | null | undefined;
            }[];
        }>>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
        maxPatientsPerDay: number;
        availableForTelemed: boolean;
        timezone: string;
        phone?: string | null | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        specialization?: string | null | undefined;
        subSpecialization?: string | null | undefined;
        qualification?: string | null | undefined;
        experience?: number | null | undefined;
        licenseNumber?: string | null | undefined;
        licenseExpiry?: string | null | undefined;
        biography?: string | null | undefined;
        consultationFee?: number | null | undefined;
        telemedicineFee?: number | null | undefined;
        followUpFee?: number | null | undefined;
        schedule?: {
            days: {
                startTime: string;
                endTime: string;
                dayOfWeek: number;
                slotDuration: number;
                isActive: boolean;
                breakStart?: string | null | undefined;
                breakEnd?: string | null | undefined;
            }[];
        } | undefined;
    }, {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
        phone?: string | null | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        specialization?: string | null | undefined;
        subSpecialization?: string | null | undefined;
        qualification?: string | null | undefined;
        experience?: number | null | undefined;
        licenseNumber?: string | null | undefined;
        licenseExpiry?: string | null | undefined;
        biography?: string | null | undefined;
        consultationFee?: number | null | undefined;
        telemedicineFee?: number | null | undefined;
        followUpFee?: number | null | undefined;
        maxPatientsPerDay?: number | undefined;
        availableForTelemed?: boolean | undefined;
        timezone?: string | undefined;
        schedule?: {
            days: {
                startTime: string;
                endTime: string;
                dayOfWeek: number;
                slotDuration?: number | undefined;
                isActive?: boolean | undefined;
                breakStart?: string | null | undefined;
                breakEnd?: string | null | undefined;
            }[];
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
        maxPatientsPerDay: number;
        availableForTelemed: boolean;
        timezone: string;
        phone?: string | null | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        specialization?: string | null | undefined;
        subSpecialization?: string | null | undefined;
        qualification?: string | null | undefined;
        experience?: number | null | undefined;
        licenseNumber?: string | null | undefined;
        licenseExpiry?: string | null | undefined;
        biography?: string | null | undefined;
        consultationFee?: number | null | undefined;
        telemedicineFee?: number | null | undefined;
        followUpFee?: number | null | undefined;
        schedule?: {
            days: {
                startTime: string;
                endTime: string;
                dayOfWeek: number;
                slotDuration: number;
                isActive: boolean;
                breakStart?: string | null | undefined;
                breakEnd?: string | null | undefined;
            }[];
        } | undefined;
    };
}, {
    body: {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
        phone?: string | null | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        specialization?: string | null | undefined;
        subSpecialization?: string | null | undefined;
        qualification?: string | null | undefined;
        experience?: number | null | undefined;
        licenseNumber?: string | null | undefined;
        licenseExpiry?: string | null | undefined;
        biography?: string | null | undefined;
        consultationFee?: number | null | undefined;
        telemedicineFee?: number | null | undefined;
        followUpFee?: number | null | undefined;
        maxPatientsPerDay?: number | undefined;
        availableForTelemed?: boolean | undefined;
        timezone?: string | undefined;
        schedule?: {
            days: {
                startTime: string;
                endTime: string;
                dayOfWeek: number;
                slotDuration?: number | undefined;
                isActive?: boolean | undefined;
                breakStart?: string | null | undefined;
                breakEnd?: string | null | undefined;
            }[];
        } | undefined;
    };
}>;
export declare const updateDoctorSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        specialization: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        subSpecialization: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        qualification: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        experience: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        licenseNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        licenseExpiry: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        biography: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        consultationFee: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        telemedicineFee: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        followUpFee: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        maxPatientsPerDay: z.ZodOptional<z.ZodNumber>;
        availableForTelemed: z.ZodOptional<z.ZodBoolean>;
        timezone: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "SUSPENDED"]>>;
    }, "strip", z.ZodTypeAny, {
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined;
        specialization?: string | null | undefined;
        subSpecialization?: string | null | undefined;
        qualification?: string | null | undefined;
        experience?: number | null | undefined;
        licenseNumber?: string | null | undefined;
        licenseExpiry?: string | null | undefined;
        biography?: string | null | undefined;
        consultationFee?: number | null | undefined;
        telemedicineFee?: number | null | undefined;
        followUpFee?: number | null | undefined;
        maxPatientsPerDay?: number | undefined;
        availableForTelemed?: boolean | undefined;
        timezone?: string | undefined;
    }, {
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined;
        specialization?: string | null | undefined;
        subSpecialization?: string | null | undefined;
        qualification?: string | null | undefined;
        experience?: number | null | undefined;
        licenseNumber?: string | null | undefined;
        licenseExpiry?: string | null | undefined;
        biography?: string | null | undefined;
        consultationFee?: number | null | undefined;
        telemedicineFee?: number | null | undefined;
        followUpFee?: number | null | undefined;
        maxPatientsPerDay?: number | undefined;
        availableForTelemed?: boolean | undefined;
        timezone?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined;
        specialization?: string | null | undefined;
        subSpecialization?: string | null | undefined;
        qualification?: string | null | undefined;
        experience?: number | null | undefined;
        licenseNumber?: string | null | undefined;
        licenseExpiry?: string | null | undefined;
        biography?: string | null | undefined;
        consultationFee?: number | null | undefined;
        telemedicineFee?: number | null | undefined;
        followUpFee?: number | null | undefined;
        maxPatientsPerDay?: number | undefined;
        availableForTelemed?: boolean | undefined;
        timezone?: string | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined;
        specialization?: string | null | undefined;
        subSpecialization?: string | null | undefined;
        qualification?: string | null | undefined;
        experience?: number | null | undefined;
        licenseNumber?: string | null | undefined;
        licenseExpiry?: string | null | undefined;
        biography?: string | null | undefined;
        consultationFee?: number | null | undefined;
        telemedicineFee?: number | null | undefined;
        followUpFee?: number | null | undefined;
        maxPatientsPerDay?: number | undefined;
        availableForTelemed?: boolean | undefined;
        timezone?: string | undefined;
    };
}>;
export declare const updateScheduleSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        days: z.ZodArray<z.ZodEffects<z.ZodObject<{
            dayOfWeek: z.ZodNumber;
            startTime: z.ZodString;
            endTime: z.ZodString;
            slotDuration: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            breakStart: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            breakEnd: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            startTime: string;
            endTime: string;
            dayOfWeek: number;
            slotDuration: number;
            isActive: boolean;
            breakStart?: string | null | undefined;
            breakEnd?: string | null | undefined;
        }, {
            startTime: string;
            endTime: string;
            dayOfWeek: number;
            slotDuration?: number | undefined;
            isActive?: boolean | undefined;
            breakStart?: string | null | undefined;
            breakEnd?: string | null | undefined;
        }>, {
            startTime: string;
            endTime: string;
            dayOfWeek: number;
            slotDuration: number;
            isActive: boolean;
            breakStart?: string | null | undefined;
            breakEnd?: string | null | undefined;
        }, {
            startTime: string;
            endTime: string;
            dayOfWeek: number;
            slotDuration?: number | undefined;
            isActive?: boolean | undefined;
            breakStart?: string | null | undefined;
            breakEnd?: string | null | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        days: {
            startTime: string;
            endTime: string;
            dayOfWeek: number;
            slotDuration: number;
            isActive: boolean;
            breakStart?: string | null | undefined;
            breakEnd?: string | null | undefined;
        }[];
    }, {
        days: {
            startTime: string;
            endTime: string;
            dayOfWeek: number;
            slotDuration?: number | undefined;
            isActive?: boolean | undefined;
            breakStart?: string | null | undefined;
            breakEnd?: string | null | undefined;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        days: {
            startTime: string;
            endTime: string;
            dayOfWeek: number;
            slotDuration: number;
            isActive: boolean;
            breakStart?: string | null | undefined;
            breakEnd?: string | null | undefined;
        }[];
    };
}, {
    params: {
        id: string;
    };
    body: {
        days: {
            startTime: string;
            endTime: string;
            dayOfWeek: number;
            slotDuration?: number | undefined;
            isActive?: boolean | undefined;
            breakStart?: string | null | undefined;
            breakEnd?: string | null | undefined;
        }[];
    };
}>;
export declare const doctorIdSchema: z.ZodObject<{
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
export declare const doctorQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        search: z.ZodOptional<z.ZodString>;
        specialization: z.ZodOptional<z.ZodString>;
        organizationId: z.ZodOptional<z.ZodString>;
        branchId: z.ZodOptional<z.ZodString>;
        availableForTelemed: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
        status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "SUSPENDED"]>>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["firstName", "lastName", "specialization", "experience", "createdAt"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortBy: "firstName" | "lastName" | "createdAt" | "specialization" | "experience";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        specialization?: string | undefined;
        availableForTelemed?: boolean | undefined;
    }, {
        search?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        sortBy?: "firstName" | "lastName" | "createdAt" | "specialization" | "experience" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        specialization?: string | undefined;
        availableForTelemed?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortBy: "firstName" | "lastName" | "createdAt" | "specialization" | "experience";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        specialization?: string | undefined;
        availableForTelemed?: boolean | undefined;
    };
}, {
    query: {
        search?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        sortBy?: "firstName" | "lastName" | "createdAt" | "specialization" | "experience" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        specialization?: string | undefined;
        availableForTelemed?: string | undefined;
    };
}>;
export declare const availabilityQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        doctorId: z.ZodString;
        dateFrom: z.ZodString;
        dateTo: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        dateFrom: string;
        doctorId: string;
        dateTo?: string | undefined;
    }, {
        dateFrom: string;
        doctorId: string;
        dateTo?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        dateFrom: string;
        doctorId: string;
        dateTo?: string | undefined;
    };
}, {
    query: {
        dateFrom: string;
        doctorId: string;
        dateTo?: string | undefined;
    };
}>;
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>['body'];
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>['body'];
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>['body'];
export type DoctorQueryInput = z.infer<typeof doctorQuerySchema>['query'];
//# sourceMappingURL=doctorValidator.d.ts.map