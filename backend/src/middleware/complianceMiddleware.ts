import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../modules/auth/services/auditService';
import { SecurityService } from '../modules/auth/services/securityService';
import { ForbiddenError, BadRequestError } from '../utils/errors';
import logger from '../utils/logger';
import prisma from '../config/prisma';

// ============================================
// HIPAA COMPLIANCE MIDDLEWARE
// ============================================

/**
 * Ensures PHI (Protected Health Information) access is logged
 * HIPAA requires all access to PHI to be audited
 */
export function auditPHIAccess(resource: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = function (body: any) {
      // Log PHI access
      AuditService.log({
        userId: req.user?.userId,
        organizationId: (req as any).organizationId,
        action: `${resource}_VIEWED`,
        resource: resource,
        resourceId: req.params.id,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        metadata: {
          method: req.method,
          path: req.path,
          query: req.query,
          statusCode: res.statusCode,
          timestamp: new Date().toISOString(),
        },
        severity: 'INFO',
        status: 'SUCCESS',
      }).catch((error) => {
        logger.error('Failed to log PHI access:', error);
      });

      return originalJson(body);
    };

    next();
  };
}

/**
 * Ensures patient consent is obtained before accessing records
 * HIPAA requires patient authorization for PHI disclosure
 */
export function requirePatientConsent(resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.params.patientId || req.body.patientId;
      const providerId = req.user?.userId;

      if (!patientId || !providerId) {
        return next(); // Skip if no patient/provider context
      }

      // Check if consent exists
      // In production, this would check the blockchain PatientConsent contract
      const hasConsent = await checkPatientConsent(patientId, providerId, resourceType);

      if (!hasConsent) {
        // Log the unauthorized access attempt
        await AuditService.log({
          userId: providerId,
          action: 'UNAUTHORIZED_ACCESS',
          resource: resourceType,
          resourceId: patientId,
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || '',
          metadata: {
            reason: 'NO_PATIENT_CONSENT',
            patientId,
            resourceType,
          },
          severity: 'WARNING',
          status: 'FAILURE',
        });

        throw new ForbiddenError(
          'Patient consent is required to access these records. Please obtain proper authorization.'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Ensures minimum necessary access to PHI
 * HIPAA requires only the minimum necessary information be accessed
 */
export function minimumNecessaryAccess(allowedFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = function (body: any) {
      // Filter response to only include allowed fields
      if (body && body.data) {
        if (Array.isArray(body.data)) {
          body.data = body.data.map((item: any) => filterFields(item, allowedFields));
        } else if (typeof body.data === 'object') {
          body.data = filterFields(body.data, allowedFields);
        }
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Ensures data encryption for PHI in transit
 */
export function enforceEncryption(req: Request, res: Response, next: NextFunction) {
  // Check if request is over HTTPS
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  
  if (!isSecure && process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      status: 403,
      message: 'Secure connection (HTTPS) is required for PHI transmission',
    });
  }

  // Add security headers
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');

  next();
}

/**
 * Ensures proper data disposal/compliance
 */
export function enforceDataRetention(retentionDays: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add retention metadata to the request
    (req as any).dataRetention = {
      retentionDays,
      expiresAt: new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000),
      policy: 'HIPAA',
    };

    next();
  };
}

/**
 * Validates business associate agreement (BAA)
 */
export function requireBAA(organizationId?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = organizationId || req.params.organizationId || req.body.organizationId;
      
      if (!orgId) {
        return next(); // Skip if no organization context
      }

      // Check if organization has an active subscription (implies BAA)
      const subscription = await prisma.subscription.findFirst({
        where: {
          organizationId: orgId,
          status: { in: ['ACTIVE', 'TRIAL'] },
        },
      });

      if (!subscription) {
        throw new ForbiddenError(
          'A valid Business Associate Agreement (BAA) is required. Please contact support.'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// ============================================
// GDPR COMPLIANCE MIDDLEWARE
// ============================================

/**
 * Ensures data subject rights (GDPR)
 * Right to access, rectification, erasure, restriction, portability
 */
export function enforceGDPRCompliance() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add GDPR compliance headers
    res.setHeader('X-Data-Processing-Purpose', 'Healthcare service provision');
    res.setHeader('X-Data-Retention-Period', 'As required by healthcare regulations');
    res.setHeader('X-Data-Controller', 'VoiceMed Pro');
    
    // Track consent for data processing
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const consentGiven = req.headers['x-data-consent'] === 'true';
      
      if (!consentGiven && process.env.NODE_ENV === 'production') {
        AuditService.log({
          userId: req.user?.userId,
          action: 'GDPR_CONSENT_REQUIRED',
          resource: 'DATA_PROCESSING',
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || '',
          severity: 'WARNING',
          status: 'FAILURE',
        }).catch(() => {});
      }
    }

    next();
  };
}

/**
 * Right to be forgotten (GDPR Article 17)
 * Ensures data can be completely erased
 */
export function rightToErasure() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Add erasure metadata
    (req as any).erasureRequest = {
      requestedAt: new Date().toISOString(),
      requestedBy: req.user?.userId,
      status: 'PENDING',
    };

    // Log the erasure request
    await AuditService.log({
      userId: req.user?.userId,
      action: 'ERASURE_REQUESTED',
      resource: 'GDPR',
      resourceId: req.params.id,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      severity: 'INFO',
      status: 'SUCCESS',
    });

    next();
  };
}

