"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrController = void 0;
const ocrService_1 = require("../services/ocrService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
class OcrController {
}
exports.OcrController = OcrController;
_a = OcrController;
// POST /api/v1/ocr/scan
OcrController.scanDocument = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const file = req.file;
    if (!file)
        throw new errors_1.BadRequestError('Document file is required');
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await ocrService_1.OcrService.scanDocument(file, dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({
        success: true, status: 201, message: 'Document scanned', data: result,
    });
});
// POST /api/v1/ocr/prescription
OcrController.scanPrescription = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const file = req.file;
    if (!file)
        throw new errors_1.BadRequestError('Prescription image is required');
    const { patientId } = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await ocrService_1.OcrService.scanPrescription(file, patientId, userId);
    res.status(201).json({
        success: true, status: 201, message: 'Prescription scanned', data: result,
    });
});
// PATCH /api/v1/ocr/:id/verify
OcrController.verifyData = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await ocrService_1.OcrService.verifyOcrData(id, dto, userId);
    res.status(200).json({
        success: true, status: 200, message: 'OCR data verified', data: result,
    });
});
// GET /api/v1/ocr/results
OcrController.listResults = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await ocrService_1.OcrService.listOcrResults(query);
    res.status(200).json({
        success: true, status: 200, data: result.documents, pagination: result.pagination,
    });
});
// GET /api/v1/ocr/stats
OcrController.stats = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const stats = await ocrService_1.OcrService.getOcrStats();
    res.status(200).json({ success: true, status: 200, data: stats });
});
//# sourceMappingURL=ocrController.js.map