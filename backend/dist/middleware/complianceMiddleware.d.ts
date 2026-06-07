import { Request, Response, NextFunction } from 'express';
/**
 * Ensures PHI (Protected Health Information) access is logged
 * HIPAA requires all access to PHI to be audited
 */
export declare function auditPHIAccess(resource: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Ensures patient consent is obtained before accessing records
 * HIPAA requires patient authorization for PHI disclosure
 */
export declare function requirePatientConsent(resourceType: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Ensures minimum necessary access to PHI
 * HIPAA requires only the minimum necessary information be accessed
 */
export declare function minimumNecessaryAccess(allowedFields: string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Ensures data encryption for PHI in transit
 */
export declare function enforceEncryption(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * Ensures proper data disposal/compliance
 */
export declare function enforceDataRetention(retentionDays: number): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validates business associate agreement (BAA)
 */
export declare function requireBAA(organizationId?: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Ensures data subject rights (GDPR)
 * Right to access, rectification, erasure, restriction, portability
 */
export declare function enforceGDPRCompliance(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Right to be forgotten (GDPR Article 17)
 * Ensures data can be completely erased
 */
export declare function rightToErasure(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Data portability (GDPR Article 20)
 * Ensures data can be exported in machine-readable format
 */
export declare function dataPortability(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Data minimization (GDPR Article 5)
 * Only collect necessary data
 */
export declare function dataMinimization(allowedFields: string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Ensures payment card data is not stored
 * PCI DSS Requirement 3: Protect stored cardholder data
 */
export declare function preventCardDataStorage(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Ensures secure transmission of payment data
 * PCI DSS Requirement 4: Encrypt transmission of cardholder data
 */
export declare function securePaymentTransmission(): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Logs all data access for compliance auditing
 */
export declare function complianceAuditTrail(resource: string, action: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Validates user session for sensitive operations
 */
export declare function validateSessionForCompliance(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Checks if the user has completed required compliance training
 */
export declare function requireComplianceTraining(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Rate limits sensitive operations for compliance
 */
export declare function complianceRateLimit(maxRequests?: number, windowMs?: number): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Adds compliance-related headers to all responses
 */
export declare function complianceHeaders(req: Request, res: Response, next: NextFunction): void;
declare const _default: {
    auditPHIAccess: typeof auditPHIAccess;
    requirePatientConsent: typeof requirePatientConsent;
    minimumNecessaryAccess: typeof minimumNecessaryAccess;
    enforceEncryption: typeof enforceEncryption;
    enforceDataRetention: typeof enforceDataRetention;
    requireBAA: typeof requireBAA;
    enforceGDPRCompliance: typeof enforceGDPRCompliance;
    rightToErasure: typeof rightToErasure;
    dataPortability: typeof dataPortability;
    dataMinimization: typeof dataMinimization;
    preventCardDataStorage: typeof preventCardDataStorage;
    securePaymentTransmission: typeof securePaymentTransmission;
    complianceAuditTrail: typeof complianceAuditTrail;
    validateSessionForCompliance: typeof validateSessionForCompliance;
    requireComplianceTraining: typeof requireComplianceTraining;
    complianceRateLimit: typeof complianceRateLimit;
    complianceHeaders: typeof complianceHeaders;
};
export default _default;
//# sourceMappingURL=complianceMiddleware.d.ts.map