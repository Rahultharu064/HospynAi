import { z } from 'zod';
export declare const createEMRSchema: z.ZodObject<{
    body: z.ZodObject<{
        patientId: z.ZodString;
        appointmentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        doctorId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        chiefComplaint: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        diagnosis: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        icd10Codes: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        symptoms: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        vitalSigns: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            temperature: z.ZodOptional<z.ZodNumber>;
            bloodPressureSystolic: z.ZodOptional<z.ZodNumber>;
            bloodPressureDiastolic: z.ZodOptional<z.ZodNumber>;
            heartRate: z.ZodOptional<z.ZodNumber>;
            respiratoryRate: z.ZodOptional<z.ZodNumber>;
            oxygenSaturation: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            weight: z.ZodOptional<z.ZodNumber>;
            bmi: z.ZodOptional<z.ZodNumber>;
            painLevel: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            temperature?: number | undefined;
            bloodPressureSystolic?: number | undefined;
            bloodPressureDiastolic?: number | undefined;
            heartRate?: number | undefined;
            respiratoryRate?: number | undefined;
            oxygenSaturation?: number | undefined;
            height?: number | undefined;
            weight?: number | undefined;
            bmi?: number | undefined;
            painLevel?: number | undefined;
        }, {
            temperature?: number | undefined;
            bloodPressureSystolic?: number | undefined;
            bloodPressureDiastolic?: number | undefined;
            heartRate?: number | undefined;
            respiratoryRate?: number | undefined;
            oxygenSaturation?: number | undefined;
            height?: number | undefined;
            weight?: number | undefined;
            bmi?: number | undefined;
            painLevel?: number | undefined;
        }>>>;
        examinationNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        treatmentPlan: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        doctorNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        status: string;
        patientId: string;
        icd10Codes: string[];
        doctorId?: string | null | undefined;
        symptoms?: Record<string, any> | null | undefined;
        appointmentId?: string | null | undefined;
        chiefComplaint?: string | null | undefined;
        diagnosis?: string | null | undefined;
        vitalSigns?: {
            temperature?: number | undefined;
            bloodPressureSystolic?: number | undefined;
            bloodPressureDiastolic?: number | undefined;
            heartRate?: number | undefined;
            respiratoryRate?: number | undefined;
            oxygenSaturation?: number | undefined;
            height?: number | undefined;
            weight?: number | undefined;
            bmi?: number | undefined;
            painLevel?: number | undefined;
        } | null | undefined;
        examinationNotes?: string | null | undefined;
        treatmentPlan?: string | null | undefined;
        doctorNotes?: string | null | undefined;
    }, {
        patientId: string;
        status?: string | undefined;
        doctorId?: string | null | undefined;
        symptoms?: Record<string, any> | null | undefined;
        appointmentId?: string | null | undefined;
        chiefComplaint?: string | null | undefined;
        diagnosis?: string | null | undefined;
        icd10Codes?: string[] | undefined;
        vitalSigns?: {
            temperature?: number | undefined;
            bloodPressureSystolic?: number | undefined;
            bloodPressureDiastolic?: number | undefined;
            heartRate?: number | undefined;
            respiratoryRate?: number | undefined;
            oxygenSaturation?: number | undefined;
            height?: number | undefined;
            weight?: number | undefined;
            bmi?: number | undefined;
            painLevel?: number | undefined;
        } | null | undefined;
        examinationNotes?: string | null | undefined;
        treatmentPlan?: string | null | undefined;
        doctorNotes?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        status: string;
        patientId: string;
        icd10Codes: string[];
        doctorId?: string | null | undefined;
        symptoms?: Record<string, any> | null | undefined;
        appointmentId?: string | null | undefined;
        chiefComplaint?: string | null | undefined;
        diagnosis?: string | null | undefined;
        vitalSigns?: {
            temperature?: number | undefined;
            bloodPressureSystolic?: number | undefined;
            bloodPressureDiastolic?: number | undefined;
            heartRate?: number | undefined;
            respiratoryRate?: number | undefined;
            oxygenSaturation?: number | undefined;
            height?: number | undefined;
            weight?: number | undefined;
            bmi?: number | undefined;
            painLevel?: number | undefined;
        } | null | undefined;
        examinationNotes?: string | null | undefined;
        treatmentPlan?: string | null | undefined;
        doctorNotes?: string | null | undefined;
    };
}, {
    body: {
        patientId: string;
        status?: string | undefined;
        doctorId?: string | null | undefined;
        symptoms?: Record<string, any> | null | undefined;
        appointmentId?: string | null | undefined;
        chiefComplaint?: string | null | undefined;
        diagnosis?: string | null | undefined;
        icd10Codes?: string[] | undefined;
        vitalSigns?: {
            temperature?: number | undefined;
            bloodPressureSystolic?: number | undefined;
            bloodPressureDiastolic?: number | undefined;
            heartRate?: number | undefined;
            respiratoryRate?: number | undefined;
            oxygenSaturation?: number | undefined;
            height?: number | undefined;
            weight?: number | undefined;
            bmi?: number | undefined;
            painLevel?: number | undefined;
        } | null | undefined;
        examinationNotes?: string | null | undefined;
        treatmentPlan?: string | null | undefined;
        doctorNotes?: string | null | undefined;
    };
}>;
export declare const updateEMRSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        chiefComplaint: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        diagnosis: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        icd10Codes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        symptoms: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        vitalSigns: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            temperature: z.ZodOptional<z.ZodNumber>;
            bloodPressureSystolic: z.ZodOptional<z.ZodNumber>;
            bloodPressureDiastolic: z.ZodOptional<z.ZodNumber>;
            heartRate: z.ZodOptional<z.ZodNumber>;
            respiratoryRate: z.ZodOptional<z.ZodNumber>;
            oxygenSaturation: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            weight: z.ZodOptional<z.ZodNumber>;
            bmi: z.ZodOptional<z.ZodNumber>;
            painLevel: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            temperature?: number | undefined;
            bloodPressureSystolic?: number | undefined;
            bloodPressureDiastolic?: number | undefined;
            heartRate?: number | undefined;
            respiratoryRate?: number | undefined;
            oxygenSaturation?: number | undefined;
            height?: number | undefined;
            weight?: number | undefined;
            bmi?: number | undefined;
            painLevel?: number | undefined;
        }, {
            temperature?: number | undefined;
            bloodPressureSystolic?: number | undefined;
            bloodPressureDiastolic?: number | undefined;
            heartRate?: number | undefined;
            respiratoryRate?: number | undefined;
            oxygenSaturation?: number | undefined;
            height?: number | undefined;
            weight?: number | undefined;
            bmi?: number | undefined;
            painLevel?: number | undefined;
        }>>>;
        examinationNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        treatmentPlan: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        doctorNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status?: string | undefined;
        symptoms?: Record<string, any> | null | undefined;
        chiefComplaint?: string | null | undefined;
        diagnosis?: string | null | undefined;
        icd10Codes?: string[] | undefined;
        vitalSigns?: {
            temperature?: number | undefined;
            bloodPressureSystolic?: number | undefined;
            bloodPressureDiastolic?: number | undefined;
            heartRate?: number | undefined;
            respiratoryRate?: number | undefined;
            oxygenSaturation?: number | undefined;
            height?: number | undefined;
            weight?: number | undefined;
            bmi?: number | undefined;
            painLevel?: number | undefined;
        } | null | undefined;
        examinationNotes?: string | null | undefined;
        treatmentPlan?: string | null | undefined;
        doctorNotes?: string | null | undefined;
    }, {
        status?: string | undefined;
        symptoms?: Record<string, any> | null | undefined;
        chiefComplaint?: string | null | undefined;
        diagnosis?: string | null | undefined;
        icd10Codes?: string[] | undefined;
        vitalSigns?: {
            temperature?: number | undefined;
            bloodPressureSystolic?: number | undefined;
            bloodPressureDiastolic?: number | undefined;
            heartRate?: number | undefined;
            respiratoryRate?: number | undefined;
            oxygenSaturation?: number | undefined;
            height?: number | undefined;
            weight?: number | undefined;
            bmi?: number | undefined;
            painLevel?: number | undefined;
        } | null | undefined;
        examinationNotes?: string | null | undefined;
        treatmentPlan?: string | null | undefined;
        doctorNotes?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        status?: string | undefined;
        symptoms?: Record<string, any> | null | undefined;
        chiefComplaint?: string | null | undefined;
        diagnosis?: string | null | undefined;
        icd10Codes?: string[] | undefined;
        vitalSigns?: {
            temperature?: number | undefined;
            bloodPressureSystolic?: number | undefined;
            bloodPressureDiastolic?: number | undefined;
            heartRate?: number | undefined;
            respiratoryRate?: number | undefined;
            oxygenSaturation?: number | undefined;
            height?: number | undefined;
            weight?: number | undefined;
            bmi?: number | undefined;
            painLevel?: number | undefined;
        } | null | undefined;
        examinationNotes?: string | null | undefined;
        treatmentPlan?: string | null | undefined;
        doctorNotes?: string | null | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        status?: string | undefined;
        symptoms?: Record<string, any> | null | undefined;
        chiefComplaint?: string | null | undefined;
        diagnosis?: string | null | undefined;
        icd10Codes?: string[] | undefined;
        vitalSigns?: {
            temperature?: number | undefined;
            bloodPressureSystolic?: number | undefined;
            bloodPressureDiastolic?: number | undefined;
            heartRate?: number | undefined;
            respiratoryRate?: number | undefined;
            oxygenSaturation?: number | undefined;
            height?: number | undefined;
            weight?: number | undefined;
            bmi?: number | undefined;
            painLevel?: number | undefined;
        } | null | undefined;
        examinationNotes?: string | null | undefined;
        treatmentPlan?: string | null | undefined;
        doctorNotes?: string | null | undefined;
    };
}>;
export declare const createPrescriptionSchema: z.ZodObject<{
    body: z.ZodObject<{
        medicalRecordId: z.ZodString;
        patientId: z.ZodString;
        drugName: z.ZodString;
        genericName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        dosage: z.ZodString;
        frequency: z.ZodString;
        duration: z.ZodString;
        quantity: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        route: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        instructions: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        refillsAllowed: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        isControlled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        patientId: string;
        duration: string;
        medicalRecordId: string;
        drugName: string;
        dosage: string;
        frequency: string;
        refillsAllowed: number;
        isControlled: boolean;
        route?: string | null | undefined;
        startDate?: string | undefined;
        endDate?: string | null | undefined;
        genericName?: string | null | undefined;
        quantity?: string | null | undefined;
        instructions?: string | null | undefined;
    }, {
        patientId: string;
        duration: string;
        medicalRecordId: string;
        drugName: string;
        dosage: string;
        frequency: string;
        route?: string | null | undefined;
        startDate?: string | undefined;
        endDate?: string | null | undefined;
        genericName?: string | null | undefined;
        quantity?: string | null | undefined;
        instructions?: string | null | undefined;
        refillsAllowed?: number | undefined;
        isControlled?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        patientId: string;
        duration: string;
        medicalRecordId: string;
        drugName: string;
        dosage: string;
        frequency: string;
        refillsAllowed: number;
        isControlled: boolean;
        route?: string | null | undefined;
        startDate?: string | undefined;
        endDate?: string | null | undefined;
        genericName?: string | null | undefined;
        quantity?: string | null | undefined;
        instructions?: string | null | undefined;
    };
}, {
    body: {
        patientId: string;
        duration: string;
        medicalRecordId: string;
        drugName: string;
        dosage: string;
        frequency: string;
        route?: string | null | undefined;
        startDate?: string | undefined;
        endDate?: string | null | undefined;
        genericName?: string | null | undefined;
        quantity?: string | null | undefined;
        instructions?: string | null | undefined;
        refillsAllowed?: number | undefined;
        isControlled?: boolean | undefined;
    };
}>;
export declare const createLabReportSchema: z.ZodObject<{
    body: z.ZodObject<{
        medicalRecordId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        patientId: z.ZodString;
        doctorId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        testName: z.ZodString;
        testCategory: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        results: z.ZodRecord<z.ZodString, z.ZodAny>;
        normalRanges: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        interpretation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<{
            PENDING: "PENDING";
            IN_PROGRESS: "IN_PROGRESS";
            COMPLETED: "COMPLETED";
            CANCELLED: "CANCELLED";
        }>>>;
    }, "strip", z.ZodTypeAny, {
        status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "PENDING";
        patientId: string;
        testName: string;
        results: Record<string, any>;
        doctorId?: string | null | undefined;
        medicalRecordId?: string | null | undefined;
        testCategory?: string | null | undefined;
        normalRanges?: Record<string, any> | null | undefined;
        interpretation?: string | null | undefined;
    }, {
        patientId: string;
        testName: string;
        results: Record<string, any>;
        status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "PENDING" | undefined;
        doctorId?: string | null | undefined;
        medicalRecordId?: string | null | undefined;
        testCategory?: string | null | undefined;
        normalRanges?: Record<string, any> | null | undefined;
        interpretation?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "PENDING";
        patientId: string;
        testName: string;
        results: Record<string, any>;
        doctorId?: string | null | undefined;
        medicalRecordId?: string | null | undefined;
        testCategory?: string | null | undefined;
        normalRanges?: Record<string, any> | null | undefined;
        interpretation?: string | null | undefined;
    };
}, {
    body: {
        patientId: string;
        testName: string;
        results: Record<string, any>;
        status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "PENDING" | undefined;
        doctorId?: string | null | undefined;
        medicalRecordId?: string | null | undefined;
        testCategory?: string | null | undefined;
        normalRanges?: Record<string, any> | null | undefined;
        interpretation?: string | null | undefined;
    };
}>;
export declare const emrIdSchema: z.ZodObject<{
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
export declare const emrQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        patientId: z.ZodOptional<z.ZodString>;
        doctorId: z.ZodOptional<z.ZodString>;
        appointmentId: z.ZodOptional<z.ZodString>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        search: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["createdAt", "updatedAt", "status"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortBy: "status" | "createdAt" | "updatedAt";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        status?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        doctorId?: string | undefined;
        appointmentId?: string | undefined;
    }, {
        search?: string | undefined;
        status?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "status" | "createdAt" | "updatedAt" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        patientId?: string | undefined;
        doctorId?: string | undefined;
        appointmentId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortBy: "status" | "createdAt" | "updatedAt";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        status?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        doctorId?: string | undefined;
        appointmentId?: string | undefined;
    };
}, {
    query: {
        search?: string | undefined;
        status?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "status" | "createdAt" | "updatedAt" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        patientId?: string | undefined;
        doctorId?: string | undefined;
        appointmentId?: string | undefined;
    };
}>;
export declare const signEMRSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        signature: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        signature?: string | undefined;
    }, {
        signature?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        signature?: string | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        signature?: string | undefined;
    };
}>;
export type CreateEMRInput = z.infer<typeof createEMRSchema>['body'];
export type UpdateEMRInput = z.infer<typeof updateEMRSchema>['body'];
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>['body'];
export type CreateLabReportInput = z.infer<typeof createLabReportSchema>['body'];
export type EMRQueryInput = z.infer<typeof emrQuerySchema>['query'];
//# sourceMappingURL=emrValidator.d.ts.map