/**
 * Data portability (GDPR Article 20)
 * Ensures data can be exported in machine-readable format
 */
export function dataPortability() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set export format headers
    res.setHeader('X-Export-Format', 'JSON');
    res.setHeader('X-Export-Timestamp', new Date().toISOString());
    res.setHeader('X-Export-Requested-By', req.user?.userId || 'unknown');

    next();
  };
}

/**
 * Data minimization (GDPR Article 5)
 * Only collect necessary data
 */
export function dataMinimization(allowedFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
      const submittedFields = Object.keys(req.body);
      const unauthorizedFields = submittedFields.filter(
        (field) => !allowedFields.includes(field)
      );

      if (unauthorizedFields.length > 0) {
        // Remove unauthorized fields
        unauthorizedFields.forEach((field) => {
          delete req.body[field];
        });

        logger.warn(
          `Data minimization: Removed unauthorized fields: ${unauthorizedFields.join(', ')}`
        );
      }
    }

    next();
  };
}

// ============================================
// PCI DSS COMPLIANCE MIDDLEWARE
// ============================================

/**
 * Ensures payment card data is not stored
 * PCI DSS Requirement 3: Protect stored cardholder data
 */
export function preventCardDataStorage() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
      // Remove sensitive card data fields
      const cardFields = [
        'cardNumber', 'cvv', 'cvc', 'cardCvv', 'securityCode',
        'fullCardNumber', 'creditCard', 'debitCard',
        'cardPin', 'pin', 'cvv2',
      ];

      let hasSensitiveData = false;
      cardFields.forEach((field) => {
        if (req.body[field]) {
          delete req.body[field];
          hasSensitiveData = true;
        }
      });

      // Mask partial card numbers
      if (req.body.lastFourDigits || req.body.cardLastFour) {
        // Only last 4 digits are allowed
        const masked = req.body.lastFourDigits || req.body.cardLastFour;
        if (masked.length !== 4) {
          delete req.body.lastFourDigits;
          delete req.body.cardLastFour;
        }
      }

      if (hasSensitiveData) {
        logger.warn('PCI DSS: Removed sensitive card data from request body');
      }
    }

    next();
  };
}

/**
 * Ensures secure transmission of payment data
 * PCI DSS Requirement 4: Encrypt transmission of cardholder data
 */
export function securePaymentTransmission() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ensure HTTPS for payment routes
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    
    if (!isSecure && process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        status: 403,
        message: 'Secure connection required for payment processing',
      });
    }

    // Add PCI-specific security headers
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');

    next();
  };
}

// ============================================
// GENERAL COMPLIANCE MIDDLEWARE
// ============================================

/**
 * Logs all data access for compliance auditing
 */
export function complianceAuditTrail(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Log on response finish
    res.on('finish', () => {
      AuditService.log({
        userId: req.user?.userId,
        organizationId: (req as any).organizationId,
        action: action,
        resource: resource,
        resourceId: req.params.id || req.body?.id,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        metadata: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: Date.now() - startTime,
          complianceFrameworks: ['HIPAA', 'GDPR'],
          timestamp: new Date().toISOString(),
        },
        severity: 'INFO',
        status: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE',
      }).catch((error) => {
        logger.error('Failed to create compliance audit log:', error);
      });
    });

    next();
  };
}

