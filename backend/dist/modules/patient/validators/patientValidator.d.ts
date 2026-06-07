import { z } from 'zod';
export declare const createPatientSchema: z.ZodObject<{
    body: z.ZodObject<{
        firstName: z.ZodEffects<z.ZodString, string, string>;
        lastName: z.ZodEffects<z.ZodString, string, string>;
        email: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>;
        phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        dateOfBirth: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
        gender: z.ZodNullable<z.ZodOptional<z.ZodNativeEnum<{
            MALE: "MALE";
            FEMALE: "FEMALE";
            OTHER: "OTHER";
        }>>>;
        bloodGroup: z.ZodNullable<z.ZodOptional<z.ZodNativeEnum<{
            A_POSITIVE: "A_POSITIVE";
            A_NEGATIVE: "A_NEGATIVE";
            B_POSITIVE: "B_POSITIVE";
            B_NEGATIVE: "B_NEGATIVE";
            AB_POSITIVE: "AB_POSITIVE";
            AB_NEGATIVE: "AB_NEGATIVE";
            O_POSITIVE: "O_POSITIVE";
            O_NEGATIVE: "O_NEGATIVE";
        }>>>;
        address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        city: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        state: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        country: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        zipCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        emergencyContactName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        emergencyContactPhone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        emergencyContactRelation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        insuranceProvider: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        insurancePolicyNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        insuranceValidUntil: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
        allergies: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        chronicConditions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        currentMedications: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        organizationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        branchId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        primaryDoctorId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        firstName: string;
        lastName: string;
        allergies: string[];
        chronicConditions: string[];
        currentMedications: string[];
        state?: string | null | undefined;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        country?: string | null | undefined;
        city?: string | null | undefined;
        address?: string | null | undefined;
        dateOfBirth?: string | null | undefined;
        gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
        bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
        zipCode?: string | null | undefined;
        emergencyContactName?: string | null | undefined;
        emergencyContactPhone?: string | null | undefined;
        emergencyContactRelation?: string | null | undefined;
        insuranceProvider?: string | null | undefined;
        insurancePolicyNumber?: string | null | undefined;
        insuranceValidUntil?: string | null | undefined;
        notes?: string | null | undefined;
        primaryDoctorId?: string | null | undefined;
    }, {
        firstName: string;
        lastName: string;
        state?: string | null | undefined;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        country?: string | null | undefined;
        city?: string | null | undefined;
        address?: string | null | undefined;
        dateOfBirth?: string | null | undefined;
        gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
        bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
        zipCode?: string | null | undefined;
        emergencyContactName?: string | null | undefined;
        emergencyContactPhone?: string | null | undefined;
        emergencyContactRelation?: string | null | undefined;
        insuranceProvider?: string | null | undefined;
        insurancePolicyNumber?: string | null | undefined;
        insuranceValidUntil?: string | null | undefined;
        allergies?: string[] | undefined;
        chronicConditions?: string[] | undefined;
        currentMedications?: string[] | undefined;
        notes?: string | null | undefined;
        primaryDoctorId?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        firstName: string;
        lastName: string;
        allergies: string[];
        chronicConditions: string[];
        currentMedications: string[];
        state?: string | null | undefined;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        country?: string | null | undefined;
        city?: string | null | undefined;
        address?: string | null | undefined;
        dateOfBirth?: string | null | undefined;
        gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
        bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
        zipCode?: string | null | undefined;
        emergencyContactName?: string | null | undefined;
        emergencyContactPhone?: string | null | undefined;
        emergencyContactRelation?: string | null | undefined;
        insuranceProvider?: string | null | undefined;
        insurancePolicyNumber?: string | null | undefined;
        insuranceValidUntil?: string | null | undefined;
        notes?: string | null | undefined;
        primaryDoctorId?: string | null | undefined;
    };
}, {
    body: {
        firstName: string;
        lastName: string;
        state?: string | null | undefined;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        country?: string | null | undefined;
        city?: string | null | undefined;
        address?: string | null | undefined;
        dateOfBirth?: string | null | undefined;
        gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
        bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
        zipCode?: string | null | undefined;
        emergencyContactName?: string | null | undefined;
        emergencyContactPhone?: string | null | undefined;
        emergencyContactRelation?: string | null | undefined;
        insuranceProvider?: string | null | undefined;
        insurancePolicyNumber?: string | null | undefined;
        insuranceValidUntil?: string | null | undefined;
        allergies?: string[] | undefined;
        chronicConditions?: string[] | undefined;
        currentMedications?: string[] | undefined;
        notes?: string | null | undefined;
        primaryDoctorId?: string | null | undefined;
    };
}>;
export declare const updatePatientSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodEffects<z.ZodObject<{
        firstName: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        lastName: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        email: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>;
        phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        dateOfBirth: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
        gender: z.ZodNullable<z.ZodOptional<z.ZodNativeEnum<{
            MALE: "MALE";
            FEMALE: "FEMALE";
            OTHER: "OTHER";
        }>>>;
        bloodGroup: z.ZodNullable<z.ZodOptional<z.ZodNativeEnum<{
            A_POSITIVE: "A_POSITIVE";
            A_NEGATIVE: "A_NEGATIVE";
            B_POSITIVE: "B_POSITIVE";
            B_NEGATIVE: "B_NEGATIVE";
            AB_POSITIVE: "AB_POSITIVE";
            AB_NEGATIVE: "AB_NEGATIVE";
            O_POSITIVE: "O_POSITIVE";
            O_NEGATIVE: "O_NEGATIVE";
        }>>>;
        address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        city: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        state: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        country: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        zipCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        emergencyContactName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        emergencyContactPhone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        emergencyContactRelation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        insuranceProvider: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        insurancePolicyNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        insuranceValidUntil: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
        allergies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        chronicConditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        currentMedications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodOptional<z.ZodNativeEnum<{
            ACTIVE: "ACTIVE";
            INACTIVE: "INACTIVE";
            DECEASED: "DECEASED";
        }>>;
        primaryDoctorId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        state?: string | null | undefined;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "DECEASED" | undefined;
        country?: string | null | undefined;
        city?: string | null | undefined;
        address?: string | null | undefined;
        dateOfBirth?: string | null | undefined;
        gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
        bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
        zipCode?: string | null | undefined;
        emergencyContactName?: string | null | undefined;
        emergencyContactPhone?: string | null | undefined;
        emergencyContactRelation?: string | null | undefined;
        insuranceProvider?: string | null | undefined;
        insurancePolicyNumber?: string | null | undefined;
        insuranceValidUntil?: string | null | undefined;
        allergies?: string[] | undefined;
        chronicConditions?: string[] | undefined;
        currentMedications?: string[] | undefined;
        notes?: string | null | undefined;
        primaryDoctorId?: string | null | undefined;
    }, {
        state?: string | null | undefined;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "DECEASED" | undefined;
        country?: string | null | undefined;
        city?: string | null | undefined;
        address?: string | null | undefined;
        dateOfBirth?: string | null | undefined;
        gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
        bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
        zipCode?: string | null | undefined;
        emergencyContactName?: string | null | undefined;
        emergencyContactPhone?: string | null | undefined;
        emergencyContactRelation?: string | null | undefined;
        insuranceProvider?: string | null | undefined;
        insurancePolicyNumber?: string | null | undefined;
        insuranceValidUntil?: string | null | undefined;
        allergies?: string[] | undefined;
        chronicConditions?: string[] | undefined;
        currentMedications?: string[] | undefined;
        notes?: string | null | undefined;
        primaryDoctorId?: string | null | undefined;
    }>, {
        state?: string | null | undefined;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "DECEASED" | undefined;
        country?: string | null | undefined;
        city?: string | null | undefined;
        address?: string | null | undefined;
        dateOfBirth?: string | null | undefined;
        gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
        bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
        zipCode?: string | null | undefined;
        emergencyContactName?: string | null | undefined;
        emergencyContactPhone?: string | null | undefined;
        emergencyContactRelation?: string | null | undefined;
        insuranceProvider?: string | null | undefined;
        insurancePolicyNumber?: string | null | undefined;
        insuranceValidUntil?: string | null | undefined;
        allergies?: string[] | undefined;
        chronicConditions?: string[] | undefined;
        currentMedications?: string[] | undefined;
        notes?: string | null | undefined;
        primaryDoctorId?: string | null | undefined;
    }, {
        state?: string | null | undefined;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "DECEASED" | undefined;
        country?: string | null | undefined;
        city?: string | null | undefined;
        address?: string | null | undefined;
        dateOfBirth?: string | null | undefined;
        gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
        bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
        zipCode?: string | null | undefined;
        emergencyContactName?: string | null | undefined;
        emergencyContactPhone?: string | null | undefined;
        emergencyContactRelation?: string | null | undefined;
        insuranceProvider?: string | null | undefined;
        insurancePolicyNumber?: string | null | undefined;
        insuranceValidUntil?: string | null | undefined;
        allergies?: string[] | undefined;
        chronicConditions?: string[] | undefined;
        currentMedications?: string[] | undefined;
        notes?: string | null | undefined;
        primaryDoctorId?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        state?: string | null | undefined;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "DECEASED" | undefined;
        country?: string | null | undefined;
        city?: string | null | undefined;
        address?: string | null | undefined;
        dateOfBirth?: string | null | undefined;
        gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
        bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
        zipCode?: string | null | undefined;
        emergencyContactName?: string | null | undefined;
        emergencyContactPhone?: string | null | undefined;
        emergencyContactRelation?: string | null | undefined;
        insuranceProvider?: string | null | undefined;
        insurancePolicyNumber?: string | null | undefined;
        insuranceValidUntil?: string | null | undefined;
        allergies?: string[] | undefined;
        chronicConditions?: string[] | undefined;
        currentMedications?: string[] | undefined;
        notes?: string | null | undefined;
        primaryDoctorId?: string | null | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        state?: string | null | undefined;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "DECEASED" | undefined;
        country?: string | null | undefined;
        city?: string | null | undefined;
        address?: string | null | undefined;
        dateOfBirth?: string | null | undefined;
        gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
        bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
        zipCode?: string | null | undefined;
        emergencyContactName?: string | null | undefined;
        emergencyContactPhone?: string | null | undefined;
        emergencyContactRelation?: string | null | undefined;
        insuranceProvider?: string | null | undefined;
        insurancePolicyNumber?: string | null | undefined;
        insuranceValidUntil?: string | null | undefined;
        allergies?: string[] | undefined;
        chronicConditions?: string[] | undefined;
        currentMedications?: string[] | undefined;
        notes?: string | null | undefined;
        primaryDoctorId?: string | null | undefined;
    };
}>;
export declare const patientIdSchema: z.ZodObject<{
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
export declare const patientQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        search: z.ZodOptional<z.ZodString>;
        gender: z.ZodOptional<z.ZodNativeEnum<{
            MALE: "MALE";
            FEMALE: "FEMALE";
            OTHER: "OTHER";
        }>>;
        bloodGroup: z.ZodOptional<z.ZodNativeEnum<{
            A_POSITIVE: "A_POSITIVE";
            A_NEGATIVE: "A_NEGATIVE";
            B_POSITIVE: "B_POSITIVE";
            B_NEGATIVE: "B_NEGATIVE";
            AB_POSITIVE: "AB_POSITIVE";
            AB_NEGATIVE: "AB_NEGATIVE";
            O_POSITIVE: "O_POSITIVE";
            O_NEGATIVE: "O_NEGATIVE";
        }>>;
        status: z.ZodOptional<z.ZodNativeEnum<{
            ACTIVE: "ACTIVE";
            INACTIVE: "INACTIVE";
            DECEASED: "DECEASED";
        }>>;
        organizationId: z.ZodOptional<z.ZodString>;
        branchId: z.ZodOptional<z.ZodString>;
        primaryDoctorId: z.ZodOptional<z.ZodString>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["firstName", "lastName", "createdAt", "updatedAt", "dateOfBirth", "totalVisits", "lastVisitDate"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortBy: "firstName" | "lastName" | "createdAt" | "updatedAt" | "dateOfBirth" | "totalVisits" | "lastVisitDate";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "DECEASED" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        gender?: "MALE" | "FEMALE" | "OTHER" | undefined;
        bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | undefined;
        primaryDoctorId?: string | undefined;
    }, {
        search?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "DECEASED" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "firstName" | "lastName" | "createdAt" | "updatedAt" | "dateOfBirth" | "totalVisits" | "lastVisitDate" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        gender?: "MALE" | "FEMALE" | "OTHER" | undefined;
        bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | undefined;
        primaryDoctorId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortBy: "firstName" | "lastName" | "createdAt" | "updatedAt" | "dateOfBirth" | "totalVisits" | "lastVisitDate";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "DECEASED" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        gender?: "MALE" | "FEMALE" | "OTHER" | undefined;
        bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | undefined;
        primaryDoctorId?: string | undefined;
    };
}, {
    query: {
        search?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "DECEASED" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "firstName" | "lastName" | "createdAt" | "updatedAt" | "dateOfBirth" | "totalVisits" | "lastVisitDate" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        gender?: "MALE" | "FEMALE" | "OTHER" | undefined;
        bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | undefined;
        primaryDoctorId?: string | undefined;
    };
}>;
export declare const bulkImportSchema: z.ZodObject<{
    body: z.ZodObject<{
        patients: z.ZodArray<z.ZodObject<{
            firstName: z.ZodEffects<z.ZodString, string, string>;
            lastName: z.ZodEffects<z.ZodString, string, string>;
            email: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>;
            phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            dateOfBirth: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
            gender: z.ZodNullable<z.ZodOptional<z.ZodNativeEnum<{
                MALE: "MALE";
                FEMALE: "FEMALE";
                OTHER: "OTHER";
            }>>>;
            bloodGroup: z.ZodNullable<z.ZodOptional<z.ZodNativeEnum<{
                A_POSITIVE: "A_POSITIVE";
                A_NEGATIVE: "A_NEGATIVE";
                B_POSITIVE: "B_POSITIVE";
                B_NEGATIVE: "B_NEGATIVE";
                AB_POSITIVE: "AB_POSITIVE";
                AB_NEGATIVE: "AB_NEGATIVE";
                O_POSITIVE: "O_POSITIVE";
                O_NEGATIVE: "O_NEGATIVE";
            }>>>;
            address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            city: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            state: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            country: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            zipCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            emergencyContactName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            emergencyContactPhone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            emergencyContactRelation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            insuranceProvider: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            insurancePolicyNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            insuranceValidUntil: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
            allergies: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
            chronicConditions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
            currentMedications: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
            notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            organizationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            branchId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            primaryDoctorId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            firstName: string;
            lastName: string;
            allergies: string[];
            chronicConditions: string[];
            currentMedications: string[];
            state?: string | null | undefined;
            email?: string | null | undefined;
            phone?: string | null | undefined;
            organizationId?: string | null | undefined;
            branchId?: string | null | undefined;
            country?: string | null | undefined;
            city?: string | null | undefined;
            address?: string | null | undefined;
            dateOfBirth?: string | null | undefined;
            gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
            bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
            zipCode?: string | null | undefined;
            emergencyContactName?: string | null | undefined;
            emergencyContactPhone?: string | null | undefined;
            emergencyContactRelation?: string | null | undefined;
            insuranceProvider?: string | null | undefined;
            insurancePolicyNumber?: string | null | undefined;
            insuranceValidUntil?: string | null | undefined;
            notes?: string | null | undefined;
            primaryDoctorId?: string | null | undefined;
        }, {
            firstName: string;
            lastName: string;
            state?: string | null | undefined;
            email?: string | null | undefined;
            phone?: string | null | undefined;
            organizationId?: string | null | undefined;
            branchId?: string | null | undefined;
            country?: string | null | undefined;
            city?: string | null | undefined;
            address?: string | null | undefined;
            dateOfBirth?: string | null | undefined;
            gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
            bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
            zipCode?: string | null | undefined;
            emergencyContactName?: string | null | undefined;
            emergencyContactPhone?: string | null | undefined;
            emergencyContactRelation?: string | null | undefined;
            insuranceProvider?: string | null | undefined;
            insurancePolicyNumber?: string | null | undefined;
            insuranceValidUntil?: string | null | undefined;
            allergies?: string[] | undefined;
            chronicConditions?: string[] | undefined;
            currentMedications?: string[] | undefined;
            notes?: string | null | undefined;
            primaryDoctorId?: string | null | undefined;
        }>, "many">;
        organizationId: z.ZodOptional<z.ZodString>;
        branchId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        patients: {
            firstName: string;
            lastName: string;
            allergies: string[];
            chronicConditions: string[];
            currentMedications: string[];
            state?: string | null | undefined;
            email?: string | null | undefined;
            phone?: string | null | undefined;
            organizationId?: string | null | undefined;
            branchId?: string | null | undefined;
            country?: string | null | undefined;
            city?: string | null | undefined;
            address?: string | null | undefined;
            dateOfBirth?: string | null | undefined;
            gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
            bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
            zipCode?: string | null | undefined;
            emergencyContactName?: string | null | undefined;
            emergencyContactPhone?: string | null | undefined;
            emergencyContactRelation?: string | null | undefined;
            insuranceProvider?: string | null | undefined;
            insurancePolicyNumber?: string | null | undefined;
            insuranceValidUntil?: string | null | undefined;
            notes?: string | null | undefined;
            primaryDoctorId?: string | null | undefined;
        }[];
        organizationId?: string | undefined;
        branchId?: string | undefined;
    }, {
        patients: {
            firstName: string;
            lastName: string;
            state?: string | null | undefined;
            email?: string | null | undefined;
            phone?: string | null | undefined;
            organizationId?: string | null | undefined;
            branchId?: string | null | undefined;
            country?: string | null | undefined;
            city?: string | null | undefined;
            address?: string | null | undefined;
            dateOfBirth?: string | null | undefined;
            gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
            bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
            zipCode?: string | null | undefined;
            emergencyContactName?: string | null | undefined;
            emergencyContactPhone?: string | null | undefined;
            emergencyContactRelation?: string | null | undefined;
            insuranceProvider?: string | null | undefined;
            insurancePolicyNumber?: string | null | undefined;
            insuranceValidUntil?: string | null | undefined;
            allergies?: string[] | undefined;
            chronicConditions?: string[] | undefined;
            currentMedications?: string[] | undefined;
            notes?: string | null | undefined;
            primaryDoctorId?: string | null | undefined;
        }[];
        organizationId?: string | undefined;
        branchId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        patients: {
            firstName: string;
            lastName: string;
            allergies: string[];
            chronicConditions: string[];
            currentMedications: string[];
            state?: string | null | undefined;
            email?: string | null | undefined;
            phone?: string | null | undefined;
            organizationId?: string | null | undefined;
            branchId?: string | null | undefined;
            country?: string | null | undefined;
            city?: string | null | undefined;
            address?: string | null | undefined;
            dateOfBirth?: string | null | undefined;
            gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
            bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
            zipCode?: string | null | undefined;
            emergencyContactName?: string | null | undefined;
            emergencyContactPhone?: string | null | undefined;
            emergencyContactRelation?: string | null | undefined;
            insuranceProvider?: string | null | undefined;
            insurancePolicyNumber?: string | null | undefined;
            insuranceValidUntil?: string | null | undefined;
            notes?: string | null | undefined;
            primaryDoctorId?: string | null | undefined;
        }[];
        organizationId?: string | undefined;
        branchId?: string | undefined;
    };
}, {
    body: {
        patients: {
            firstName: string;
            lastName: string;
            state?: string | null | undefined;
            email?: string | null | undefined;
            phone?: string | null | undefined;
            organizationId?: string | null | undefined;
            branchId?: string | null | undefined;
            country?: string | null | undefined;
            city?: string | null | undefined;
            address?: string | null | undefined;
            dateOfBirth?: string | null | undefined;
            gender?: "MALE" | "FEMALE" | "OTHER" | null | undefined;
            bloodGroup?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined;
            zipCode?: string | null | undefined;
            emergencyContactName?: string | null | undefined;
            emergencyContactPhone?: string | null | undefined;
            emergencyContactRelation?: string | null | undefined;
            insuranceProvider?: string | null | undefined;
            insurancePolicyNumber?: string | null | undefined;
            insuranceValidUntil?: string | null | undefined;
            allergies?: string[] | undefined;
            chronicConditions?: string[] | undefined;
            currentMedications?: string[] | undefined;
            notes?: string | null | undefined;
            primaryDoctorId?: string | null | undefined;
        }[];
        organizationId?: string | undefined;
        branchId?: string | undefined;
    };
}>;
export declare const uploadDocumentSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        documentType: z.ZodEnum<["LAB_REPORT", "PRESCRIPTION", "INSURANCE_CARD", "ID_PROOF", "MEDICAL_CERTIFICATE", "DISCHARGE_SUMMARY", "OTHER"]>;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        documentType: "PRESCRIPTION" | "LAB_REPORT" | "OTHER" | "INSURANCE_CARD" | "ID_PROOF" | "MEDICAL_CERTIFICATE" | "DISCHARGE_SUMMARY";
        title: string;
        description?: string | undefined;
    }, {
        documentType: "PRESCRIPTION" | "LAB_REPORT" | "OTHER" | "INSURANCE_CARD" | "ID_PROOF" | "MEDICAL_CERTIFICATE" | "DISCHARGE_SUMMARY";
        title: string;
        description?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        documentType: "PRESCRIPTION" | "LAB_REPORT" | "OTHER" | "INSURANCE_CARD" | "ID_PROOF" | "MEDICAL_CERTIFICATE" | "DISCHARGE_SUMMARY";
        title: string;
        description?: string | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        documentType: "PRESCRIPTION" | "LAB_REPORT" | "OTHER" | "INSURANCE_CARD" | "ID_PROOF" | "MEDICAL_CERTIFICATE" | "DISCHARGE_SUMMARY";
        title: string;
        description?: string | undefined;
    };
}>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>['body'];
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>['body'];
export type PatientQueryInput = z.infer<typeof patientQuerySchema>['query'];
export type BulkImportInput = z.infer<typeof bulkImportSchema>['body'];
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>['body'];
//# sourceMappingURL=patientValidator.d.ts.map