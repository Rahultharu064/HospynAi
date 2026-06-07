import { z } from 'zod';
export declare const scanDocumentSchema: z.ZodObject<{
    body: z.ZodObject<{
        patientId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        documentType: z.ZodEnum<["PRESCRIPTION", "LAB_REPORT", "INSURANCE_CARD", "ID_PROOF", "MEDICAL_CERTIFICATE", "DISCHARGE_SUMMARY", "GENERIC"]>;
        language: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        preprocess: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        extractFields: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        confidenceThreshold: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        documentType: "PRESCRIPTION" | "LAB_REPORT" | "INSURANCE_CARD" | "ID_PROOF" | "MEDICAL_CERTIFICATE" | "DISCHARGE_SUMMARY" | "GENERIC";
        language: string;
        preprocess: boolean;
        extractFields: boolean;
        confidenceThreshold: number;
        patientId?: string | null | undefined;
    }, {
        documentType: "PRESCRIPTION" | "LAB_REPORT" | "INSURANCE_CARD" | "ID_PROOF" | "MEDICAL_CERTIFICATE" | "DISCHARGE_SUMMARY" | "GENERIC";
        patientId?: string | null | undefined;
        language?: string | undefined;
        preprocess?: boolean | undefined;
        extractFields?: boolean | undefined;
        confidenceThreshold?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        documentType: "PRESCRIPTION" | "LAB_REPORT" | "INSURANCE_CARD" | "ID_PROOF" | "MEDICAL_CERTIFICATE" | "DISCHARGE_SUMMARY" | "GENERIC";
        language: string;
        preprocess: boolean;
        extractFields: boolean;
        confidenceThreshold: number;
        patientId?: string | null | undefined;
    };
}, {
    body: {
        documentType: "PRESCRIPTION" | "LAB_REPORT" | "INSURANCE_CARD" | "ID_PROOF" | "MEDICAL_CERTIFICATE" | "DISCHARGE_SUMMARY" | "GENERIC";
        patientId?: string | null | undefined;
        language?: string | undefined;
        preprocess?: boolean | undefined;
        extractFields?: boolean | undefined;
        confidenceThreshold?: number | undefined;
    };
}>;
export declare const scanPrescriptionSchema: z.ZodObject<{
    body: z.ZodObject<{
        patientId: z.ZodString;
        doctorId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        language: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        patientId: string;
        language: string;
        doctorId?: string | null | undefined;
    }, {
        patientId: string;
        doctorId?: string | null | undefined;
        language?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        patientId: string;
        language: string;
        doctorId?: string | null | undefined;
    };
}, {
    body: {
        patientId: string;
        doctorId?: string | null | undefined;
        language?: string | undefined;
    };
}>;
export declare const scanLabReportSchema: z.ZodObject<{
    body: z.ZodObject<{
        patientId: z.ZodString;
        doctorId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        language: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        patientId: string;
        language: string;
        doctorId?: string | null | undefined;
    }, {
        patientId: string;
        doctorId?: string | null | undefined;
        language?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        patientId: string;
        language: string;
        doctorId?: string | null | undefined;
    };
}, {
    body: {
        patientId: string;
        doctorId?: string | null | undefined;
        language?: string | undefined;
    };
}>;
export declare const scanInsuranceCardSchema: z.ZodObject<{
    body: z.ZodObject<{
        patientId: z.ZodString;
        language: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        patientId: string;
        language: string;
    }, {
        patientId: string;
        language?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        patientId: string;
        language: string;
    };
}, {
    body: {
        patientId: string;
        language?: string | undefined;
    };
}>;
export declare const verifyOcrDataSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        corrections: z.ZodRecord<z.ZodString, z.ZodAny>;
        confirmed: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        corrections: Record<string, any>;
        confirmed: boolean;
    }, {
        corrections: Record<string, any>;
        confirmed: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        corrections: Record<string, any>;
        confirmed: boolean;
    };
}, {
    params: {
        id: string;
    };
    body: {
        corrections: Record<string, any>;
        confirmed: boolean;
    };
}>;
export declare const ocrIdSchema: z.ZodObject<{
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
export declare const ocrQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        patientId: z.ZodOptional<z.ZodString>;
        documentType: z.ZodOptional<z.ZodEnum<["PRESCRIPTION", "LAB_REPORT", "INSURANCE_CARD", "ID_PROOF", "MEDICAL_CERTIFICATE", "DISCHARGE_SUMMARY", "GENERIC"]>>;
        status: z.ZodOptional<z.ZodString>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["createdAt", "confidence", "processingTime"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortBy: "createdAt" | "confidence" | "processingTime";
        sortOrder: "asc" | "desc";
        status?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        documentType?: "PRESCRIPTION" | "LAB_REPORT" | "INSURANCE_CARD" | "ID_PROOF" | "MEDICAL_CERTIFICATE" | "DISCHARGE_SUMMARY" | "GENERIC" | undefined;
    }, {
        status?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "createdAt" | "confidence" | "processingTime" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        patientId?: string | undefined;
        documentType?: "PRESCRIPTION" | "LAB_REPORT" | "INSURANCE_CARD" | "ID_PROOF" | "MEDICAL_CERTIFICATE" | "DISCHARGE_SUMMARY" | "GENERIC" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortBy: "createdAt" | "confidence" | "processingTime";
        sortOrder: "asc" | "desc";
        status?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        documentType?: "PRESCRIPTION" | "LAB_REPORT" | "INSURANCE_CARD" | "ID_PROOF" | "MEDICAL_CERTIFICATE" | "DISCHARGE_SUMMARY" | "GENERIC" | undefined;
    };
}, {
    query: {
        status?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "createdAt" | "confidence" | "processingTime" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        patientId?: string | undefined;
        documentType?: "PRESCRIPTION" | "LAB_REPORT" | "INSURANCE_CARD" | "ID_PROOF" | "MEDICAL_CERTIFICATE" | "DISCHARGE_SUMMARY" | "GENERIC" | undefined;
    };
}>;
export type ScanDocumentInput = z.infer<typeof scanDocumentSchema>['body'];
export type ScanPrescriptionInput = z.infer<typeof scanPrescriptionSchema>['body'];
export type ScanLabReportInput = z.infer<typeof scanLabReportSchema>['body'];
export type ScanInsuranceCardInput = z.infer<typeof scanInsuranceCardSchema>['body'];
export type VerifyOcrDataInput = z.infer<typeof verifyOcrDataSchema>['body'];
export type OcrQueryInput = z.infer<typeof ocrQuerySchema>['query'];
//# sourceMappingURL=ocrValidators.d.ts.map