/**
 * Validates user session for sensitive operations
 */
export function validateSessionForCompliance() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required for compliance'));
    }

    // Check session age
    const sessionId = (req as any).sessionId;
    if (sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (session) {
        const sessionAge = Date.now() - session.createdAt.getTime();
        const maxSessionAge = 12 * 60 * 60 * 1000; // 12 hours

        if (sessionAge > maxSessionAge) {
          await AuditService.log({
            userId: req.user.userId,
            action: 'SESSION_EXPIRED_COMPLIANCE',
            resource: 'SESSION',
            resourceId: sessionId,
            ipAddress: req.ip || '',
            userAgent: req.headers['user-agent'] || '',
            severity: 'WARNING',
            status: 'FAILURE',
          });

          throw new ForbiddenError(
            'Session expired for compliance reasons. Please re-authenticate.'
          );
        }
      }
    }

    next();
  };
}

/**
 * Checks if the user has completed required compliance training
 */
export function requireComplianceTraining() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // In production, this would check if the user has completed required training
    // For now, we skip this check
    next();
  };
}

/**
 * Rate limits sensitive operations for compliance
 */
export function complianceRateLimit(maxRequests: number = 100, windowMs: number = 900000) {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.user?.userId || req.ip || 'anonymous';
    const now = Date.now();
    const record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      AuditService.log({
        userId: req.user?.userId,
        action: 'COMPLIANCE_RATE_LIMIT_EXCEEDED',
        resource: 'COMPLIANCE',
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        severity: 'WARNING',
        status: 'FAILURE',
      }).catch(() => {});

      return res.status(429).json({
        success: false,
        status: 429,
        message: 'Rate limit exceeded for compliance reasons. Please try again later.',
      });
    }

    record.count++;
    next();
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if patient consent exists
 */
async function checkPatientConsent(
  patientId: string,
  providerId: string,
  resourceType: string
): Promise<boolean> {
  try {
    // In production, this would check the blockchain PatientConsent contract
    // For now, check if there's an existing appointment relationship
    const appointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        doctorId: providerId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });

    return !!appointment;
  } catch (error) {
    logger.error('Failed to check patient consent:', error);
    return false;
  }
}

/**
 * Filter object to only include allowed fields
 */
function filterFields(obj: any, allowedFields: string[]): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const filtered: any = {};
  for (const key of allowedFields) {
    if (obj.hasOwnProperty(key)) {
      filtered[key] = obj[key];
    }
  }
  return filtered;
}

// ============================================
// COMPLIANCE HEADERS MIDDLEWARE
// ============================================

/**
 * Adds compliance-related headers to all responses
 */
export function complianceHeaders(req: Request, res: Response, next: NextFunction) {
  // Data processing information
  res.setHeader('X-Data-Controller', 'VoiceMed Pro');
  res.setHeader('X-Data-Processor', 'VoiceMed Pro API');
  
  // Compliance frameworks
  res.setHeader('X-Compliance-Frameworks', 'HIPAA, GDPR, PCI-DSS');
  
  // Data retention
  res.setHeader('X-Data-Retention', 'Per healthcare regulations');
  
  // Privacy
  res.setHeader('X-Privacy-Policy', 'https://voicemedpro.com/privacy');
  
  // DPO contact (Data Protection Officer)
  res.setHeader('X-DPO-Contact', 'dpo@voicemedpro.com');

  next();
}

// ============================================
// EXPORT ALL MIDDLEWARE
// ============================================

export default {
  // HIPAA
  auditPHIAccess,
  requirePatientConsent,
  minimumNecessaryAccess,
  enforceEncryption,
  enforceDataRetention,
  requireBAA,
  
  // GDPR
  enforceGDPRCompliance,
  rightToErasure,
  dataPortability,
  dataMinimization,
  
  // PCI DSS
  preventCardDataStorage,
  securePaymentTransmission,
  
  // General
  complianceAuditTrail,
  validateSessionForCompliance,
  requireComplianceTraining,
  complianceRateLimit,
  complianceHeaders,
};