import { z } from 'zod';

export const addInventoryItemSchema = z.object({
  body: z.object({
    drugName: z.string({
      required_error: 'Drug name is required',
    }).min(1).max(200),

    genericName: z.string().max(200).optional().nullable(),
    category: z.string().max(100).optional().nullable(),
    manufacturer: z.string().max(200).optional().nullable(),

    batchNumber: z.string({
      required_error: 'Batch number is required',
    }).min(1).max(50),

    expiryDate: z.string({
      required_error: 'Expiry date is required',
    }).refine((date) => new Date(date) > new Date(), {
      message: 'Expiry date must be in the future',
    }),

    quantity: z.number({
      required_error: 'Quantity is required',
    }).min(0, 'Quantity cannot be negative'),

    unit: z.string().max(20).optional().default('tablets'),

    unitPrice: z.number().min(0).optional().default(0),
    sellingPrice: z.number().min(0).optional().default(0),

    reorderLevel: z.number().min(0).optional().default(10),

    organizationId: z.string().cuid().optional().nullable(),
    branchId: z.string().cuid().optional().nullable(),

    storageConditions: z.string().max(200).optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
    requiresPrescription: z.boolean().optional().default(true),
    isControlled: z.boolean().optional().default(false),
    ndcCode: z.string().max(20).optional().nullable(),
  }),
});

export const updateInventoryItemSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid inventory ID'),
  }),
  body: z.object({
    drugName: z.string().min(1).max(200).optional(),
    genericName: z.string().max(200).optional().nullable(),
    category: z.string().max(100).optional().nullable(),
    manufacturer: z.string().max(200).optional().nullable(),
    batchNumber: z.string().max(50).optional(),
    expiryDate: z.string().optional(),
    quantity: z.number().min(0).optional(),
    unit: z.string().max(20).optional(),
    unitPrice: z.number().min(0).optional(),
    sellingPrice: z.number().min(0).optional(),
    reorderLevel: z.number().min(0).optional(),
    storageConditions: z.string().max(200).optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const stockInSchema = z.object({
  body: z.object({
    inventoryId: z.string().cuid('Invalid inventory ID'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    batchNumber: z.string().max(50).optional().nullable(),
    expiryDate: z.string().optional().nullable(),
    unitPrice: z.number().min(0).optional(),
    supplierName: z.string().max(200).optional().nullable(),
    invoiceNumber: z.string().max(50).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  }),
});

export const stockOutSchema = z.object({
  body: z.object({
    inventoryId: z.string().cuid('Invalid inventory ID'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    reason: z.enum([
      'DISPENSED', 'EXPIRED', 'DAMAGED', 'RETURNED', 'TRANSFERRED', 'ADJUSTMENT', 'OTHER',
    ]),
    prescriptionId: z.string().cuid().optional().nullable(),
    patientId: z.string().cuid().optional().nullable(),
    dispensedTo: z.string().max(200).optional().nullable(),
    dispensedBy: z.string().max(200).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  }),
});

export const dispenseMedicationSchema = z.object({
  body: z.object({
    prescriptionId: z.string().cuid('Invalid prescription ID'),
    inventoryId: z.string().cuid('Invalid inventory ID'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    patientId: z.string().cuid('Invalid patient ID'),
    notes: z.string().max(500).optional().nullable(),
  }),
});

export const inventoryIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid inventory ID'),
  }),
});

export const inventoryQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
    search: z.string().max(200).optional(),
    category: z.string().optional(),
    manufacturer: z.string().optional(),
    isActive: z.string().transform((v) => v === 'true').optional(),
    lowStock: z.string().transform((v) => v === 'true').optional(),
    expiringSoon: z.string().transform((v) => v === 'true').optional(),
    isControlled: z.string().transform((v) => v === 'true').optional(),
    organizationId: z.string().cuid().optional(),
    branchId: z.string().cuid().optional(),
    sortBy: z.enum(['drugName', 'quantity', 'expiryDate', 'createdAt', 'sellingPrice']).optional().default('drugName'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});

export const stockMovementQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
    inventoryId: z.string().cuid().optional(),
    type: z.enum(['IN', 'OUT']).optional(),
    reason: z.enum(['DISPENSED', 'EXPIRED', 'DAMAGED', 'RETURNED', 'TRANSFERRED', 'ADJUSTMENT', 'OTHER']).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    organizationId: z.string().cuid().optional(),
  }),
});

export type AddInventoryItemInput = z.infer<typeof addInventoryItemSchema>['body'];
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>['body'];
export type StockInInput = z.infer<typeof stockInSchema>['body'];
export type StockOutInput = z.infer<typeof stockOutSchema>['body'];
export type DispenseMedicationInput = z.infer<typeof dispenseMedicationSchema>['body'];
export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>['query'];
export type StockMovementQueryInput = z.infer<typeof stockMovementQuerySchema>['query'];