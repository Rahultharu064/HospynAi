"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockMovementQuerySchema = exports.inventoryQuerySchema = exports.inventoryIdSchema = exports.dispenseMedicationSchema = exports.stockOutSchema = exports.stockInSchema = exports.updateInventoryItemSchema = exports.addInventoryItemSchema = void 0;
const zod_1 = require("zod");
exports.addInventoryItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        drugName: zod_1.z.string({
            required_error: 'Drug name is required',
        }).min(1).max(200),
        genericName: zod_1.z.string().max(200).optional().nullable(),
        category: zod_1.z.string().max(100).optional().nullable(),
        manufacturer: zod_1.z.string().max(200).optional().nullable(),
        batchNumber: zod_1.z.string({
            required_error: 'Batch number is required',
        }).min(1).max(50),
        expiryDate: zod_1.z.string({
            required_error: 'Expiry date is required',
        }).refine((date) => new Date(date) > new Date(), {
            message: 'Expiry date must be in the future',
        }),
        quantity: zod_1.z.number({
            required_error: 'Quantity is required',
        }).min(0, 'Quantity cannot be negative'),
        unit: zod_1.z.string().max(20).optional().default('tablets'),
        unitPrice: zod_1.z.number().min(0).optional().default(0),
        sellingPrice: zod_1.z.number().min(0).optional().default(0),
        reorderLevel: zod_1.z.number().min(0).optional().default(10),
        organizationId: zod_1.z.string().cuid().optional().nullable(),
        branchId: zod_1.z.string().cuid().optional().nullable(),
        storageConditions: zod_1.z.string().max(200).optional().nullable(),
        description: zod_1.z.string().max(1000).optional().nullable(),
        requiresPrescription: zod_1.z.boolean().optional().default(true),
        isControlled: zod_1.z.boolean().optional().default(false),
        ndcCode: zod_1.z.string().max(20).optional().nullable(),
    }),
});
exports.updateInventoryItemSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid inventory ID'),
    }),
    body: zod_1.z.object({
        drugName: zod_1.z.string().min(1).max(200).optional(),
        genericName: zod_1.z.string().max(200).optional().nullable(),
        category: zod_1.z.string().max(100).optional().nullable(),
        manufacturer: zod_1.z.string().max(200).optional().nullable(),
        batchNumber: zod_1.z.string().max(50).optional(),
        expiryDate: zod_1.z.string().optional(),
        quantity: zod_1.z.number().min(0).optional(),
        unit: zod_1.z.string().max(20).optional(),
        unitPrice: zod_1.z.number().min(0).optional(),
        sellingPrice: zod_1.z.number().min(0).optional(),
        reorderLevel: zod_1.z.number().min(0).optional(),
        storageConditions: zod_1.z.string().max(200).optional().nullable(),
        description: zod_1.z.string().max(1000).optional().nullable(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
exports.stockInSchema = zod_1.z.object({
    body: zod_1.z.object({
        inventoryId: zod_1.z.string().cuid('Invalid inventory ID'),
        quantity: zod_1.z.number().min(1, 'Quantity must be at least 1'),
        batchNumber: zod_1.z.string().max(50).optional().nullable(),
        expiryDate: zod_1.z.string().optional().nullable(),
        unitPrice: zod_1.z.number().min(0).optional(),
        supplierName: zod_1.z.string().max(200).optional().nullable(),
        invoiceNumber: zod_1.z.string().max(50).optional().nullable(),
        notes: zod_1.z.string().max(500).optional().nullable(),
    }),
});
exports.stockOutSchema = zod_1.z.object({
    body: zod_1.z.object({
        inventoryId: zod_1.z.string().cuid('Invalid inventory ID'),
        quantity: zod_1.z.number().min(1, 'Quantity must be at least 1'),
        reason: zod_1.z.enum([
            'DISPENSED', 'EXPIRED', 'DAMAGED', 'RETURNED', 'TRANSFERRED', 'ADJUSTMENT', 'OTHER',
        ]),
        prescriptionId: zod_1.z.string().cuid().optional().nullable(),
        patientId: zod_1.z.string().cuid().optional().nullable(),
        dispensedTo: zod_1.z.string().max(200).optional().nullable(),
        dispensedBy: zod_1.z.string().max(200).optional().nullable(),
        notes: zod_1.z.string().max(500).optional().nullable(),
    }),
});
exports.dispenseMedicationSchema = zod_1.z.object({
    body: zod_1.z.object({
        prescriptionId: zod_1.z.string().cuid('Invalid prescription ID'),
        inventoryId: zod_1.z.string().cuid('Invalid inventory ID'),
        quantity: zod_1.z.number().min(1, 'Quantity must be at least 1'),
        patientId: zod_1.z.string().cuid('Invalid patient ID'),
        notes: zod_1.z.string().max(500).optional().nullable(),
    }),
});
exports.inventoryIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid inventory ID'),
    }),
});
exports.inventoryQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('20'),
        search: zod_1.z.string().max(200).optional(),
        category: zod_1.z.string().optional(),
        manufacturer: zod_1.z.string().optional(),
        isActive: zod_1.z.string().transform((v) => v === 'true').optional(),
        lowStock: zod_1.z.string().transform((v) => v === 'true').optional(),
        expiringSoon: zod_1.z.string().transform((v) => v === 'true').optional(),
        isControlled: zod_1.z.string().transform((v) => v === 'true').optional(),
        organizationId: zod_1.z.string().cuid().optional(),
        branchId: zod_1.z.string().cuid().optional(),
        sortBy: zod_1.z.enum(['drugName', 'quantity', 'expiryDate', 'createdAt', 'sellingPrice']).optional().default('drugName'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
    }),
});
exports.stockMovementQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('20'),
        inventoryId: zod_1.z.string().cuid().optional(),
        type: zod_1.z.enum(['IN', 'OUT']).optional(),
        reason: zod_1.z.enum(['DISPENSED', 'EXPIRED', 'DAMAGED', 'RETURNED', 'TRANSFERRED', 'ADJUSTMENT', 'OTHER']).optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        organizationId: zod_1.z.string().cuid().optional(),
    }),
});
//# sourceMappingURL=inventoryValidators.js.map