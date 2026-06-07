import { z } from 'zod';
export declare const addInventoryItemSchema: z.ZodObject<{
    body: z.ZodObject<{
        drugName: z.ZodString;
        genericName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        category: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        manufacturer: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        batchNumber: z.ZodString;
        expiryDate: z.ZodEffects<z.ZodString, string, string>;
        quantity: z.ZodNumber;
        unit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        unitPrice: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        sellingPrice: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        reorderLevel: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        organizationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        branchId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        storageConditions: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        requiresPrescription: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        isControlled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        ndcCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        drugName: string;
        quantity: number;
        isControlled: boolean;
        batchNumber: string;
        expiryDate: string;
        unit: string;
        unitPrice: number;
        sellingPrice: number;
        reorderLevel: number;
        requiresPrescription: boolean;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        category?: string | null | undefined;
        description?: string | null | undefined;
        genericName?: string | null | undefined;
        manufacturer?: string | null | undefined;
        storageConditions?: string | null | undefined;
        ndcCode?: string | null | undefined;
    }, {
        drugName: string;
        quantity: number;
        batchNumber: string;
        expiryDate: string;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        category?: string | null | undefined;
        description?: string | null | undefined;
        genericName?: string | null | undefined;
        isControlled?: boolean | undefined;
        manufacturer?: string | null | undefined;
        unit?: string | undefined;
        unitPrice?: number | undefined;
        sellingPrice?: number | undefined;
        reorderLevel?: number | undefined;
        storageConditions?: string | null | undefined;
        requiresPrescription?: boolean | undefined;
        ndcCode?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        drugName: string;
        quantity: number;
        isControlled: boolean;
        batchNumber: string;
        expiryDate: string;
        unit: string;
        unitPrice: number;
        sellingPrice: number;
        reorderLevel: number;
        requiresPrescription: boolean;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        category?: string | null | undefined;
        description?: string | null | undefined;
        genericName?: string | null | undefined;
        manufacturer?: string | null | undefined;
        storageConditions?: string | null | undefined;
        ndcCode?: string | null | undefined;
    };
}, {
    body: {
        drugName: string;
        quantity: number;
        batchNumber: string;
        expiryDate: string;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        category?: string | null | undefined;
        description?: string | null | undefined;
        genericName?: string | null | undefined;
        isControlled?: boolean | undefined;
        manufacturer?: string | null | undefined;
        unit?: string | undefined;
        unitPrice?: number | undefined;
        sellingPrice?: number | undefined;
        reorderLevel?: number | undefined;
        storageConditions?: string | null | undefined;
        requiresPrescription?: boolean | undefined;
        ndcCode?: string | null | undefined;
    };
}>;
export declare const updateInventoryItemSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        drugName: z.ZodOptional<z.ZodString>;
        genericName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        category: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        manufacturer: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        batchNumber: z.ZodOptional<z.ZodString>;
        expiryDate: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
        unitPrice: z.ZodOptional<z.ZodNumber>;
        sellingPrice: z.ZodOptional<z.ZodNumber>;
        reorderLevel: z.ZodOptional<z.ZodNumber>;
        storageConditions: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        category?: string | null | undefined;
        description?: string | null | undefined;
        isActive?: boolean | undefined;
        drugName?: string | undefined;
        genericName?: string | null | undefined;
        quantity?: number | undefined;
        manufacturer?: string | null | undefined;
        batchNumber?: string | undefined;
        expiryDate?: string | undefined;
        unit?: string | undefined;
        unitPrice?: number | undefined;
        sellingPrice?: number | undefined;
        reorderLevel?: number | undefined;
        storageConditions?: string | null | undefined;
    }, {
        category?: string | null | undefined;
        description?: string | null | undefined;
        isActive?: boolean | undefined;
        drugName?: string | undefined;
        genericName?: string | null | undefined;
        quantity?: number | undefined;
        manufacturer?: string | null | undefined;
        batchNumber?: string | undefined;
        expiryDate?: string | undefined;
        unit?: string | undefined;
        unitPrice?: number | undefined;
        sellingPrice?: number | undefined;
        reorderLevel?: number | undefined;
        storageConditions?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        category?: string | null | undefined;
        description?: string | null | undefined;
        isActive?: boolean | undefined;
        drugName?: string | undefined;
        genericName?: string | null | undefined;
        quantity?: number | undefined;
        manufacturer?: string | null | undefined;
        batchNumber?: string | undefined;
        expiryDate?: string | undefined;
        unit?: string | undefined;
        unitPrice?: number | undefined;
        sellingPrice?: number | undefined;
        reorderLevel?: number | undefined;
        storageConditions?: string | null | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        category?: string | null | undefined;
        description?: string | null | undefined;
        isActive?: boolean | undefined;
        drugName?: string | undefined;
        genericName?: string | null | undefined;
        quantity?: number | undefined;
        manufacturer?: string | null | undefined;
        batchNumber?: string | undefined;
        expiryDate?: string | undefined;
        unit?: string | undefined;
        unitPrice?: number | undefined;
        sellingPrice?: number | undefined;
        reorderLevel?: number | undefined;
        storageConditions?: string | null | undefined;
    };
}>;
export declare const stockInSchema: z.ZodObject<{
    body: z.ZodObject<{
        inventoryId: z.ZodString;
        quantity: z.ZodNumber;
        batchNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        expiryDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        unitPrice: z.ZodOptional<z.ZodNumber>;
        supplierName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        invoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        inventoryId: string;
        notes?: string | null | undefined;
        batchNumber?: string | null | undefined;
        expiryDate?: string | null | undefined;
        unitPrice?: number | undefined;
        supplierName?: string | null | undefined;
        invoiceNumber?: string | null | undefined;
    }, {
        quantity: number;
        inventoryId: string;
        notes?: string | null | undefined;
        batchNumber?: string | null | undefined;
        expiryDate?: string | null | undefined;
        unitPrice?: number | undefined;
        supplierName?: string | null | undefined;
        invoiceNumber?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        quantity: number;
        inventoryId: string;
        notes?: string | null | undefined;
        batchNumber?: string | null | undefined;
        expiryDate?: string | null | undefined;
        unitPrice?: number | undefined;
        supplierName?: string | null | undefined;
        invoiceNumber?: string | null | undefined;
    };
}, {
    body: {
        quantity: number;
        inventoryId: string;
        notes?: string | null | undefined;
        batchNumber?: string | null | undefined;
        expiryDate?: string | null | undefined;
        unitPrice?: number | undefined;
        supplierName?: string | null | undefined;
        invoiceNumber?: string | null | undefined;
    };
}>;
export declare const stockOutSchema: z.ZodObject<{
    body: z.ZodObject<{
        inventoryId: z.ZodString;
        quantity: z.ZodNumber;
        reason: z.ZodEnum<["DISPENSED", "EXPIRED", "DAMAGED", "RETURNED", "TRANSFERRED", "ADJUSTMENT", "OTHER"]>;
        prescriptionId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        patientId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        dispensedTo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        dispensedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        reason: "OTHER" | "EXPIRED" | "DISPENSED" | "DAMAGED" | "RETURNED" | "TRANSFERRED" | "ADJUSTMENT";
        quantity: number;
        inventoryId: string;
        patientId?: string | null | undefined;
        notes?: string | null | undefined;
        prescriptionId?: string | null | undefined;
        dispensedTo?: string | null | undefined;
        dispensedBy?: string | null | undefined;
    }, {
        reason: "OTHER" | "EXPIRED" | "DISPENSED" | "DAMAGED" | "RETURNED" | "TRANSFERRED" | "ADJUSTMENT";
        quantity: number;
        inventoryId: string;
        patientId?: string | null | undefined;
        notes?: string | null | undefined;
        prescriptionId?: string | null | undefined;
        dispensedTo?: string | null | undefined;
        dispensedBy?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        reason: "OTHER" | "EXPIRED" | "DISPENSED" | "DAMAGED" | "RETURNED" | "TRANSFERRED" | "ADJUSTMENT";
        quantity: number;
        inventoryId: string;
        patientId?: string | null | undefined;
        notes?: string | null | undefined;
        prescriptionId?: string | null | undefined;
        dispensedTo?: string | null | undefined;
        dispensedBy?: string | null | undefined;
    };
}, {
    body: {
        reason: "OTHER" | "EXPIRED" | "DISPENSED" | "DAMAGED" | "RETURNED" | "TRANSFERRED" | "ADJUSTMENT";
        quantity: number;
        inventoryId: string;
        patientId?: string | null | undefined;
        notes?: string | null | undefined;
        prescriptionId?: string | null | undefined;
        dispensedTo?: string | null | undefined;
        dispensedBy?: string | null | undefined;
    };
}>;
export declare const dispenseMedicationSchema: z.ZodObject<{
    body: z.ZodObject<{
        prescriptionId: z.ZodString;
        inventoryId: z.ZodString;
        quantity: z.ZodNumber;
        patientId: z.ZodString;
        notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        patientId: string;
        quantity: number;
        inventoryId: string;
        prescriptionId: string;
        notes?: string | null | undefined;
    }, {
        patientId: string;
        quantity: number;
        inventoryId: string;
        prescriptionId: string;
        notes?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        patientId: string;
        quantity: number;
        inventoryId: string;
        prescriptionId: string;
        notes?: string | null | undefined;
    };
}, {
    body: {
        patientId: string;
        quantity: number;
        inventoryId: string;
        prescriptionId: string;
        notes?: string | null | undefined;
    };
}>;
export declare const inventoryIdSchema: z.ZodObject<{
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
export declare const inventoryQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        search: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        manufacturer: z.ZodOptional<z.ZodString>;
        isActive: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
        lowStock: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
        expiringSoon: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
        isControlled: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
        organizationId: z.ZodOptional<z.ZodString>;
        branchId: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["drugName", "quantity", "expiryDate", "createdAt", "sellingPrice"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortBy: "createdAt" | "drugName" | "quantity" | "expiryDate" | "sellingPrice";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        category?: string | undefined;
        isActive?: boolean | undefined;
        isControlled?: boolean | undefined;
        manufacturer?: string | undefined;
        lowStock?: boolean | undefined;
        expiringSoon?: boolean | undefined;
    }, {
        search?: string | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        category?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        sortBy?: "createdAt" | "drugName" | "quantity" | "expiryDate" | "sellingPrice" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        isActive?: string | undefined;
        isControlled?: string | undefined;
        manufacturer?: string | undefined;
        lowStock?: string | undefined;
        expiringSoon?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortBy: "createdAt" | "drugName" | "quantity" | "expiryDate" | "sellingPrice";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        category?: string | undefined;
        isActive?: boolean | undefined;
        isControlled?: boolean | undefined;
        manufacturer?: string | undefined;
        lowStock?: boolean | undefined;
        expiringSoon?: boolean | undefined;
    };
}, {
    query: {
        search?: string | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        category?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        sortBy?: "createdAt" | "drugName" | "quantity" | "expiryDate" | "sellingPrice" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        isActive?: string | undefined;
        isControlled?: string | undefined;
        manufacturer?: string | undefined;
        lowStock?: string | undefined;
        expiringSoon?: string | undefined;
    };
}>;
export declare const stockMovementQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        inventoryId: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<["IN", "OUT"]>>;
        reason: z.ZodOptional<z.ZodEnum<["DISPENSED", "EXPIRED", "DAMAGED", "RETURNED", "TRANSFERRED", "ADJUSTMENT", "OTHER"]>>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        organizationId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        organizationId?: string | undefined;
        type?: "IN" | "OUT" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        reason?: "OTHER" | "EXPIRED" | "DISPENSED" | "DAMAGED" | "RETURNED" | "TRANSFERRED" | "ADJUSTMENT" | undefined;
        inventoryId?: string | undefined;
    }, {
        organizationId?: string | undefined;
        type?: "IN" | "OUT" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        reason?: "OTHER" | "EXPIRED" | "DISPENSED" | "DAMAGED" | "RETURNED" | "TRANSFERRED" | "ADJUSTMENT" | undefined;
        inventoryId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        organizationId?: string | undefined;
        type?: "IN" | "OUT" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        reason?: "OTHER" | "EXPIRED" | "DISPENSED" | "DAMAGED" | "RETURNED" | "TRANSFERRED" | "ADJUSTMENT" | undefined;
        inventoryId?: string | undefined;
    };
}, {
    query: {
        organizationId?: string | undefined;
        type?: "IN" | "OUT" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        reason?: "OTHER" | "EXPIRED" | "DISPENSED" | "DAMAGED" | "RETURNED" | "TRANSFERRED" | "ADJUSTMENT" | undefined;
        inventoryId?: string | undefined;
    };
}>;
export type AddInventoryItemInput = z.infer<typeof addInventoryItemSchema>['body'];
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>['body'];
export type StockInInput = z.infer<typeof stockInSchema>['body'];
export type StockOutInput = z.infer<typeof stockOutSchema>['body'];
export type DispenseMedicationInput = z.infer<typeof dispenseMedicationSchema>['body'];
export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>['query'];
export type StockMovementQueryInput = z.infer<typeof stockMovementQuerySchema>['query'];
//# sourceMappingURL=inventoryValidators.d.ts.map