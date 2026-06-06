// ============================================
// INVENTORY DTOs
// ============================================

export interface AddInventoryItemDto {
  drugName: string;
  genericName?: string;
  category?: string;
  manufacturer?: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  sellingPrice: number;
  reorderLevel?: number;
  organizationId?: string;
  branchId?: string;
  storageConditions?: string;
  description?: string;
  requiresPrescription?: boolean;
  isControlled?: boolean;
  ndcCode?: string;
}

export interface UpdateInventoryItemDto {
  drugName?: string;
  genericName?: string;
  category?: string;
  manufacturer?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  sellingPrice?: number;
  reorderLevel?: number;
  storageConditions?: string;
  description?: string;
  isActive?: boolean;
}

export interface StockInDto {
  inventoryId: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: string;
  unitPrice?: number;
  supplierName?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface StockOutDto {
  inventoryId: string;
  quantity: number;
  reason: StockOutReason;
  prescriptionId?: string;
  patientId?: string;
  dispensedTo?: string;
  dispensedBy?: string;
  notes?: string;
}

export type StockOutReason = 
  | 'DISPENSED'
  | 'EXPIRED'
  | 'DAMAGED'
  | 'RETURNED'
  | 'TRANSFERRED'
  | 'ADJUSTMENT'
  | 'OTHER';

export interface InventoryQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  manufacturer?: string;
  isActive?: boolean;
  lowStock?: boolean;
  expiringSoon?: boolean;
  isControlled?: boolean;
  organizationId?: string;
  branchId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StockMovementQueryDto {
  page?: number;
  limit?: number;
  inventoryId?: string;
  type?: 'IN' | 'OUT';
  reason?: StockOutReason;
  dateFrom?: string;
  dateTo?: string;
  organizationId?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface InventoryItemResponse {
  id: string;
  drugName: string;
  genericName: string | null;
  category: string | null;
  manufacturer: string | null;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  storageConditions: string | null;
  description: string | null;
  requiresPrescription: boolean;
  isControlled: boolean;
  ndcCode: string | null;
  isActive: boolean;
  isLowStock: boolean;
  isExpiringSoon: boolean;
  isExpired: boolean;
  organizationId: string | null;
  branchId: string | null;
  organization: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryListResponse {
  items: InventoryItemResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StockMovementResponse {
  id: string;
  inventoryId: string;
  inventory: {
    drugName: string;
    batchNumber: string;
  };
  type: 'IN' | 'OUT';
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string | null;
  prescriptionId: string | null;
  patientId: string | null;
  patient: { firstName: string; lastName: string } | null;
  supplierName: string | null;
  invoiceNumber: string | null;
  dispensedTo: string | null;
  dispensedBy: string | null;
  notes: string | null;
  recordedBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface StockMovementListResponse {
  movements: StockMovementResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  expiredItems: number;
  expiringSoonItems: number;
  controlledSubstances: number;
  byCategory: Record<string, number>;
  topDispensed: Array<{ drugName: string; count: number }>;
  monthlyConsumption: Array<{ month: string; value: number }>;
  reorderRecommendations: ReorderRecommendation[];
}

export interface ReorderRecommendation {
  drugName: string;
  currentStock: number;
  reorderLevel: number;
  recommendedOrder: number;
  estimatedCost: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ExpiryAlert {
  drugName: string;
  batchNumber: string;
  expiryDate: string;
  daysUntilExpiry: number;
  quantity: number;
  value: number;
  action: 'DISPOSE' | 'DISCOUNT' | 'RETURN' | 'MONITOR';
}

export interface DispenseMedicationDto {
  prescriptionId: string;
  inventoryId: string;
  quantity: number;
  patientId: string;
  notes?: string;
}