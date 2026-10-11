export interface InventoryItem {
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
  isLowStock: boolean;
  isExpiringSoon: boolean;
  isExpired: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryListResponse {
  items: InventoryItem[];
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
  reorderRecommendations: Array<{
    drugName: string;
    currentStock: number;
    reorderLevel: number;
    recommendedOrder: number;
    estimatedCost: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
}
