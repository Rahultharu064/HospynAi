"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainController = void 0;
const blockchainService_1 = require("../services/blockchainService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
class BlockchainController {
}
exports.BlockchainController = BlockchainController;
_a = BlockchainController;
// POST /api/v1/blockchain/hash
BlockchainController.anchorHash = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const record = await blockchainService_1.BlockchainService.anchorRecord(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({
        success: true, status: 201, message: 'Record anchored on blockchain', data: record,
    });
});
// POST /api/v1/blockchain/verify
BlockchainController.verify = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const result = await blockchainService_1.BlockchainService.verifyRecord(dto);
    res.status(200).json({
        success: true, status: 200,
        message: result.isVerified ? 'Record verified' : 'Verification failed',
        data: result,
    });
});
// GET /api/v1/blockchain/records
BlockchainController.listRecords = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await blockchainService_1.BlockchainService.listRecords(query);
    res.status(200).json({
        success: true, status: 200,
        data: result.records, pagination: result.pagination,
    });
});
// GET /api/v1/blockchain/records/:id
BlockchainController.getRecord = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const result = await blockchainService_1.BlockchainService.verifyRecord({ recordId: id });
    res.status(200).json({ success: true, status: 200, data: result });
});
// GET /api/v1/blockchain/logs/:patientId
BlockchainController.getPatientLogs = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { patientId } = req.params;
    const records = await blockchainService_1.BlockchainService.getPatientAuditTrail(patientId);
    res.status(200).json({ success: true, status: 200, data: records });
});
// GET /api/v1/blockchain/stats
BlockchainController.stats = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const stats = await blockchainService_1.BlockchainService.getStats();
    res.status(200).json({ success: true, status: 200, data: stats });
});
// POST /api/v1/blockchain/consent
BlockchainController.grantConsent = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const consent = await blockchainService_1.BlockchainService.grantConsent(dto, userId);
    res.status(201).json({
        success: true, status: 201, message: 'Consent granted', data: consent,
    });
});
// POST /api/v1/blockchain/consent/:id/revoke
BlockchainController.revokeConsent = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const consent = await blockchainService_1.BlockchainService.revokeConsent(id, reason, userId);
    res.status(200).json({
        success: true, status: 200, message: 'Consent revoked', data: consent,
    });
});
//# sourceMappingURL=blockchainController.js.map