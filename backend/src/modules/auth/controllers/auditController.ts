import { Request, Response } from 'express';
import { AuditService } from '../services/auditService';
import { SecurityService } from '../services/securityService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import {
  AuditQueryInput,
  ExportAuditInput,
  BlockIpInput,
  UnblockIpInput,
  ComplianceReportInput,
  SecurityScanInput,
} from '../validators/auditValidator';

export class AuditController {
  // ============================================
  // AUDIT LOGS
  // ============================================

  // GET /api/v1/audit/logs
  static queryLogs = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: AuditQueryInput = req.query as any;
    const result = await AuditService.queryLogs(query);

    res.status(200).json({
      success: true,
      status: 200,
      data: result.logs,
      pagination: result.pagination,
    });
  });

  // GET /api/v1/audit/logs/user/:userId
  static getUserTrail = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await AuditService.getUserAuditTrail(userId, page, limit);

    res.status(200).json({
      success: true,
      status: 200,
      data: result.logs,
      pagination: result.pagination,
    });
  });

  // GET /api/v1/audit/logs/resource/:resource/:resourceId
  static getResourceTrail = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { resource, resourceId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await AuditService.getResourceAuditTrail(resource, resourceId, page, limit);

    res.status(200).json({
      success: true,
      status: 200,
      data: result.logs,
      pagination: result.pagination,
    });
  });

  // GET /api/v1/audit/stats
  static stats = AsyncHandler.handle(async (req: Request, res: Response) => {
    const organizationId = req.query.organizationId as string | undefined;
    const stats = await AuditService.getStats(organizationId);

    res.status(200).json({
      success: true,
      status: 200,
      data: stats,
    });
  });

  // GET /api/v1/audit/export
  static exportLogs = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: ExportAuditInput = req.query as any;
    const result = await AuditService.exportLogs(query, query.format || 'json');

    if (query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.status(200).send(result.data);
    } else {
      res.status(200).json({
        success: true,
        status: 200,
        filename: result.filename,
        data: result.data,
      });
    }
  });

  // ============================================
  // SECURITY MANAGEMENT
  // ============================================

  // GET /api/v1/audit/security/config
  static getSecurityConfig = AsyncHandler.handle(async (req: Request, res: Response) => {
    const config = SecurityService.getSecurityConfig();

    res.status(200).json({
      success: true,
      status: 200,
      data: config,
    });
  });

  // POST /api/v1/audit/security/block-ip
  static blockIp = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: BlockIpInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    await SecurityService.blockIp(dto.ip, dto.reason, userId);

    res.status(200).json({
      success: true,
      status: 200,
      message: `IP ${dto.ip} has been blocked`,
    });
  });

  // POST /api/v1/audit/security/unblock-ip
  static unblockIp = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: UnblockIpInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    await SecurityService.unblockIp(dto.ip, userId);

    res.status(200).json({
      success: true,
      status: 200,
      message: `IP ${dto.ip} has been unblocked`,
    });
  });

  // POST /api/v1/audit/security/scan
  static securityScan = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: SecurityScanInput = req.body;
    
    const breaches = await SecurityService.checkSecurityBreaches();

    res.status(200).json({
      success: true,
      status: 200,
      message: breaches.hasBreaches 
        ? 'Security issues detected' 
        : 'No security issues found',
      data: {
        scanType: dto.scanType,
        timestamp: new Date().toISOString(),
        hasBreaches: breaches.hasBreaches,
        alerts: breaches.alerts,
      },
    });
  });

  // GET /api/v1/audit/compliance/:type
  static complianceReport = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { type } = req.params as ComplianceReportInput['params'];
    const report = await SecurityService.generateComplianceReport(type as 'HIPAA' | 'GDPR');

    res.status(200).json({
      success: true,
      status: 200,
      data: report,
    });
  });

  // POST /api/v1/audit/validate-password
  static validatePassword = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { password } = req.body;
    
    const validation = SecurityService.validatePassword(password);
    const strength = SecurityService.getPasswordStrength(password);

    res.status(200).json({
      success: true,
      status: 200,
      data: {
        valid: validation.valid,
        errors: validation.errors,
        strength,
      },
    });
  });

  // POST /api/v1/audit/encrypt
  static encryptData = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { data } = req.body;
    const result = SecurityService.encryptData(data);

    res.status(200).json({
      success: true,
      status: 200,
      data: result,
    });
  });

  // POST /api/v1/audit/decrypt
  static decryptData = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { encrypted, iv, tag } = req.body;
    const decrypted = SecurityService.decryptData(encrypted, iv, tag);

    res.status(200).json({
      success: true,
      status: 200,
      data: { decrypted },
    });
  });

  // GET /api/v1/audit/ip-status/:ip
  static checkIpStatus = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { ip } = req.params;
    const isBlocked = await SecurityService.isIpBlocked(ip);

    res.status(200).json({
      success: true,
      status: 200,
      data: {
        ip,
        isBlocked,
        checkedAt: new Date().toISOString(),
      },
    });
  });

  // GET /api/v1/audit/retention-policies
  static getRetentionPolicies = AsyncHandler.handle(async (req: Request, res: Response) => {
    const policies = SecurityService.getDataRetentionPolicies();

    res.status(200).json({
      success: true,
      status: 200,
      data: policies,
    });
  });

  // POST /api/v1/audit/anonymize
  static anonymizeData = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { patientId } = req.body;
    const anonymized = SecurityService.anonymizePatientData(patientId);

    res.status(200).json({
      success: true,
      status: 200,
      data: anonymized,
    });
  });

  // POST /api/v1/audit/cleanup
  static cleanupLogs = AsyncHandler.handle(async (req: Request, res: Response) => {
    const retentionDays = parseInt(req.body.retentionDays as string) || 365;
    const deletedCount = await AuditService.cleanupOldLogs(retentionDays);

    res.status(200).json({
      success: true,
      status: 200,
      message: `Cleaned up ${deletedCount} old audit logs`,
      data: { deletedCount, retentionDays },
    });
  });
}