
import { Request, Response } from 'express';
import { InventoryService } from '../services/inventoryService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import {
  AddInventoryItemInput, UpdateInventoryItemInput,
  StockInInput, StockOutInput, DispenseMedicationInput,
  InventoryQueryInput, StockMovementQueryInput,
} from '../validators/inventoryValidators';

export class InventoryController {
  // POST /api/v1/inventory
  static addItem = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: AddInventoryItemInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const item = await InventoryService.addItem(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: 'Item added', data: item });
  });

  // GET /api/v1/inventory
  static listItems = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: InventoryQueryInput = req.query as any;
    const result = await InventoryService.listItems(query);
    res.status(200).json({ success: true, status: 200, ...result });
  });

  // GET /api/v1/inventory/:id
  static getItem = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await InventoryService.getItemById(id);
    res.status(200).json({ success: true, status: 200, data: item });
  });

  // PATCH /api/v1/inventory/:id
  static updateItem = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto: UpdateInventoryItemInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const item = await InventoryService.updateItem(id, dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: 'Item updated', data: item });
  });

  // POST /api/v1/inventory/stock-in
  static stockIn = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: StockInInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const item = await InventoryService.stockIn(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: 'Stock added', data: item });
  });

  // POST /api/v1/inventory/stock-out
  static stockOut = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: StockOutInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const item = await InventoryService.stockOut(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: 'Stock removed', data: item });
  });

  // POST /api/v1/inventory/dispense
  static dispense = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: DispenseMedicationInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await InventoryService.dispenseMedication(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: 'Medication dispensed', data: result });
  });

  // GET /api/v1/inventory/stats
  static stats = AsyncHandler.handle(async (req: Request, res: Response) => {
    const organizationId = req.query.organizationId as string;
    const stats = await InventoryService.getStats(organizationId);
    res.status(200).json({ success: true, status: 200, data: stats });
  });

  // GET /api/v1/inventory/expiry-alerts
  static expiryAlerts = AsyncHandler.handle(async (req: Request, res: Response) => {
    const alerts = await InventoryService.getExpiryAlerts();
    res.status(200).json({ success: true, status: 200, data: alerts });
  });

  // GET /api/v1/inventory/reorder-recommendations
  static reorderRecommendations = AsyncHandler.handle(async (req: Request, res: Response) => {
    const recommendations = await InventoryService.getReorderRecommendations();
    res.status(200).json({ success: true, status: 200, data: recommendations });
  });

  // GET /api/v1/inventory/movements
  static movements = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: StockMovementQueryInput = req.query as any;
    const result = await InventoryService.getStockMovements(query);
    res.status(200).json({ success: true, status: 200, ...result });
  });
}