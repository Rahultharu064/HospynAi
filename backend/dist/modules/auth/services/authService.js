"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
// src/services/auth.service.ts
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../../config/prisma"));
const config_1 = require("../../../config");
const tokenService_1 = require("./tokenService");
const sessionService_1 = require("./sessionService");
const otpServices_1 = require("./otpServices");
const emailService_1 = require("./emailService");
const auditService_1 = require("./auditService");
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
class AuthService {
    /**
     * ============================================
     * REGISTRATION
     * ============================================
     */
    /**
     * Register a new user
     *
     * Self-service registration always produces a PATIENT with no organization or
     * branch. Role and tenancy are never read from `dto` — see registerSchema, which
     * rejects those fields outright — because this endpoint is unauthenticated and
     * anything it trusts is attacker-controlled. Staff accounts go through
     * `createStaff` instead.
     */
    static async register(dto, ipAddress, userAgent) {
        // Check if email already exists
        const existingEmail = await prisma_1.default.user.findUnique({
            where: { email: dto.email },
        });
        if (existingEmail) {
            throw new errors_1.ConflictError('An account with this email already exists');
        }
        // Check if phone already exists (if provided)
        if (dto.phone) {
            const existingPhone = await prisma_1.default.user.findUnique({
                where: { phone: dto.phone },
            });
            if (existingPhone) {
                throw new errors_1.ConflictError('An account with this phone number already exists');
            }
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(dto.password, config_1.config.security.bcryptRounds);
        // Create user in a transaction
        const user = await prisma_1.default.$transaction(async (tx) => {
            // Create the user
            const newUser = await tx.user.create({
                data: {
                    email: dto.email,
                    passwordHash: hashedPassword,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    phone: dto.phone || null,
                    role: client_1.UserRole.PATIENT,
                    status: client_1.UserStatus.PENDING_VERIFICATION,
                    authProvider: client_1.AuthProvider.LOCAL,
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
        // Send verification OTP — in production this must succeed; in dev, log & continue
        try {
            await otpServices_1.OtpService.createAndSendOtp(user.id, user.email, user.phone, 'EMAIL_VERIFICATION', 'EMAIL');
        }
        catch (error) {
            logger_1.default.error('Failed to send verification email during registration:', error);
            if (config_1.config.nodeEnv === 'production') {
                throw new errors_1.InternalServerError('Account created but verification email could not be sent. Please use POST /api/v1/auth/resend-otp to try again.');
            }
            // In development — log a warning so the dev can continue without email
            logger_1.default.warn(`[DEV] Email delivery failed for ${user.email}. ` +
                `Use POST /api/v1/auth/resend-otp to get a new OTP, or check the backend logs above for the OTP code.`);
        }
        // Welcome email is optional — do not block registration
        emailService_1.EmailService.sendWelcomeEmail(user.email, user.firstName).catch((error) => {
            logger_1.default.error('Failed to send welcome email during registration:', error);
        });
        logger_1.default.info(`New user registered: ${user.email} (${user.id})`);
        return {
            userId: user.id,
            email: user.email,
            message: 'Registration successful. Please check your email for verification code.',
        };
    }
    /**
     * Provision a staff account (ADMIN / SUPER_ADMIN only).
     *
     * This is the privileged path that `register` deliberately isn't: it is the only
     * place a caller-supplied `role` is honoured, and it is only reachable behind
     * `authenticate` + `authorize(SUPER_ADMIN, ADMIN)`.
     *
     * No password is set here. The invitee receives a PASSWORD_RESET code and chooses
     * their own credential, so an invite never travels through a channel that also
     * carries a usable password.
     *
     * An ADMIN is scoped to their own organization; only a SUPER_ADMIN may place a
     * user into an arbitrary tenant.
     */
    static async createStaff(dto, actor, ipAddress, userAgent) {
        const existingEmail = await prisma_1.default.user.findUnique({ where: { email: dto.email } });
        if (existingEmail) {
            throw new errors_1.ConflictError('An account with this email already exists');
        }
        if (dto.phone) {
            const existingPhone = await prisma_1.default.user.findUnique({ where: { phone: dto.phone } });
            if (existingPhone) {
                throw new errors_1.ConflictError('An account with this phone number already exists');
            }
        }
        // Only a SUPER_ADMIN may provision outside their own tenant. For an ADMIN the
        // target org is forced to their own, so a supplied organizationId cannot be used
        // to plant a user in someone else's organization.
        const organizationId = actor.role === client_1.UserRole.SUPER_ADMIN ? dto.organizationId ?? null : actor.organizationId;
        if (actor.role !== client_1.UserRole.SUPER_ADMIN && dto.organizationId && dto.organizationId !== actor.organizationId) {
            throw new errors_1.ForbiddenError('You can only add staff to your own organization');
        }
        // Creating another SUPER_ADMIN is reserved for SUPER_ADMINs.
        if (dto.role === client_1.UserRole.SUPER_ADMIN && actor.role !== client_1.UserRole.SUPER_ADMIN) {
            throw new errors_1.ForbiddenError('Only a super admin can create another super admin');
        }
        if (organizationId) {
            const organization = await prisma_1.default.organization.findUnique({ where: { id: organizationId } });
            if (!organization) {
                throw new errors_1.BadRequestError('Organization not found');
            }
        }
        if (dto.branchId) {
            const branch = await prisma_1.default.branch.findUnique({ where: { id: dto.branchId } });
            if (!branch) {
                throw new errors_1.BadRequestError('Branch not found');
            }
            if (organizationId && branch.organizationId !== organizationId) {
                throw new errors_1.BadRequestError('Branch does not belong to the specified organization');
            }
        }
        const user = await prisma_1.default.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email: dto.email,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    phone: dto.phone || null,
                    role: dto.role,
                    status: client_1.UserStatus.PENDING_VERIFICATION,
                    authProvider: client_1.AuthProvider.LOCAL,
                    organizationId,
                    branchId: dto.branchId || null,
                },
            });
            await tx.auditLog.create({
                data: {
                    userId: actor.userId,
                    organizationId: newUser.organizationId,
                    action: 'STAFF_CREATED',
                    resource: 'USER',
                    resourceId: newUser.id,
                    ipAddress,
                    userAgent,
                    metadata: {
                        email: newUser.email,
                        role: newUser.role,
                        createdBy: actor.userId,
                    },
                },
            });
            return newUser;
        });
        // The invite doubles as the credential-setup code.
        try {
            await otpServices_1.OtpService.createAndSendOtp(user.id, user.email, user.phone, 'PASSWORD_RESET', 'EMAIL');
        }
        catch (error) {
            logger_1.default.error('Failed to send staff invite email:', error);
            if (config_1.config.nodeEnv === 'production') {
                throw new errors_1.InternalServerError('Staff account created but the invite email could not be sent. Use POST /api/v1/auth/resend-otp to retry.');
            }
            logger_1.default.warn(`[DEV] Invite email delivery failed for ${user.email}. Check the logs above for the code.`);
        }
        logger_1.default.info(`Staff account created: ${user.email} (${user.role}) by ${actor.userId}`);
        return {
            userId: user.id,
            email: user.email,
            role: user.role,
            message: 'Staff account created. An invite with a setup code has been emailed.',
        };
    }
    /**
     * Resolve the acting user's role and tenant from the database rather than trusting
     * the JWT claims. A token minted before a role or org change would otherwise carry
     * stale authority for its full 15-minute life.
     */
    static async getActorContext(userId) {
        const actor = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, organizationId: true },
        });
        if (!actor) {
            throw new errors_1.UnauthorizedError('User not found');
        }
        return { userId: actor.id, role: actor.role, organizationId: actor.organizationId };
    }
    /**
     * ============================================
     * LOGIN
     * ============================================
     */
    /**
     * Login user with email and password
     */
    static async login(dto, ipAddress, userAgent) {
        // Find user by email
        const user = await prisma_1.default.user.findUnique({
            where: { email: dto.email },
        });
        // User not found
        if (!user) {
            logger_1.default.warn(`Login attempt for non-existent email: ${dto.email}`);
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        // Check if user uses social auth
        if (user.authProvider !== client_1.AuthProvider.LOCAL) {
            const providerName = this.getProviderName(user.authProvider);
            throw new errors_1.BadRequestError(`This account uses ${providerName} authentication. Please sign in with ${providerName}.`);
        }
        // Check if user has password set
        if (!user.passwordHash) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        // Time-boxed brute-force gate.
        //
        // Checked *before* the password compare so a locked account can't be probed
        // further, and derived purely from the rolling audit-log window so the lock
        // always expires on its own. This used to write `status: SUSPENDED`, which
        // nothing ever cleared — meaning anyone who knew an email address could
        // permanently disable that account with five bad guesses, and the "wait 15
        // minutes" alert email was a lie.
        const failedAttempts = await this.getRecentFailedLoginAttempts(user.id);
        if (failedAttempts >= config_1.config.security.maxLoginAttempts) {
            throw new errors_1.AccountLockedError(`Too many failed login attempts. Please try again in ${config_1.config.security.loginLockoutMinutes} minutes, or reset your password.`);
        }
        // Verify password
        const isPasswordValid = await bcryptjs_1.default.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            // Log failed login attempt
            await auditService_1.AuditService.log({
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
            // Alert once — on the attempt that actually trips the threshold — rather than
            // on every attempt past it.
            if (failedAttempts + 1 >= config_1.config.security.maxLoginAttempts) {
                logger_1.default.warn(`Account temporarily locked after repeated failed attempts: ${user.email}`);
                emailService_1.EmailService.sendMail(user.email, 'Security Alert - Multiple Failed Login Attempts', this.getAccountLockedEmailTemplate(user.firstName)).catch((error) => {
                    logger_1.default.error('Failed to send security alert:', error);
                });
                throw new errors_1.AccountLockedError(`Too many failed login attempts. Please try again in ${config_1.config.security.loginLockoutMinutes} minutes, or reset your password.`);
            }
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        // Validate user status
        this.validateUserStatus(user.status);
        // Check if email is verified (in production)
        if (!user.isEmailVerified && config_1.config.nodeEnv === 'production') {
            // Resend verification code
            await otpServices_1.OtpService.createAndSendOtp(user.id, user.email, user.phone, 'EMAIL_VERIFICATION', 'EMAIL');
            return {
                requiresVerification: true,
                userId: user.id,
                message: 'Email not verified. A new verification code has been sent to your email.',
            };
        }
        // Create session
        const sessionId = await sessionService_1.SessionService.createSession(user.id, ipAddress, userAgent, dto.rememberMe || false);
        // Generate tokens
        const tokens = await tokenService_1.TokenService.createAuthTokens(user.id, user.email, user.role, sessionId, dto.rememberMe || false);
        // Update last login information
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                lastLoginIp: ipAddress,
                status: user.status === client_1.UserStatus.PENDING_VERIFICATION
                    ? client_1.UserStatus.ACTIVE
                    : user.status,
            },
        });
        // Log successful login
        await auditService_1.AuditService.log({
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
        logger_1.default.info(`User logged in: ${user.email}`);
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
    static async googleLogin(googleProfile, ipAddress, userAgent) {
        const email = googleProfile.emails?.[0]?.value;
        const googleId = googleProfile.id;
        const firstName = googleProfile.name?.givenName || googleProfile.displayName?.split(' ')[0] || '';
        const lastName = googleProfile.name?.familyName || googleProfile.displayName?.split(' ').slice(1).join(' ') || '';
        const avatarUrl = googleProfile.photos?.[0]?.value || null;
        if (!email) {
            throw new errors_1.BadRequestError('Email is required from Google profile');
        }
        // Find or create user
        const result = await prisma_1.default.$transaction(async (tx) => {
            let user = await tx.user.findUnique({
                where: { email: email.toLowerCase() },
            });
            let isNewUser = false;
            if (user) {
                // Check if user is suspended
                if (user.status === client_1.UserStatus.SUSPENDED) {
                    throw new errors_1.UnauthorizedError('Account is suspended. Please contact support.');
                }
                // Link the Google identity to the existing account.
                //
                // `authProvider` is deliberately left alone when the account already has a
                // password. It used to be overwritten with GOOGLE, and since `login` refuses
                // any account whose provider isn't LOCAL, linking Google permanently locked
                // the user out of their own password — with no way back. Provider is only
                // promoted for accounts that never had a local credential.
                if (!user.googleId) {
                    user = await tx.user.update({
                        where: { id: user.id },
                        data: {
                            googleId,
                            ...(user.passwordHash ? {} : { authProvider: client_1.AuthProvider.GOOGLE }),
                            isEmailVerified: true,
                            avatarUrl: user.avatarUrl || avatarUrl,
                            status: user.status === client_1.UserStatus.PENDING_VERIFICATION
                                ? client_1.UserStatus.ACTIVE
                                : user.status,
                        },
                    });
                    logger_1.default.info(`Google account linked to existing user: ${user.email}`);
                }
                // Update avatar if not set
                if (!user.avatarUrl && avatarUrl) {
                    user = await tx.user.update({
                        where: { id: user.id },
                        data: { avatarUrl },
                    });
                }
            }
            else {
                // Create new user
                user = await tx.user.create({
                    data: {
                        email: email.toLowerCase(),
                        googleId,
                        firstName,
                        lastName,
                        avatarUrl,
                        authProvider: client_1.AuthProvider.GOOGLE,
                        isEmailVerified: true,
                        status: client_1.UserStatus.ACTIVE,
                        role: client_1.UserRole.PATIENT,
                    },
                });
                isNewUser = true;
                logger_1.default.info(`New user created via Google: ${user.email}`);
                // Send welcome email for new users
                emailService_1.EmailService.sendWelcomeEmail(user.email, user.firstName).catch((error) => {
                    logger_1.default.error('Failed to send welcome email:', error);
                });
            }
            return { user, isNewUser };
        });
        // Create session
        const sessionId = await sessionService_1.SessionService.createSession(result.user.id, ipAddress, userAgent);
        // Generate tokens
        const tokens = await tokenService_1.TokenService.createAuthTokens(result.user.id, result.user.email, result.user.role, sessionId);
        // Update last login
        await prisma_1.default.user.update({
            where: { id: result.user.id },
            data: {
                lastLoginAt: new Date(),
                lastLoginIp: ipAddress,
            },
        });
        // Log successful login
        await auditService_1.AuditService.log({
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
    static async logout(userId, sessionId, refreshToken) {
        // Invalidate current session and every refresh token issued against it. Revoking
        // only the cookie's token (as this used to) left the rest of the family live, so
        // any other token from the same session could refresh straight back in.
        if (sessionId) {
            await tokenService_1.TokenService.revokeSessionTokens(sessionId);
            await sessionService_1.SessionService.invalidateSession(sessionId);
        }
        // Revoke refresh token
        if (refreshToken) {
            await prisma_1.default.refreshToken.updateMany({
                where: { token: refreshToken },
                data: { revokedAt: new Date() },
            });
        }
        // Log logout
        await auditService_1.AuditService.log({
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
        logger_1.default.info(`User logged out: ${userId}`);
    }
    /**
     * Logout from all devices
     */
    static async logoutAll(userId) {
        // Invalidate all sessions
        await sessionService_1.SessionService.invalidateAllUserSessions(userId);
        // Revoke all refresh tokens
        await tokenService_1.TokenService.revokeAllUserTokens(userId);
        // Log logout
        await auditService_1.AuditService.log({
            userId,
            action: 'LOGOUT_ALL',
            resource: 'AUTH',
            ipAddress: '',
            userAgent: '',
            metadata: {
                timestamp: new Date().toISOString(),
            },
        });
        logger_1.default.info(`User logged out from all devices: ${userId}`);
        return { message: 'Logged out from all devices successfully' };
    }
    /**
     * ============================================
     * OTP VERIFICATION
     * ============================================
     */
    /**
     * Verify an OTP code.
     *
     * Verifying an email or a 2FA challenge is the final step of signing in, so it
     * returns a real session (tokens + user) exactly like `login` does. It previously
     * returned only a message, while the frontend called `setSession(res.data)` on the
     * result — so a *successful* verification threw on `undefined.accessToken` and
     * dropped the user on the dashboard with no session at all.
     *
     * PHONE_VERIFICATION and PASSWORD_RESET are not sign-in events and return no
     * tokens: the former is a profile update, the latter only marks the code usable by
     * `resetPassword`.
     */
    static async verifyOtp(email, code, type, ipAddress, userAgent) {
        // Find user
        const user = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        // Verify OTP
        const isValid = await otpServices_1.OtpService.verifyOtp(user.id, code, type);
        if (!isValid) {
            throw new errors_1.BadRequestError('Invalid or expired verification code');
        }
        // Update user verification status based on OTP type
        const updateData = {};
        switch (type) {
            case 'EMAIL_VERIFICATION':
                updateData.isEmailVerified = true;
                if (user.status === client_1.UserStatus.PENDING_VERIFICATION) {
                    updateData.status = client_1.UserStatus.ACTIVE;
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
            await prisma_1.default.user.update({
                where: { id: user.id },
                data: updateData,
            });
        }
        // Log verification
        await auditService_1.AuditService.log({
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
        logger_1.default.info(`OTP verified for user ${user.email}: ${type}`);
        const isEmailVerified = type === 'EMAIL_VERIFICATION' ? true : user.isEmailVerified;
        const baseResult = {
            message: `${this.getOtpTypeLabel(type)} verified successfully`,
            isEmailVerified,
        };
        // Only the sign-in flavours mint a session.
        if (type !== 'EMAIL_VERIFICATION' && type !== 'TWO_FACTOR') {
            return baseResult;
        }
        // A verified code doesn't override an account an admin has disabled.
        const effectiveStatus = updateData.status ?? user.status;
        this.validateUserStatus(effectiveStatus);
        const sessionId = await sessionService_1.SessionService.createSession(user.id, ipAddress, userAgent);
        const tokens = await tokenService_1.TokenService.createAuthTokens(user.id, user.email, user.role, sessionId);
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
        });
        await auditService_1.AuditService.log({
            userId: user.id,
            action: 'LOGIN_SUCCESS',
            resource: 'AUTH',
            ipAddress,
            userAgent,
            metadata: { loginMethod: type === 'TWO_FACTOR' ? 'TWO_FACTOR' : 'EMAIL_VERIFICATION', sessionId },
        });
        return {
            ...baseResult,
            tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                avatarUrl: user.avatarUrl,
                isEmailVerified,
                isPhoneVerified: user.isPhoneVerified,
                mfaEnabled: user.mfaEnabled,
                organizationId: user.organizationId,
                branchId: user.branchId,
            },
        };
    }
    /**
     * Resend OTP
     */
    static async resendOtp(email, type, channel) {
        const user = await prisma_1.default.user.findUnique({
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
            await otpServices_1.OtpService.createAndSendOtp(user.id, user.email, user.phone, type, channel);
            logger_1.default.info(`OTP resent to user ${user.email}: ${type} via ${channel}`);
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
    static async forgotPassword(email) {
        const user = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (user) {
            // Check if user uses social auth
            if (user.authProvider !== client_1.AuthProvider.LOCAL) {
                const providerName = this.getProviderName(user.authProvider);
                return {
                    message: `This account uses ${providerName} authentication. Please reset your password through ${providerName}.`,
                    requiresSocialAuth: true,
                    provider: user.authProvider,
                };
            }
            // Send password reset OTP
            await otpServices_1.OtpService.createAndSendOtp(user.id, user.email, user.phone, 'PASSWORD_RESET', 'EMAIL');
            logger_1.default.info(`Password reset OTP sent to ${user.email}`);
        }
        // Always return the same message to prevent email enumeration
        return {
            message: 'If the email exists in our system, a password reset code has been sent.',
        };
    }
    /**
     * Reset password with a verified reset code.
     *
     * The lookup is scoped to the account named by `dto.email`. It previously matched
     * `code` across every user's live PASSWORD_RESET tokens, so a single guessed
     * 6-digit code reset whichever account happened to hold it — the attacker didn't
     * need to know, or even target, a specific user.
     */
    static async resetPassword(dto, ipAddress, userAgent) {
        const user = await prisma_1.default.user.findUnique({ where: { email: dto.email } });
        // Same opaque error for "no such user" and "bad code" so this can't be used to
        // enumerate accounts.
        const invalidToken = new errors_1.BadRequestError('Invalid or expired reset code. Please request a new one.');
        if (!user) {
            throw invalidToken;
        }
        const otpRecord = await prisma_1.default.otpToken.findFirst({
            where: {
                userId: user.id,
                code: dto.token,
                type: 'PASSWORD_RESET',
                verifiedAt: { not: null },
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!otpRecord) {
            throw invalidToken;
        }
        // A social-auth account has no local credential to reset. An invited staff
        // account is LOCAL with passwordHash still null — that's the credential-setup
        // path and must be allowed through.
        if (user.authProvider !== client_1.AuthProvider.LOCAL) {
            throw new errors_1.BadRequestError('This account uses social authentication. Password cannot be reset here.');
        }
        // Check if new password is same as old
        if (user.passwordHash) {
            const isSamePassword = await bcryptjs_1.default.compare(dto.newPassword, user.passwordHash);
            if (isSamePassword) {
                throw new errors_1.BadRequestError('New password cannot be the same as your current password');
            }
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(dto.newPassword, config_1.config.security.bcryptRounds);
        // Update password and invalidate all sessions/tokens
        await prisma_1.default.$transaction(async (tx) => {
            // Update password.
            //
            // Deliberately does NOT touch `status`: an account suspended by an
            // administrator must stay suspended. This used to flip SUSPENDED → ACTIVE,
            // which let any suspended user reinstate themselves via forgot-password.
            // PENDING_VERIFICATION is promoted because completing an emailed code proves
            // control of the address, which is exactly what that state is waiting on.
            await tx.user.update({
                where: { id: user.id },
                data: {
                    passwordHash: hashedPassword,
                    ...(user.status === client_1.UserStatus.PENDING_VERIFICATION
                        ? { status: client_1.UserStatus.ACTIVE, isEmailVerified: true }
                        : {}),
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
        emailService_1.EmailService.sendPasswordChangeNotification(user.email, user.firstName).catch((error) => {
            logger_1.default.error('Failed to send password change notification:', error);
        });
        logger_1.default.info(`Password reset completed for user: ${user.email}`);
        return {
            message: 'Password reset successfully. Please log in with your new password.',
        };
    }
    /**
     * Change password (when user is logged in)
     */
    static async changePassword(userId, dto, currentSessionId, ipAddress, userAgent) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        // Check if user uses local auth
        if (user.authProvider !== client_1.AuthProvider.LOCAL || !user.passwordHash) {
            throw new errors_1.BadRequestError('This account uses social authentication. Password cannot be changed here.');
        }
        // Verify current password
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(dto.currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new errors_1.BadRequestError('Current password is incorrect');
        }
        // Check if new password is different from current
        if (dto.currentPassword === dto.newPassword) {
            throw new errors_1.BadRequestError('New password must be different from your current password');
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(dto.newPassword, config_1.config.security.bcryptRounds);
        // Update password, keeping current session alive
        await prisma_1.default.$transaction(async (tx) => {
            // Update password
            await tx.user.update({
                where: { id: userId },
                data: { passwordHash: hashedPassword },
            });
            // Delete all other sessions except current. currentSessionId holds the
            // Session's opaque `token` value, not its DB `id`.
            await tx.session.deleteMany({
                where: {
                    userId,
                    token: { not: currentSessionId },
                },
            });
            // Revoke every refresh token that isn't the current session's.
            //
            // Refresh tokens carry their session's opaque token as `family`, so "keep the
            // caller signed in" is exactly "keep this one family". This used to keep
            // whichever token happened to be newest, which is the caller's only by
            // coincidence — on an account with concurrent sessions a password change could
            // preserve an intruder's session and revoke the owner's instead.
            await tx.refreshToken.updateMany({
                where: {
                    userId,
                    revokedAt: null,
                    family: { not: currentSessionId },
                },
                data: { revokedAt: new Date() },
            });
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
        emailService_1.EmailService.sendPasswordChangeNotification(user.email, user.firstName).catch((error) => {
            logger_1.default.error('Failed to send password change notification:', error);
        });
        logger_1.default.info(`Password changed for user: ${user.email}`);
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
    static async getProfile(userId) {
        const user = await prisma_1.default.user.findUnique({
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
            throw new errors_1.NotFoundError('User not found');
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
    static async updateProfile(userId, dto, ipAddress, userAgent) {
        // Check if phone is already taken
        if (dto.phone) {
            const existingPhone = await prisma_1.default.user.findFirst({
                where: {
                    phone: dto.phone,
                    id: { not: userId },
                },
            });
            if (existingPhone) {
                throw new errors_1.ConflictError('Phone number is already in use by another account');
            }
        }
        // Build update data
        const updateData = {};
        if (dto.firstName !== undefined)
            updateData.firstName = dto.firstName;
        if (dto.lastName !== undefined)
            updateData.lastName = dto.lastName;
        if (dto.phone !== undefined)
            updateData.phone = dto.phone || null;
        // Only update if there are changes
        if (Object.keys(updateData).length === 0) {
            throw new errors_1.BadRequestError('No fields to update');
        }
        // Update user
        const updatedUser = await prisma_1.default.user.update({
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
        await auditService_1.AuditService.log({
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
        logger_1.default.info(`Profile updated for user: ${userId}`);
        return updatedUser;
    }
    /**
     * Upload avatar
     */
    static async uploadAvatar(userId, file, fileService) {
        if (!file) {
            throw new errors_1.BadRequestError('No file uploaded');
        }
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new errors_1.BadRequestError(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`);
        }
        // Validate file size
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new errors_1.BadRequestError('File size exceeds 5MB limit');
        }
        // Upload to Cloudinary
        const { url: avatarUrl } = await fileService.uploadFile(file.path, file.originalname, file.mimetype);
        // Delete old avatar if exists
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true },
        });
        if (user?.avatarUrl) {
            const oldPublicId = fileService.extractPublicId(user.avatarUrl);
            if (oldPublicId) {
                await fileService.deleteFile(oldPublicId).catch((error) => {
                    logger_1.default.error('Failed to delete old avatar:', error);
                });
            }
        }
        // Update user avatar
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { avatarUrl },
        });
        logger_1.default.info(`Avatar updated for user: ${userId}`);
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
    static async deactivateAccount(userId, ipAddress, userAgent) {
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { status: client_1.UserStatus.INACTIVE },
        });
        // Invalidate all sessions
        await sessionService_1.SessionService.invalidateAllUserSessions(userId);
        await tokenService_1.TokenService.revokeAllUserTokens(userId);
        // Log account deactivation
        await auditService_1.AuditService.log({
            userId,
            action: 'ACCOUNT_DEACTIVATED',
            resource: 'USER',
            resourceId: userId,
            ipAddress,
            userAgent,
        });
        logger_1.default.info(`Account deactivated: ${userId}`);
        return { message: 'Account deactivated successfully' };
    }
    /**
     * Reactivate user account
     */
    static async reactivateAccount(userId, ipAddress, userAgent) {
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { status: client_1.UserStatus.ACTIVE },
        });
        // Log account reactivation
        await auditService_1.AuditService.log({
            userId,
            action: 'ACCOUNT_REACTIVATED',
            resource: 'USER',
            resourceId: userId,
            ipAddress,
            userAgent,
        });
        logger_1.default.info(`Account reactivated: ${userId}`);
        return { message: 'Account reactivated successfully' };
    }
    /**
     * Delete user account (soft delete with anonymization)
     */
    static async deleteAccount(userId, ipAddress, userAgent) {
        // Soft delete - anonymize personal data
        await prisma_1.default.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: {
                    deletedAt: new Date(),
                    status: client_1.UserStatus.INACTIVE,
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
        logger_1.default.info(`Account deleted: ${userId}`);
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
    static getRolePermissions(role) {
        const permissions = {
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
    static hasPermission(userRole, permission) {
        const permissions = this.getRolePermissions(userRole);
        return permissions.includes(permission);
    }
    /**
     * Check if user has any of the required roles
     */
    static hasRole(userRole, allowedRoles) {
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
    static validateUserStatus(status) {
        switch (status) {
            case client_1.UserStatus.SUSPENDED:
                throw new errors_1.UnauthorizedError('Your account has been suspended. Please contact support for assistance.');
            case client_1.UserStatus.INACTIVE:
                throw new errors_1.UnauthorizedError('Your account is inactive. Please contact support to reactivate your account.');
            case client_1.UserStatus.PENDING_VERIFICATION:
                // Allow login but restrict features
                break;
            case client_1.UserStatus.ACTIVE:
                // Full access
                break;
            default:
                throw new errors_1.UnauthorizedError('Invalid account status');
        }
    }
    /**
     * Count failed login attempts that still count against the lockout threshold.
     *
     * Only failures newer than the last successful login are counted, so signing in
     * successfully clears the streak. The audit rows themselves are never deleted —
     * they're the audit trail — the cutoff just stops stale failures from locking a
     * user who has since logged in fine.
     */
    static async getRecentFailedLoginAttempts(userId) {
        const lockoutWindow = new Date(Date.now() - config_1.config.security.loginLockoutMinutes * 60 * 1000);
        const lastSuccess = await prisma_1.default.auditLog.findFirst({
            where: {
                userId,
                action: 'LOGIN_SUCCESS',
                createdAt: { gte: lockoutWindow },
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
        });
        const since = lastSuccess && lastSuccess.createdAt > lockoutWindow ? lastSuccess.createdAt : lockoutWindow;
        return prisma_1.default.auditLog.count({
            where: {
                userId,
                action: 'LOGIN_FAILED',
                createdAt: { gt: since },
            },
        });
    }
    /**
     * Get provider name from enum
     */
    static getProviderName(provider) {
        switch (provider) {
            case client_1.AuthProvider.GOOGLE:
                return 'Google';
            case client_1.AuthProvider.APPLE:
                return 'Apple';
            default:
                return 'Unknown';
        }
    }
    /**
     * Get OTP type label
     */
    static getOtpTypeLabel(type) {
        const labels = {
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
    static getAccountLockedEmailTemplate(firstName) {
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
            <p>If this was you, please wait ${config_1.config.security.loginLockoutMinutes} minutes and try again, or use the "Forgot Password" option.</p>
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
    static async isEmailTaken(email, excludeUserId) {
        const user = await prisma_1.default.user.findFirst({
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
    static async isPhoneTaken(phone, excludeUserId) {
        const user = await prisma_1.default.user.findFirst({
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
    static generateSecureToken(length = 32) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map