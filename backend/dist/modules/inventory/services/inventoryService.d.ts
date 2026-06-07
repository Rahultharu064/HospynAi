import { AddInventoryItemInput, UpdateInventoryItemInput, StockInInput, StockOutInput, DispenseMedicationInput, InventoryQueryInput, StockMovementQueryInput } from '../validators/inventoryValidators';
import { InventoryItemResponse, InventoryListResponse, StockMovementResponse, StockMovementListResponse, InventoryStats, ReorderRecommendation, ExpiryAlert } from '../../../types/inventoryTypes';
export declare class InventoryService {
    /**
     * ============================================
     * ADD INVENTORY ITEM
     * ============================================
     */
    static addItem(data: AddInventoryItemInput, userId: string, ipAddress: string, userAgent: string): Promise<InventoryItemResponse>;
    /**
     * ============================================
     * STOCK IN
     * ============================================
     */
    static stockIn(data: StockInInput, userId: string, ipAddress: string, userAgent: string): Promise<InventoryItemResponse>;
    /**
     * ============================================
     * STOCK OUT
     * ============================================
     */
    static stockOut(data: StockOutInput, userId: string, ipAddress: string, userAgent: string): Promise<InventoryItemResponse>;
    /**
     * ============================================
     * DISPENSE MEDICATION
     * ============================================
     */
    static dispenseMedication(data: DispenseMedicationInput, userId: string, ipAddress: string, userAgent: string): Promise<{
        item: InventoryItemResponse;
        movement: StockMovementResponse;
    }>;
    /**
     * ============================================
     * LIST INVENTORY
     * ============================================
     */
    static listItems(query: InventoryQueryInput): Promise<InventoryListResponse>;
    /**
     * ============================================
     * GET INVENTORY BY ID
     * ============================================
     */
    static getItemById(id: string): Promise<InventoryItemResponse>;
    /**
     * ============================================
     * UPDATE INVENTORY ITEM
     * ============================================
     */
    static updateItem(id: string, data: UpdateInventoryItemInput, userId: string, ipAddress: string, userAgent: string): Promise<InventoryItemResponse>;
    /**
     * ============================================
     * GET STOCK MOVEMENTS
     * ============================================
     */
    static getStockMovements(query: StockMovementQueryInput): Promise<StockMovementListResponse>;
    /**
     * ============================================
     * INVENTORY STATISTICS
     * ============================================
     */
    static getStats(organizationId?: string): Promise<InventoryStats>;
    /**
     * ============================================
     * GET EXPIRY ALERTS
     * ============================================
     */
    static getExpiryAlerts(): Promise<ExpiryAlert[]>;
    /**
     * ============================================
     * GET REORDER RECOMMENDATIONS
     * ============================================
     */
    static getReorderRecommendations(): Promise<ReorderRecommendation[]>;
    private static recordStockMovement;
    private static formatInventoryItem;
    private static formatStockMovement;
}
//# sourceMappingURL=inventoryService.d.ts.map