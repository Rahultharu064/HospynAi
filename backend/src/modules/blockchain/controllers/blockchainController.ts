import { Request, Response } from 'express';
import { BlockchainService } from '../services/blockchainService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { UnauthorizedError } from '../../../utils/errors';
import {
  AnchorRecordInput,
  VerifyRecordInput,
  BlockchainQueryInput,
  ConsentInput,
  RevokeConsentInput,
} from '../validators/blockchainValidators';

export class BlockchainController {
  // POST /api/v1/blockchain/hash
  static anchorHash = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: AnchorRecordInput = req.body;
    const userId = (req.user as any)?.userId;
    if (!userId) throw new UnauthorizedError();

    const record = await BlockchainService.anchorRecord(
      dto, userId, req.ip || '', req.headers['user-agent'] || ''
    );

    res.status(201).json({
      success: true, status: 201, message: 'Record anchored on blockchain', data: record,
    });
  });

  // POST /api/v1/blockchain/verify
  static verify = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: VerifyRecordInput = req.body;
    const result = await BlockchainService.verifyRecord(dto);

    res.status(200).json({
      success: true, status: 200,
      message: result.isVerified ? 'Record verified' : 'Verification failed',
      data: result,
    });
  });

  // GET /api/v1/blockchain/records
  static listRecords = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: BlockchainQueryInput = req.query as any;
    const result = await BlockchainService.listRecords(query);

    res.status(200).json({
      success: true, status: 200,
      data: result.records, pagination: result.pagination,
    });
  });

  // GET /api/v1/blockchain/records/:id
  static getRecord = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BlockchainService.verifyRecord({ recordId: id });

    res.status(200).json({ success: true, status: 200, data: result });
  });

  // GET /api/v1/blockchain/logs/:patientId
  static getPatientLogs = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const records = await BlockchainService.getPatientAuditTrail(patientId);

    res.status(200).json({ success: true, status: 200, data: records });
  });

  // GET /api/v1/blockchain/stats
  static stats = AsyncHandler.handle(async (req: Request, res: Response) => {
    const stats = await BlockchainService.getStats();

    res.status(200).json({ success: true, status: 200, data: stats });
  });

  // POST /api/v1/blockchain/consent
  static grantConsent = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: ConsentInput = req.body;
    const userId = (req.user as any)?.userId;
    if (!userId) throw new UnauthorizedError();

    const consent = await BlockchainService.grantConsent(dto, userId);

    res.status(201).json({
      success: true, status: 201, message: 'Consent granted', data: consent,
    });
  });

  // POST /api/v1/blockchain/consent/:id/revoke
  static revokeConsent = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req.user as any)?.userId;
    if (!userId) throw new UnauthorizedError();

    const consent = await BlockchainService.revokeConsent(id, reason, userId);

    res.status(200).json({
      success: true, status: 200, message: 'Consent revoked', data: consent,
    });
  });
}