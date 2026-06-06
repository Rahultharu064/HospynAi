import { Request, Response } from 'express';
import { OcrService } from '../services/ocrService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import {
  ScanDocumentInput,
  VerifyOcrDataInput,
  OcrQueryInput,
} from '../validators/ocrValidators';

export class OcrController {
  // POST /api/v1/ocr/scan
  static scanDocument = AsyncHandler.handle(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) throw new BadRequestError('Document file is required');

    const dto: ScanDocumentInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await OcrService.scanDocument(
      file, dto, userId, req.ip || '', req.headers['user-agent'] || ''
    );

    res.status(201).json({
      success: true, status: 201, message: 'Document scanned', data: result,
    });
  });

  // POST /api/v1/ocr/prescription
  static scanPrescription = AsyncHandler.handle(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) throw new BadRequestError('Prescription image is required');

    const { patientId } = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await OcrService.scanPrescription(file, patientId, userId);

    res.status(201).json({
      success: true, status: 201, message: 'Prescription scanned', data: result,
    });
  });

  // PATCH /api/v1/ocr/:id/verify
  static verifyData = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto: VerifyOcrDataInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await OcrService.verifyOcrData(id, dto, userId);

    res.status(200).json({
      success: true, status: 200, message: 'OCR data verified', data: result,
    });
  });

  // GET /api/v1/ocr/results
  static listResults = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: OcrQueryInput = req.query as any;
    const result = await OcrService.listOcrResults(query);

    res.status(200).json({
      success: true, status: 200, data: result.documents, pagination: result.pagination,
    });
  });

  // GET /api/v1/ocr/stats
  static stats = AsyncHandler.handle(async (req: Request, res: Response) => {
    const stats = await OcrService.getOcrStats();

    res.status(200).json({ success: true, status: 200, data: stats });
  });
}