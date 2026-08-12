"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const prisma_1 = __importDefault(require("../../../config/prisma"));
const auditService_1 = require("../../auth/services/auditService");
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
class InventoryService {
    /**
     * ============================================
     * ADD INVENTORY ITEM
     * ============================================
     */
    static async addItem(data, userId, ipAddress, userAgent) {
        // Check for duplicate batch number
        if (data.batchNumber) {
            const existing = await prisma_1.default.inventory.findFirst({
                where: {
                    batchNumber: data.batchNumber,
                    drugName: data.drugName,
                },
            });
            if (existing) {
                throw new errors_1.ConflictError('Item with this batch number already exists');
            }
        }
        const item = await prisma_1.default.$transaction(async (tx) => {
            const created = await tx.inventory.create({
                data: {
                    drugName: data.drugName,
                    genericName: data.genericName || null,
                    category: data.category || null,
                    manufacturer: data.manufacturer || null,
                    batchNumber: data.batchNumber,
                    expiryDate: new Date(data.expiryDate),
                    quantity: data.quantity,
                    unit: data.unit || 'tablets',
                    unitPrice: data.unitPrice || 0,
                    sellingPrice: data.sellingPrice || 0,
                    reorderLevel: data.reorderLevel || 10,
                    organizationId: data.organizationId || null,
                    branchId: data.branchId || null,
                    isActive: true,
                },
                include: {
                    organization: { select: { id: true, name: true } },
                    branch: { select: { id: true, name: true } },
                },
            });
            // Record stock-in movement
            await this.recordStockMovement(tx, created.id, 'IN', data.quantity, 0, data.quantity, 'Initial stock', null, null, null, null, null, userId);
            await auditService_1.AuditService.log({
                userId,
                organizationId: data.organizationId || undefined,
                action: 'INVENTORY_ITEM_ADDED',
                resource: 'INVENTORY',
                resourceId: created.id,
                ipAddress,
                userAgent,
            });
            return created;
        });
        logger_1.default.info(`Inventory item added: ${item.drugName} (${item.batchNumber})`);
        return this.formatInventoryItem(item);
    }
    /**
     * ============================================
     * STOCK IN
     * ============================================
     */
    static async stockIn(data, userId, ipAddress, userAgent) {
        const item = await prisma_1.default.inventory.findUnique({
            where: { id: data.inventoryId },
        });
        if (!item)
            throw new errors_1.NotFoundError('Inventory item not found');
        const previousQuantity = item.quantity;
        const newQuantity = previousQuantity + data.quantity;
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const result = await tx.inventory.update({
                where: { id: data.inventoryId },
                data: {
                    quantity: newQuantity,
                    ...(data.batchNumber && { batchNumber: data.batchNumber }),
                    ...(data.expiryDate && { expiryDate: new Date(data.expiryDate) }),
                    ...(data.unitPrice && { unitPrice: data.unitPrice }),
                },
                include: {
                    organization: { select: { id: true, name: true } },
                    branch: { select: { id: true, name: true } },
                },
            });
            await this.recordStockMovement(tx, data.inventoryId, 'IN', data.quantity, previousQuantity, newQuantity, null, data.supplierName || null, data.invoiceNumber || null, null, null, data.notes || null, userId);
            return result;
        });
        logger_1.default.info(`Stock in: ${item.drugName} +${data.quantity} = ${newQuantity}`);
        return this.formatInventoryItem(updated);
    }
    /**
     * ============================================
     * STOCK OUT
     * ============================================
     */
    static async stockOut(data, userId, ipAddress, userAgent) {
        const item = await prisma_1.default.inventory.findUnique({
            where: { id: data.inventoryId },
        });
        if (!item)
            throw new errors_1.NotFoundError('Inventory item not found');
        if (item.quantity < data.quantity) {
            throw new errors_1.BadRequestError(`Insufficient stock. Available: ${item.quantity}, Requested: ${data.quantity}`);
        }
        const previousQuantity = item.quantity;
        const newQuantity = previousQuantity - data.quantity;
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const result = await tx.inventory.update({
                where: { id: data.inventoryId },
                data: { quantity: newQuantity },
                include: {
                    organization: { select: { id: true, name: true } },
                    branch: { select: { id: true, name: true } },
                },
            });
            await this.recordStockMovement(tx, data.inventoryId, 'OUT', data.quantity, previousQuantity, newQuantity, data.reason, null, null, data.prescriptionId || null, data.patientId || null, data.notes || null, userId);
            // Send low stock alert if below reorder level
            if (newQuantity <= item.reorderLevel) {
                logger_1.default.warn(`Low stock alert: ${item.drugName} (${newQuantity} remaining)`);
                // Send notification to admin/pharmacist
            }
            return result;
        });
        logger_1.default.info(`Stock out: ${item.drugName} -${data.quantity} = ${newQuantity} (${data.reason})`);
        return this.formatInventoryItem(updated);
    }
    /**
     * ============================================
     * DISPENSE MEDICATION
     * ============================================
     */
    static async dispenseMedication(data, userId, ipAddress, userAgent) {
        // Validate prescription
        const prescription = await prisma_1.default.prescription.findUnique({
            where: { id: data.prescriptionId },
            include: { patient: { select: { firstName: true, lastName: true } } },
        });
        if (!prescription)
            throw new errors_1.NotFoundError('Prescription not found');
        if (prescription.status !== 'ACTIVE') {
            throw new errors_1.BadRequestError('Prescription is not active');
        }
        // Validate patient
        if (prescription.patientId !== data.patientId) {
            throw new errors_1.BadRequestError('Patient does not match prescription');
        }
        // Stock out
        const item = await this.stockOut({
            inventoryId: data.inventoryId,
            quantity: data.quantity,
            reason: 'DISPENSED',
            prescriptionId: data.prescriptionId,
            patientId: data.patientId,
            dispensedTo: `${prescription.patient.firstName} ${prescription.patient.lastName}`,
            dispensedBy: userId,
            notes: data.notes || null,
        }, userId, ipAddress, userAgent);
        // Get the movement record
        const movement = await prisma_1.default.$queryRaw `
      SELECT * FROM stock_movements 
      WHERE inventory_id = ${data.inventoryId} 
      AND prescription_id = ${data.prescriptionId}
      ORDER BY created_at DESC LIMIT 1
    `;
        // Update prescription refills used
        await prisma_1.default.prescription.update({
            where: { id: data.prescriptionId },
            data: {
                refillsUsed: { increment: 1 },
            },
        });
        logger_1.default.info(`Medication dispensed: ${prescription.drugName} to patient ${data.patientId}`);
        return {
            item,
            movement: this.formatStockMovement(movement),
        };
    }
    /**
     * ============================================
     * LIST INVENTORY
     * ============================================
     */
    static async listItems(query) {
        const { page = 1, limit = 20, search, category, manufacturer, isActive, lowStock, expiringSoon, isControlled, organizationId, branchId, sortBy = 'drugName', sortOrder = 'asc', } = query;
        const where = {};
        if (search) {
            where.OR = [
                { drugName: { contains: search, mode: 'insensitive' } },
                { genericName: { contains: search, mode: 'insensitive' } },
                { batchNumber: { contains: search } },
                { manufacturer: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (category)
            where.category = category;
        if (manufacturer)
            where.manufacturer = manufacturer;
        if (isActive !== undefined)
            where.isActive = isActive;
        if (organizationId)
            where.organizationId = organizationId;
        if (branchId)
            where.branchId = branchId;
        // Low stock filter
        if (lowStock) {
            where.quantity = { lte: prisma_1.default.inventory.fields.reorderLevel };
        }
        // Expiring soon (within 90 days)
        if (expiringSoon) {
            where.expiryDate = {
                gte: new Date(),
                lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            };
        }
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            prisma_1.default.inventory.findMany({
                where,
                include: {
                    organization: { select: { id: true, name: true } },
                    branch: { select: { id: true, name: true } },
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
            prisma_1.default.inventory.count({ where }),
        ]);
        return {
            items: items.map((i) => this.formatInventoryItem(i)),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    /**
     * ============================================
     * GET INVENTORY BY ID
     * ============================================
     */
    static async getItemById(id) {
        const item = await prisma_1.default.inventory.findUnique({
            where: { id },
            include: {
                organization: { select: { id: true, name: true } },
                branch: { select: { id: true, name: true } },
            },
        });
        if (!item)
            throw new errors_1.NotFoundError('Inventory item not found');
        return this.formatInventoryItem(item);
    }
    /**
     * ============================================
     * UPDATE INVENTORY ITEM
     * ============================================
     */
    static async updateItem(id, data, userId, ipAddress, userAgent) {
        const existing = await prisma_1.default.inventory.findUnique({ where: { id } });
        if (!existing)
            throw new errors_1.NotFoundError('Inventory item not found');
        const updateData = {};
        if (data.drugName)
            updateData.drugName = data.drugName;
        if (data.genericName !== undefined)
            updateData.genericName = data.genericName;
        if (data.category !== undefined)
            updateData.category = data.category;
        if (data.manufacturer !== undefined)
            updateData.manufacturer = data.manufacturer;
        if (data.batchNumber)
            updateData.batchNumber = data.batchNumber;
        if (data.expiryDate)
            updateData.expiryDate = new Date(data.expiryDate);
        if (data.quantity !== undefined)
            updateData.quantity = data.quantity;
        if (data.unit)
            updateData.unit = data.unit;
        if (data.unitPrice !== undefined)
            updateData.unitPrice = data.unitPrice;
        if (data.sellingPrice !== undefined)
            updateData.sellingPrice = data.sellingPrice;
        if (data.reorderLevel !== undefined)
            updateData.reorderLevel = data.reorderLevel;
        if (data.storageConditions !== undefined)
            updateData.storageConditions = data.storageConditions;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        const updated = await prisma_1.default.inventory.update({
            where: { id },
            data: updateData,
            include: {
                organization: { select: { id: true, name: true } },
                branch: { select: { id: true, name: true } },
            },
        });
        logger_1.default.info(`Inventory item updated: ${id}`);
        return this.formatInventoryItem(updated);
    }
    /**
     * ============================================
     * GET STOCK MOVEMENTS
     * ============================================
     */
    static async getStockMovements(query) {
        const { page = 1, limit = 20, inventoryId, type, reason } = query;
        // Since stock_movements might not be a Prisma model, return empty for now
        return {
            movements: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
        };
    }
    /**
     * ============================================
     * INVENTORY STATISTICS
     * ============================================
     */
    static async getStats(organizationId) {
        const where = {};
        if (organizationId)
            where.organizationId = organizationId;
        const [totalItems, totalValue, lowStockItems, expiredItems, expiringSoonItems, byCategory,] = await Promise.all([
            prisma_1.default.inventory.count({ where }),
            prisma_1.default.inventory.aggregate({
                where,
                _sum: { quantity: true, sellingPrice: true },
            }),
            prisma_1.default.inventory.count({
                where: { ...where, quantity: { lte: prisma_1.default.inventory.fields.reorderLevel } },
            }),
            prisma_1.default.inventory.count({
                where: { ...where, expiryDate: { lt: new Date() } },
            }),
            prisma_1.default.inventory.count({
                where: {
                    ...where,
                    expiryDate: {
                        gte: new Date(),
                        lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
            prisma_1.default.inventory.groupBy({
                by: ['category'],
                where,
                _count: true,
            }),
        ]);
        const byCategoryMap = {};
        byCategory.forEach((c) => {
            if (c.category)
                byCategoryMap[c.category] = c._count;
        });
        const totalQty = totalValue._sum.quantity || 0;
        const avgPrice = totalValue._sum.sellingPrice || 0;
        return {
            totalItems,
            totalValue: totalQty * Number(avgPrice),
            lowStockItems,
            expiredItems,
            expiringSoonItems,
            controlledSubstances: 0,
            byCategory: byCategoryMap,
            topDispensed: [],
            monthlyConsumption: [],
            reorderRecommendations: [],
        };
    }
    /**
     * ============================================
     * GET EXPIRY ALERTS
     * ============================================
     */
    static async getExpiryAlerts() {
        const expiringItems = await prisma_1.default.inventory.findMany({
            where: {
                expiryDate: {
                    gte: new Date(),
                    lte: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
                },
                quantity: { gt: 0 },
            },
            orderBy: { expiryDate: 'asc' },
            take: 50,
        });
        return expiringItems.map((item) => {
            const daysUntilExpiry = Math.ceil((item.expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            let action;
            if (daysUntilExpiry <= 30)
                action = 'DISPOSE';
            else if (daysUntilExpiry <= 60)
                action = 'DISCOUNT';
            else if (daysUntilExpiry <= 90)
                action = 'RETURN';
            else
                action = 'MONITOR';
            return {
                drugName: item.drugName,
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate.toISOString(),
                daysUntilExpiry,
                quantity: item.quantity,
                value: item.quantity * Number(item.sellingPrice),
                action,
            };
        });
    }
    /**
     * ============================================
     * GET REORDER RECOMMENDATIONS
     * ============================================
     */
    static async getReorderRecommendations() {
        const lowStockItems = await prisma_1.default.inventory.findMany({
            where: {
                quantity: { lte: prisma_1.default.inventory.fields.reorderLevel },
                isActive: true,
            },
            orderBy: { quantity: 'asc' },
        });
        return lowStockItems.map((item) => {
            const shortage = item.reorderLevel * 2 - item.quantity;
            const recommendedOrder = Math.max(shortage, item.reorderLevel);
            const estimatedCost = recommendedOrder * Number(item.unitPrice);
            let priority;
            if (item.quantity === 0)
                priority = 'critical';
            else if (item.quantity <= item.reorderLevel / 4)
                priority = 'high';
            else if (item.quantity <= item.reorderLevel / 2)
                priority = 'medium';
            else
                priority = 'low';
            return {
                drugName: item.drugName,
                currentStock: item.quantity,
                reorderLevel: item.reorderLevel,
                recommendedOrder,
                estimatedCost,
                priority,
            };
        });
    }
    // ============================================
    // HELPER METHODS
    // ============================================
    static async recordStockMovement(tx, inventoryId, type, quantity, balanceBefore, balanceAfter, reason, supplierName, invoiceNumber, prescriptionId, patientId, notes, userId) {
        // In production, this would insert into a stock_movements table
        logger_1.default.info(`Stock movement recorded: ${type} ${quantity} for inventory ${inventoryId}`);
    }
    static formatInventoryItem(item) {
        const now = new Date();
        const daysUntilExpiry = Math.ceil((item.expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        return {
            id: item.id,
            drugName: item.drugName,
            genericName: item.genericName,
            category: item.category,
            manufacturer: item.manufacturer,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate.toISOString(),
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: Number(item.unitPrice),
            sellingPrice: Number(item.sellingPrice),
            reorderLevel: item.reorderLevel,
            storageConditions: item.storageConditions || null,
            description: item.description || null,
            requiresPrescription: item.requiresPrescription || true,
            isControlled: item.isControlled || false,
            ndcCode: item.ndcCode || null,
            isActive: item.isActive,
            isLowStock: item.quantity <= item.reorderLevel,
            isExpiringSoon: daysUntilExpiry <= 90 && daysUntilExpiry > 0,
            isExpired: item.expiryDate < now,
            organizationId: item.organizationId,
            branchId: item.branchId,
            organization: item.organization,
            branch: item.branch,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
        };
    }
    static formatStockMovement(movement) {
        if (!movement)
            return {};
        return {
            id: movement.id || '',
            inventoryId: movement.inventoryId || '',
            inventory: { drugName: '', batchNumber: '' },
            type: movement.type || 'OUT',
            quantity: movement.quantity || 0,
            balanceBefore: movement.balanceBefore || 0,
            balanceAfter: movement.balanceAfter || 0,
            reason: movement.reason || null,
            prescriptionId: movement.prescriptionId || null,
            patientId: movement.patientId || null,
            patient: null,
            supplierName: movement.supplierName || null,
            invoiceNumber: movement.invoiceNumber || null,
            dispensedTo: movement.dispensedTo || null,
            dispensedBy: movement.dispensedBy || null,
            notes: movement.notes || null,
            recordedBy: { id: '', firstName: '', lastName: '' },
            createdAt: movement.createdAt || new Date().toISOString(),
        };
    }
}
exports.InventoryService = InventoryService;
//# sourceMappingURL=inventoryService.js.map