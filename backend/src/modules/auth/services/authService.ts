// src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserRole, UserStatus, AuthProvider } from '@prisma/client';
import prisma from '../../../config/prisma';
import { config } from '../../../config';
import { TokenService } from './tokenService';
import { SessionService } from './sessionService';
import { OtpService } from './otpServices';
import { EmailService } from './emailService';
import { AuditService } from './auditService';
import {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from '../validators/authValidator';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
  AccountLockedError,
  InternalServerError,
} from '../../../utils/errors';
import logger from '../../../utils/logger';

export class AuthService {
  /**
   * ============================================
   * REGISTRATION
   * ============================================
   */
  
  /**
   * Register a new user
   */
  static async register(dto: RegisterInput, ipAddress: string, userAgent: string) {
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictError('An account with this email already exists');
    }

    // Check if phone already exists (if provided)
    if (dto.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictError('An account with this phone number already exists');
      }
    }

    // Validate organization and branch if provided
    if (dto.organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: dto.organizationId },
      });
      if (!organization) {
        throw new BadRequestError('Organization not found');
      }
    }

    if (dto.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: dto.branchId },
      });
      if (!branch) {
        throw new BadRequestError('Branch not found');
      }
      if (dto.organizationId && branch.organizationId !== dto.organizationId) {
        throw new BadRequestError('Branch does not belong to the specified organization');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, config.security.bcryptRounds);

    // Create user in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone || null,
          role: dto.role || UserRole.PATIENT,
          status: UserStatus.PENDING_VERIFICATION,
          authProvider: AuthProvider.LOCAL,
          organizationId: dto.organizationId || null,
          branchId: dto.branchId || null,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          organizationId: newUser.organizationId,
          action: 'USER_REGISTERED',
          resource: 'USER',
          resourceId: newUser.id,
          ipAddress,
          userAgent,
          metadata: {
            email: newUser.email,
            role: newUser.role,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
          },
        },
      });

      return newUser;
    });

    // Send verification OTP — must succeed before returning success
    try {
      await OtpService.createAndSendOtp(
        user.id,
        user.email,
        user.phone,
        'EMAIL_VERIFICATION',
        'EMAIL'
      );
    } catch (error) {
      logger.error('Failed to send verification email during registration:', error);
      throw new InternalServerError(
        'Account created but verification email could not be sent. Please use POST /api/v1/auth/resend-otp to try again.'
      );
    }

    // Welcome email is optional — do not block registration
    EmailService.sendWelcomeEmail(user.email, user.firstName).catch((error) => {
      logger.error('Failed to send welcome email during registration:', error);
    });

    logger.info(`New user registered: ${user.email} (${user.id})`);

    return {
      userId: user.id,
      email: user.email,
      message: 'Registration successful. Please check your email for verification code.',
    };
  }

  /**
   * ============================================
   * LOGIN
   * ============================================
   */

  /**
   * Login user with email and password
   */
  static async login(dto: LoginInput, ipAddress: string, userAgent: string) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    // User not found
    if (!user) {
      logger.warn(`Login attempt for non-existent email: ${dto.email}`);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user uses social auth
    if (user.authProvider !== AuthProvider.LOCAL) {
      const providerName = this.getProviderName(user.authProvider);
      throw new BadRequestError(
        `This account uses ${providerName} authentication. Please sign in with ${providerName}.`
      );
    }

    // Check if user has password set
    if (!user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    
    if (!isPasswordValid) {
      // Log failed login attempt
      await AuditService.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        resource: 'AUTH',
        ipAddress,
        userAgent,
        metadata: {
          reason: 'INVALID_PASSWORD',
          attemptTime: new Date().toISOString(),
        },
      });

      // Check for brute force attack
      const recentFailedAttempts = await this.getRecentFailedLoginAttempts(user.id);
      
      if (recentFailedAttempts >= config.security.maxLoginAttempts) {
        logger.warn(`Account locked due to multiple failed attempts: ${user.email}`);
        
        // Lock the account temporarily
        await prisma.user.update({
          where: { id: user.id },
          data: { status: UserStatus.SUSPENDED },
        });

        // Send security alert email
        EmailService.sendMail(
          user.email,
          'Security Alert - Multiple Failed Login Attempts',
          this.getAccountLockedEmailTemplate(user.firstName)
        ).catch((error) => {
          logger.error('Failed to send security alert:', error);
        });

        throw new AccountLockedError(
          'Account temporarily locked due to multiple failed login attempts. Please check your email or contact support.'
        );
      }

      throw new UnauthorizedError('Invalid email or password');
    }

    // Validate user status
    this.validateUserStatus(user.status);

    // Check if email is verified (in production)
    if (!user.isEmailVerified && config.nodeEnv === 'production') {
      // Resend verification code
      await OtpService.createAndSendOtp(
        user.id,
        user.email,
        user.phone,
        'EMAIL_VERIFICATION',
        'EMAIL'
      );

      return {
        requiresVerification: true,
        userId: user.id,
        message: 'Email not verified. A new verification code has been sent to your email.',
      };
    }

    // Create session
    const sessionId = await SessionService.createSession(
      user.id,
      ipAddress,
      userAgent,
      dto.rememberMe || false
    );

    // Generate tokens
    const tokens = await TokenService.createAuthTokens(
      user.id,
      user.email,
      user.role,
      sessionId,
      dto.rememberMe || false
    );

    // Update last login information
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        status: user.status === UserStatus.PENDING_VERIFICATION 
          ? UserStatus.ACTIVE 
          : user.status,
      },
    });

    // Log successful login
    await AuditService.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resource: 'AUTH',
      ipAddress,
      userAgent,
      metadata: {
        loginMethod: 'PASSWORD',
        sessionId,
      },
    });

    logger.info(`User logged in: ${user.email}`);

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        mfaEnabled: user.mfaEnabled,
        organizationId: user.organizationId,
        branchId: user.branchId,
      },
    };
  }

  /**
   * Login with Google OAuth
   */
  static async googleLogin(googleProfile: any, ipAddress: string, userAgent: string) {
    const email = googleProfile.emails?.[0]?.value;
    const googleId = googleProfile.id;
    const firstName = googleProfile.name?.givenName || googleProfile.displayName?.split(' ')[0] || '';
    const lastName = googleProfile.name?.familyName || googleProfile.displayName?.split(' ').slice(1).join(' ') || '';
    const avatarUrl = googleProfile.photos?.[0]?.value || null;

    if (!email) {
      throw new BadRequestError('Email is required from Google profile');
    }

    // Find or create user
    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      let isNewUser = false;

      if (user) {
        // Check if user is suspended
        if (user.status === UserStatus.SUSPENDED) {
          throw new UnauthorizedError('Account is suspended. Please contact support.');
        }

        // Update Google ID if not already linked
        if (!user.googleId) {
          user = await tx.user.update({
            where: { id: user.id },
            data: {
              googleId,
              authProvider: AuthProvider.GOOGLE,
              isEmailVerified: true,
              avatarUrl: user.avatarUrl || avatarUrl,
              status: user.status === UserStatus.PENDING_VERIFICATION 
                ? UserStatus.ACTIVE 
                : user.status,
            },
          });
          logger.info(`Google account linked to existing user: ${user.email}`);
        }

        // Update avatar if not set
        if (!user.avatarUrl && avatarUrl) {
          user = await tx.user.update({
            where: { id: user.id },
            data: { avatarUrl },
          });
        }
      } else {
        // Create new user
        user = await tx.user.create({
          data: {
            email: email.toLowerCase(),
            googleId,
            firstName,
            lastName,
            avatarUrl,
            authProvider: AuthProvider.GOOGLE,
            isEmailVerified: true,
            status: UserStatus.ACTIVE,
            role: UserRole.PATIENT,
          },
        });
        isNewUser = true;
        logger.info(`New user created via Google: ${user.email}`);

        // Send welcome email for new users
        EmailService.sendWelcomeEmail(user.email, user.firstName).catch((error) => {
          logger.error('Failed to send welcome email:', error);
        });
      }

      return { user, isNewUser };
    });

    // Create session
    const sessionId = await SessionService.createSession(
      result.user.id,
      ipAddress,
      userAgent
    );

    // Generate tokens
    const tokens = await TokenService.createAuthTokens(
      result.user.id,
      result.user.email,
      result.user.role,
      sessionId
    );

    // Update last login
    await prisma.user.update({
      where: { id: result.user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Log successful login
    await AuditService.log({
      userId: result.user.id,
      action: 'LOGIN_SUCCESS',
      resource: 'AUTH',
      ipAddress,
      userAgent,
      metadata: {
        loginMethod: 'GOOGLE',
        isNewUser: result.isNewUser,
        sessionId,
      },
    });

    return {
      tokens,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        avatarUrl: result.user.avatarUrl,
        isNewUser: result.isNewUser,
      },
    };
  }

  /**
   * ============================================
   * LOGOUT
   * ============================================
   */

  /**
   * Logout user
   */
  static async logout(userId: string, sessionId: string, refreshToken?: string) {
    // Invalidate current session
    if (sessionId) {
      await SessionService.invalidateSession(sessionId);
    }

    // Revoke refresh token
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      });
    }

    // Log logout
    await AuditService.log({
      userId,
      action: 'LOGOUT',
      resource: 'AUTH',
      ipAddress: '',
      userAgent: '',
      metadata: {
        sessionId,
        timestamp: new Date().toISOString(),
      },
    });

    logger.info(`User logged out: ${userId}`);
  }

  /**
   * Logout from all devices
   */
  static async logoutAll(userId: string) {
    // Invalidate all sessions
    await SessionService.invalidateAllUserSessions(userId);

    // Revoke all refresh tokens
    await TokenService.revokeAllUserTokens(userId);

    // Log logout
    await AuditService.log({
      userId,
      action: 'LOGOUT_ALL',
      resource: 'AUTH',
      ipAddress: '',
      userAgent: '',
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

    logger.info(`User logged out from all devices: ${userId}`);

    return { message: 'Logged out from all devices successfully' };
  }

  /**
   * ============================================
   * OTP VERIFICATION
   * ============================================
   */

  /**
   * Verify OTP code
   */
  static async verifyOtp(
    email: string,
    code: string,
    type: string,
    ipAddress: string,
    userAgent: string
  ) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify OTP
    const isValid = await OtpService.verifyOtp(user.id, code, type as any);

    if (!isValid) {
      throw new BadRequestError('Invalid or expired verification code');
    }

    // Update user verification status based on OTP type
    const updateData: any = {};

    switch (type) {
      case 'EMAIL_VERIFICATION':
        updateData.isEmailVerified = true;
        if (user.status === UserStatus.PENDING_VERIFICATION) {
          updateData.status = UserStatus.ACTIVE;
        }
        break;
      case 'PHONE_VERIFICATION':
        updateData.isPhoneVerified = true;
        break;
      case 'TWO_FACTOR':
        // 2FA verification - doesn't change user status
        break;
      case 'PASSWORD_RESET':
        // Password reset - doesn't change user status
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    // Log verification
    await AuditService.log({
      userId: user.id,
      action: `OTP_VERIFIED_${type}`,
      resource: 'AUTH',
      ipAddress,
      userAgent,
      metadata: {
        type,
        timestamp: new Date().toISOString(),
      },
    });

    logger.info(`OTP verified for user ${user.email}: ${type}`);

    return {
      message: `${this.getOtpTypeLabel(type)} verified successfully`,
      isEmailVerified: type === 'EMAIL_VERIFICATION' ? true : user.isEmailVerified,
    };
  }

  /**
   * Resend OTP
   */
  static async resendOtp(email: string, type: string, channel: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists (security best practice)
    if (user) {
      // Check if user is already verified for the requested type
      if (type === 'EMAIL_VERIFICATION' && user.isEmailVerified) {
        return {
          message: 'Email is already verified. No need for verification code.',
        };
      }

      if (type === 'PHONE_VERIFICATION' && user.isPhoneVerified) {
        return {
          message: 'Phone number is already verified.',
        };
      }

      await OtpService.createAndSendOtp(
        user.id,
        user.email,
        user.phone,
        type as any,
        channel as any
      );

      logger.info(`OTP resent to user ${user.email}: ${type} via ${channel}`);
    }

    return {
      message: `If the email exists, a new ${this.getOtpTypeLabel(type)} code has been sent.`,
    };
  }

  /**
   * ============================================
   * PASSWORD MANAGEMENT
   * ============================================
   */

  /**
   * Forgot password - send reset OTP
   */
  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Check if user uses social auth
      if (user.authProvider !== AuthProvider.LOCAL) {
        const providerName = this.getProviderName(user.authProvider);
        return {
          message: `This account uses ${providerName} authentication. Please reset your password through ${providerName}.`,
          requiresSocialAuth: true,
          provider: user.authProvider,
        };
      }

      // Send password reset OTP
      await OtpService.createAndSendOtp(
        user.id,
        user.email,
        user.phone,
        'PASSWORD_RESET',
        'EMAIL'
      );

      logger.info(`Password reset OTP sent to ${user.email}`);
    }

    // Always return the same message to prevent email enumeration
    return {
      message: 'If the email exists in our system, a password reset code has been sent.',
    };
  }

  /**
   * Reset password with token
   */
  static async resetPassword(
    dto: ResetPasswordInput,
    ipAddress: string,
    userAgent: string
  ) {
    // Find valid OTP token
    const otpRecord = await prisma.otpToken.findFirst({
      where: {
        code: dto.token,
        type: 'PASSWORD_RESET',
        verifiedAt: { not: null },
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord || !otpRecord.user) {
      throw new BadRequestError('Invalid or expired reset token. Please request a new one.');
    }

    const user = otpRecord.user;

    // Check if user uses local auth
    if (user.authProvider !== AuthProvider.LOCAL || !user.passwordHash) {
      throw new BadRequestError(
        'This account uses social authentication. Password cannot be reset here.'
      );
    }

    // Check if new password is same as old
    const isSamePassword = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestError('New password cannot be the same as your current password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, config.security.bcryptRounds);

    // Update password and invalidate all sessions/tokens
    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          status: user.status === UserStatus.SUSPENDED ? UserStatus.ACTIVE : user.status,
        },
      });

      // Expire the used OTP token
      await tx.otpToken.update({
        where: { id: otpRecord.id },
        data: { expiresAt: new Date() },
      });

      // Delete all sessions
      await tx.session.deleteMany({
        where: { userId: user.id },
      });

      // Revoke all refresh tokens
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      // Log the password reset
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_COMPLETE',
          resource: 'AUTH',
          ipAddress,
          userAgent,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    // Send notification email about password change
    EmailService.sendPasswordChangeNotification(user.email, user.firstName).catch((error) => {
      logger.error('Failed to send password change notification:', error);
    });

    logger.info(`Password reset completed for user: ${user.email}`);

    return {
      message: 'Password reset successfully. Please log in with your new password.',
    };
  }

  /**
   * Change password (when user is logged in)
   */
  static async changePassword(
    userId: string,
    dto: ChangePasswordInput,
    currentSessionId: string,
    ipAddress: string,
    userAgent: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user uses local auth
    if (user.authProvider !== AuthProvider.LOCAL || !user.passwordHash) {
      throw new BadRequestError(
        'This account uses social authentication. Password cannot be changed here.'
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    // Check if new password is different from current
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestError('New password must be different from your current password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, config.security.bcryptRounds);

    // Update password, keeping current session alive
    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
      });

      // Delete all other sessions except current
      await tx.session.deleteMany({
        where: {
          userId,
          id: { not: currentSessionId },
        },
      });

      // Revoke all refresh tokens except the one for current session
      // Find current session's refresh token family
      const currentTokens = await tx.refreshToken.findFirst({
        where: {
          userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (currentTokens) {
        // Revoke all other tokens
        await tx.refreshToken.updateMany({
          where: {
            userId,
            revokedAt: null,
            id: { not: currentTokens.id },
          },
          data: { revokedAt: new Date() },
        });
      }

      // Log password change
      await tx.auditLog.create({
        data: {
          userId,
          action: 'PASSWORD_CHANGED',
          resource: 'AUTH',
          ipAddress,
          userAgent,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    // Send notification email
    EmailService.sendPasswordChangeNotification(user.email, user.firstName).catch((error) => {
      logger.error('Failed to send password change notification:', error);
    });

    logger.info(`Password changed for user: ${user.email}`);

    return {
      message: 'Password changed successfully. You have been logged out of other devices.',
    };
  }

  /**
   * ============================================
   * PROFILE MANAGEMENT
   * ============================================
   */

  /**
   * Get current user profile
   */
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        authProvider: true,
        avatarUrl: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        mfaEnabled: true,
        organizationId: true,
        branchId: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            sessions: {
              where: {
                expiresAt: { gt: new Date() },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get permissions based on role
    const permissions = this.getRolePermissions(user.role);

    return {
      user: {
        ...user,
        activeSessions: user._count.sessions,
      },
      permissions,
    };
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    dto: UpdateProfileInput,
    ipAddress: string,
    userAgent: string
  ) {
    // Check if phone is already taken
    if (dto.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: dto.phone,
          id: { not: userId },
        },
      });

      if (existingPhone) {
        throw new ConflictError('Phone number is already in use by another account');
      }
    }

    // Build update data
    const updateData: any = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone || null;

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestError('No fields to update');
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    // Log profile update
    await AuditService.log({
      userId,
      action: 'PROFILE_UPDATED',
      resource: 'USER',
      resourceId: userId,
      ipAddress,
      userAgent,
      metadata: {
        updatedFields: Object.keys(updateData),
        timestamp: new Date().toISOString(),
      },
    });

    logger.info(`Profile updated for user: ${userId}`);

    return updatedUser;
  }

  /**
   * Upload avatar
   */
  static async uploadAvatar(userId: string, file: Express.Multer.File, fileService: any) {
    if (!file) {
      throw new BadRequestError('No file uploaded');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestError(
        `Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    // Validate file size
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestError('File size exceeds 5MB limit');
    }

    // Upload to Cloudinary
    const { url: avatarUrl } = await fileService.uploadFile(
      file.path,
      file.originalname,
      file.mimetype
    );

    // Delete old avatar if exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (user?.avatarUrl) {
      const oldPublicId = fileService.extractPublicId(user.avatarUrl);
      if (oldPublicId) {
        await fileService.deleteFile(oldPublicId).catch((error: any) => {
          logger.error('Failed to delete old avatar:', error);
        });
      }
    }

    // Update user avatar
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    logger.info(`Avatar updated for user: ${userId}`);

    return { avatarUrl };
  }

  /**
   * ============================================
   * ACCOUNT MANAGEMENT
   * ============================================
   */

  /**
   * Deactivate user account
   */
  static async deactivateAccount(userId: string, ipAddress: string, userAgent: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.INACTIVE },
    });

    // Invalidate all sessions
    await SessionService.invalidateAllUserSessions(userId);
    await TokenService.revokeAllUserTokens(userId);

    // Log account deactivation
    await AuditService.log({
      userId,
      action: 'ACCOUNT_DEACTIVATED',
      resource: 'USER',
      resourceId: userId,
      ipAddress,
      userAgent,
    });

    logger.info(`Account deactivated: ${userId}`);

    return { message: 'Account deactivated successfully' };
  }

  /**
   * Reactivate user account
   */
  static async reactivateAccount(userId: string, ipAddress: string, userAgent: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
    });

    // Log account reactivation
    await AuditService.log({
      userId,
      action: 'ACCOUNT_REACTIVATED',
      resource: 'USER',
      resourceId: userId,
      ipAddress,
      userAgent,
    });

    logger.info(`Account reactivated: ${userId}`);

    return { message: 'Account reactivated successfully' };
  }

  /**
   * Delete user account (soft delete with anonymization)
   */
  static async deleteAccount(userId: string, ipAddress: string, userAgent: string) {
    // Soft delete - anonymize personal data
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          status: UserStatus.INACTIVE,
          email: `deleted_${userId}@voicemedpro.com`,
          phone: null,
          googleId: null,
          passwordHash: null,
          firstName: 'Deleted',
          lastName: 'User',
          avatarUrl: null,
        },
      });

      // Delete all sessions
      await tx.session.deleteMany({ where: { userId } });

      // Revoke all tokens
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      // Log account deletion
      await tx.auditLog.create({
        data: {
          userId,
          action: 'ACCOUNT_DELETED',
          resource: 'USER',
          resourceId: userId,
          ipAddress,
          userAgent,
        },
      });
    });

    logger.info(`Account deleted: ${userId}`);

    return { message: 'Account deleted successfully' };
  }

  /**
   * ============================================
   * PERMISSIONS & ROLES
   * ============================================
   */

  /**
   * Get role permissions - Complete permission matrix
   */
  static getRolePermissions(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      SUPER_ADMIN: [
        // Full system access
        'MANAGE_ORGANIZATIONS',
        'MANAGE_USERS',
        'MANAGE_ROLES',
        'VIEW_ANALYTICS',
        'VIEW_FINANCIAL_REPORTS',
        'MANAGE_SYSTEM_SETTINGS',
        'VIEW_AUDIT_LOGS',
        'MANAGE_BLOCKCHAIN',
        'MANAGE_BRANCHES',
        'EXPORT_DATA',
        'MANAGE_INTEGRATIONS',
        'MANAGE_BILLING',
        'MANAGE_SUBSCRIPTIONS',
        'VIEW_ALL_PATIENTS',
        'VIEW_ALL_DOCTORS',
        'MANAGE_APPOINTMENTS',
      ],
      ADMIN: [
        'MANAGE_USERS',
        'VIEW_ANALYTICS',
        'VIEW_FINANCIAL_REPORTS',
        'MANAGE_BRANCH_SETTINGS',
        'VIEW_AUDIT_LOGS',
        'MANAGE_STAFF',
        'MANAGE_APPOINTMENTS',
        'MANAGE_PATIENTS',
        'MANAGE_BILLING',
        'EXPORT_DATA',
        'VIEW_ALL_PATIENTS',
        'VIEW_ALL_DOCTORS',
      ],
      DOCTOR: [
        'VIEW_PATIENTS',
        'EDIT_EMR',
        'WRITE_PRESCRIPTIONS',
        'VIEW_OWN_SCHEDULE',
        'ACCESS_TELEMEDICINE',
        'ORDER_LAB_TESTS',
        'VIEW_LAB_RESULTS',
        'MANAGE_OWN_PATIENTS',
        'VIEW_PATIENT_HISTORY',
        'MANAGE_OWN_PROFILE',
      ],
      NURSE: [
        'VIEW_PATIENTS',
        'UPDATE_VITALS',
        'VIEW_SCHEDULE',
        'ASSIST_DOCTOR',
        'MANAGE_QUEUE',
        'UPDATE_PATIENT_STATUS',
        'VIEW_LAB_RESULTS',
        'MANAGE_OWN_PROFILE',
      ],
      RECEPTIONIST: [
        'BOOK_APPOINTMENTS',
        'MANAGE_QUEUE',
        'VIEW_SCHEDULE',
        'REGISTER_PATIENTS',
        'MANAGE_WALK_INS',
        'VIEW_DOCTOR_AVAILABILITY',
        'MANAGE_OWN_PROFILE',
      ],
      PHARMACIST: [
        'VIEW_PRESCRIPTIONS',
        'MANAGE_INVENTORY',
        'DISPENSE_MEDICATION',
        'VIEW_PATIENT_HISTORY',
        'MANAGE_DRUG_STOCK',
        'MANAGE_OWN_PROFILE',
      ],
      LAB_TECHNICIAN: [
        'UPLOAD_REPORTS',
        'VIEW_LAB_ORDERS',
        'MANAGE_LAB_EQUIPMENT',
        'UPDATE_TEST_RESULTS',
        'VIEW_PATIENT_SAMPLES',
        'MANAGE_OWN_PROFILE',
      ],
      PATIENT: [
        'BOOK_APPOINTMENTS',
        'VIEW_OWN_RECORDS',
        'ACCESS_TELEMEDICINE',
        'MANAGE_OWN_PROFILE',
        'VIEW_OWN_PRESCRIPTIONS',
        'VIEW_OWN_LAB_RESULTS',
        'PAY_BILLS',
        'MANAGE_OWN_APPOINTMENTS',
      ],
    };

    return permissions[role] || [];
  }

  /**
   * Check if user has a specific permission
   */
  static hasPermission(userRole: UserRole, permission: string): boolean {
    const permissions = this.getRolePermissions(userRole);
    return permissions.includes(permission);
  }

  /**
   * Check if user has any of the required roles
   */
  static hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
    return allowedRoles.includes(userRole);
  }

  /**
   * ============================================
   * UTILITY METHODS
   * ============================================
   */

  /**
   * Validate user status
   */
  private static validateUserStatus(status: UserStatus): void {
    switch (status) {
      case UserStatus.SUSPENDED:
        throw new UnauthorizedError(
          'Your account has been suspended. Please contact support for assistance.'
        );
      case UserStatus.INACTIVE:
        throw new UnauthorizedError(
          'Your account is inactive. Please contact support to reactivate your account.'
        );
      case UserStatus.PENDING_VERIFICATION:
        // Allow login but restrict features
        break;
      case UserStatus.ACTIVE:
        // Full access
        break;
      default:
        throw new UnauthorizedError('Invalid account status');
    }
  }

  /**
   * Get recent failed login attempts count
   */
  private static async getRecentFailedLoginAttempts(userId: string): Promise<number> {
    const lockoutWindow = new Date(
      Date.now() - config.security.loginLockoutMinutes * 60 * 1000
    );

    return prisma.auditLog.count({
      where: {
        userId,
        action: 'LOGIN_FAILED',
        createdAt: { gte: lockoutWindow },
      },
    });
  }

  /**
   * Get provider name from enum
   */
  private static getProviderName(provider: AuthProvider): string {
    switch (provider) {
      case AuthProvider.GOOGLE:
        return 'Google';
      case AuthProvider.APPLE:
        return 'Apple';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get OTP type label
   */
  private static getOtpTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      EMAIL_VERIFICATION: 'Email',
      PHONE_VERIFICATION: 'Phone number',
      PASSWORD_RESET: 'Password reset',
      TWO_FACTOR: 'Two-factor authentication',
    };
    return labels[type] || type;
  }

  /**
   * Get account locked email template
   */
  private static getAccountLockedEmailTemplate(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; }
          .container { max-width: 480px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; }
          .header { background: #DC2626; padding: 32px; text-align: center; color: white; }
          .content { padding: 32px; }
          .warning { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚠️ Security Alert</h2>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>We detected multiple failed login attempts to your VoiceMed Pro account.</p>
            <div class="warning">
              <p style="color: #DC2626; margin: 0;">
                <strong>For your security, your account has been temporarily locked.</strong>
              </p>
            </div>
            <p>If this was you, please wait 15 minutes and try again, or use the "Forgot Password" option.</p>
            <p>If this wasn't you, please contact our support team immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Check if email is already registered
   */
  static async isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
        deletedAt: null,
      },
    });
    return !!user;
  }

  /**
   * Check if phone is already registered
   */
  static async isPhoneTaken(phone: string, excludeUserId?: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        phone,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
        deletedAt: null,
      },
    });
    return !!user;
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}