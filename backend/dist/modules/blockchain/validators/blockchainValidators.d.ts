import { z } from 'zod';
export declare const anchorRecordSchema: z.ZodObject<{
    body: z.ZodObject<{
        patientId: z.ZodString;
        medicalRecordId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        recordType: z.ZodNativeEnum<{
            MEDICAL_RECORD: "MEDICAL_RECORD";
            PRESCRIPTION: "PRESCRIPTION";
            CONSENT: "CONSENT";
            LAB_REPORT: "LAB_REPORT";
        }>;
        data: z.ZodAny;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    }, "strip", z.ZodTypeAny, {
        patientId: string;
        recordType: "PRESCRIPTION" | "LAB_REPORT" | "MEDICAL_RECORD" | "CONSENT";
        metadata?: Record<string, any> | null | undefined;
        data?: any;
        medicalRecordId?: string | null | undefined;
    }, {
        patientId: string;
        recordType: "PRESCRIPTION" | "LAB_REPORT" | "MEDICAL_RECORD" | "CONSENT";
        metadata?: Record<string, any> | null | undefined;
        data?: any;
        medicalRecordId?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        patientId: string;
        recordType: "PRESCRIPTION" | "LAB_REPORT" | "MEDICAL_RECORD" | "CONSENT";
        metadata?: Record<string, any> | null | undefined;
        data?: any;
        medicalRecordId?: string | null | undefined;
    };
}, {
    body: {
        patientId: string;
        recordType: "PRESCRIPTION" | "LAB_REPORT" | "MEDICAL_RECORD" | "CONSENT";
        metadata?: Record<string, any> | null | undefined;
        data?: any;
        medicalRecordId?: string | null | undefined;
    };
}>;
export declare const verifyRecordSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        recordId: z.ZodOptional<z.ZodString>;
        dataHash: z.ZodOptional<z.ZodString>;
        txHash: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        txHash?: string | undefined;
        recordId?: string | undefined;
        dataHash?: string | undefined;
    }, {
        txHash?: string | undefined;
        recordId?: string | undefined;
        dataHash?: string | undefined;
    }>, {
        txHash?: string | undefined;
        recordId?: string | undefined;
        dataHash?: string | undefined;
    }, {
        txHash?: string | undefined;
        recordId?: string | undefined;
        dataHash?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        txHash?: string | undefined;
        recordId?: string | undefined;
        dataHash?: string | undefined;
    };
}, {
    body: {
        txHash?: string | undefined;
        recordId?: string | undefined;
        dataHash?: string | undefined;
    };
}>;
export declare const consentSchema: z.ZodObject<{
    body: z.ZodObject<{
        patientId: z.ZodString;
        providerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        recordType: z.ZodString;
        accessLevel: z.ZodEnum<["READ", "WRITE", "FULL"]>;
        expiresAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        purpose: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        patientId: string;
        recordType: string;
        accessLevel: "FULL" | "READ" | "WRITE";
        expiresAt?: string | null | undefined;
        providerId?: string | null | undefined;
        purpose?: string | null | undefined;
    }, {
        patientId: string;
        recordType: string;
        accessLevel: "FULL" | "READ" | "WRITE";
        expiresAt?: string | null | undefined;
        providerId?: string | null | undefined;
        purpose?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        patientId: string;
        recordType: string;
        accessLevel: "FULL" | "READ" | "WRITE";
        expiresAt?: string | null | undefined;
        providerId?: string | null | undefined;
        purpose?: string | null | undefined;
    };
}, {
    body: {
        patientId: string;
        recordType: string;
        accessLevel: "FULL" | "READ" | "WRITE";
        expiresAt?: string | null | undefined;
        providerId?: string | null | undefined;
        purpose?: string | null | undefined;
    };
}>;
export declare const revokeConsentSchema: z.ZodObject<{
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
export declare const blockchainIdSchema: z.ZodObject<{
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
export declare const blockchainQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        patientId: z.ZodOptional<z.ZodString>;
        medicalRecordId: z.ZodOptional<z.ZodString>;
        recordType: z.ZodOptional<z.ZodNativeEnum<{
            MEDICAL_RECORD: "MEDICAL_RECORD";
            PRESCRIPTION: "PRESCRIPTION";
            CONSENT: "CONSENT";
            LAB_REPORT: "LAB_REPORT";
        }>>;
        status: z.ZodOptional<z.ZodString>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        status?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        medicalRecordId?: string | undefined;
        recordType?: "PRESCRIPTION" | "LAB_REPORT" | "MEDICAL_RECORD" | "CONSENT" | undefined;
    }, {
        status?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        medicalRecordId?: string | undefined;
        recordType?: "PRESCRIPTION" | "LAB_REPORT" | "MEDICAL_RECORD" | "CONSENT" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        status?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        medicalRecordId?: string | undefined;
        recordType?: "PRESCRIPTION" | "LAB_REPORT" | "MEDICAL_RECORD" | "CONSENT" | undefined;
    };
}, {
    query: {
        status?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        medicalRecordId?: string | undefined;
        recordType?: "PRESCRIPTION" | "LAB_REPORT" | "MEDICAL_RECORD" | "CONSENT" | undefined;
    };
}>;
export type AnchorRecordInput = z.infer<typeof anchorRecordSchema>['body'];
export type VerifyRecordInput = z.infer<typeof verifyRecordSchema>['body'];
export type ConsentInput = z.infer<typeof consentSchema>['body'];
export type RevokeConsentInput = z.infer<typeof revokeConsentSchema>['body'];
export type BlockchainQueryInput = z.infer<typeof blockchainQuerySchema>['query'];
//# sourceMappingURL=blockchainValidators.d.ts.map