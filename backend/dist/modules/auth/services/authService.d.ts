import { UserRole } from '@prisma/client';
import { RegisterInput, CreateStaffInput, LoginInput, ResetPasswordInput, ChangePasswordInput, UpdateProfileInput } from '../validators/authValidator';
export declare class AuthService {
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
    static register(dto: RegisterInput, ipAddress: string, userAgent: string): Promise<{
        userId: string;
        email: string;
        message: string;
    }>;
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
    static createStaff(dto: CreateStaffInput, actor: {
        userId: string;
        role: UserRole;
        organizationId: string | null;
    }, ipAddress: string, userAgent: string): Promise<{
        userId: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        message: string;
    }>;
    /**
     * Resolve the acting user's role and tenant from the database rather than trusting
     * the JWT claims. A token minted before a role or org change would otherwise carry
     * stale authority for its full 15-minute life.
     */
    static getActorContext(userId: string): Promise<{
        userId: string;
        role: import(".prisma/client").$Enums.UserRole;
        organizationId: string | null;
    }>;
    /**
     * ============================================
     * LOGIN
     * ============================================
     */
    /**
     * Login user with email and password
     */
    static login(dto: LoginInput, ipAddress: string, userAgent: string): Promise<{
        requiresVerification: boolean;
        userId: string;
        message: string;
        tokens?: undefined;
        user?: undefined;
    } | {
        tokens: import("../../../types/authTypes").AuthTokens;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            avatarUrl: string | null;
            isEmailVerified: boolean;
            isPhoneVerified: boolean;
            mfaEnabled: boolean;
            organizationId: string | null;
            branchId: string | null;
        };
        requiresVerification?: undefined;
        userId?: undefined;
        message?: undefined;
    }>;
    /**
     * Login with Google OAuth
     */
    static googleLogin(googleProfile: any, ipAddress: string, userAgent: string): Promise<{
        tokens: import("../../../types/authTypes").AuthTokens;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            avatarUrl: string | null;
            isNewUser: boolean;
        };
    }>;
    /**
     * ============================================
     * LOGOUT
     * ============================================
     */
    /**
     * Logout user
     */
    static logout(userId: string, sessionId: string, refreshToken?: string): Promise<void>;
    /**
     * Logout from all devices
     */
    static logoutAll(userId: string): Promise<{
        message: string;
    }>;
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
    static verifyOtp(email: string, code: string, type: string, ipAddress: string, userAgent: string): Promise<{
        message: string;
        isEmailVerified: boolean;
    } | {
        tokens: import("../../../types/authTypes").AuthTokens;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            avatarUrl: string | null;
            isEmailVerified: boolean;
            isPhoneVerified: boolean;
            mfaEnabled: boolean;
            organizationId: string | null;
            branchId: string | null;
        };
        message: string;
        isEmailVerified: boolean;
    }>;
    /**
     * Resend OTP
     */
    static resendOtp(email: string, type: string, channel: string): Promise<{
        message: string;
    }>;
    /**
     * ============================================
     * PASSWORD MANAGEMENT
     * ============================================
     */
    /**
     * Forgot password - send reset OTP
     */
    static forgotPassword(email: string): Promise<{
        message: string;
        requiresSocialAuth: boolean;
        provider: "GOOGLE" | "APPLE";
    } | {
        message: string;
        requiresSocialAuth?: undefined;
        provider?: undefined;
    }>;
    /**
     * Reset password with a verified reset code.
     *
     * The lookup is scoped to the account named by `dto.email`. It previously matched
     * `code` across every user's live PASSWORD_RESET tokens, so a single guessed
     * 6-digit code reset whichever account happened to hold it — the attacker didn't
     * need to know, or even target, a specific user.
     */
    static resetPassword(dto: ResetPasswordInput, ipAddress: string, userAgent: string): Promise<{
        message: string;
    }>;
    /**
     * Change password (when user is logged in)
     */
    static changePassword(userId: string, dto: ChangePasswordInput, currentSessionId: string, ipAddress: string, userAgent: string): Promise<{
        message: string;
    }>;
    /**
     * ============================================
     * PROFILE MANAGEMENT
     * ============================================
     */
    /**
     * Get current user profile
     */
    static getProfile(userId: string): Promise<{
        user: {
            activeSessions: number;
            organization: {
                id: string;
                name: string;
                slug: string;
            } | null;
            branch: {
                id: string;
                name: string;
            } | null;
            email: string;
            id: string;
            phone: string | null;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
            authProvider: import(".prisma/client").$Enums.AuthProvider;
            avatarUrl: string | null;
            isEmailVerified: boolean;
            isPhoneVerified: boolean;
            lastLoginAt: Date | null;
            lastLoginIp: string | null;
            mfaEnabled: boolean;
            organizationId: string | null;
            branchId: string | null;
            createdAt: Date;
            updatedAt: Date;
            _count: {
                sessions: number;
            };
        };
        permissions: string[];
    }>;
    /**
     * Update user profile
     */
    static updateProfile(userId: string, dto: UpdateProfileInput, ipAddress: string, userAgent: string): Promise<{
        email: string;
        id: string;
        phone: string | null;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        avatarUrl: string | null;
        updatedAt: Date;
    }>;
    /**
     * Upload avatar
     */
    static uploadAvatar(userId: string, file: Express.Multer.File, fileService: any): Promise<{
        avatarUrl: any;
    }>;
    /**
     * ============================================
     * ACCOUNT MANAGEMENT
     * ============================================
     */
    /**
     * Deactivate user account
     */
    static deactivateAccount(userId: string, ipAddress: string, userAgent: string): Promise<{
        message: string;
    }>;
    /**
     * Reactivate user account
     */
    static reactivateAccount(userId: string, ipAddress: string, userAgent: string): Promise<{
        message: string;
    }>;
    /**
     * Delete user account (soft delete with anonymization)
     */
    static deleteAccount(userId: string, ipAddress: string, userAgent: string): Promise<{
        message: string;
    }>;
    /**
     * ============================================
     * PERMISSIONS & ROLES
     * ============================================
     */
    /**
     * Get role permissions - Complete permission matrix
     */
    static getRolePermissions(role: UserRole): string[];
    /**
     * Check if user has a specific permission
     */
    static hasPermission(userRole: UserRole, permission: string): boolean;
    /**
     * Check if user has any of the required roles
     */
    static hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean;
    /**
     * ============================================
     * UTILITY METHODS
     * ============================================
     */
    /**
     * Validate user status
     */
    private static validateUserStatus;
    /**
     * Count failed login attempts that still count against the lockout threshold.
     *
     * Only failures newer than the last successful login are counted, so signing in
     * successfully clears the streak. The audit rows themselves are never deleted —
     * they're the audit trail — the cutoff just stops stale failures from locking a
     * user who has since logged in fine.
     */
    private static getRecentFailedLoginAttempts;
    /**
     * Get provider name from enum
     */
    private static getProviderName;
    /**
     * Get OTP type label
     */
    private static getOtpTypeLabel;
    /**
     * Get account locked email template
     */
    private static getAccountLockedEmailTemplate;
    /**
     * Check if email is already registered
     */
    static isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
    /**
     * Check if phone is already registered
     */
    static isPhoneTaken(phone: string, excludeUserId?: string): Promise<boolean>;
    /**
     * Generate secure random token
     */
    static generateSecureToken(length?: number): string;
}
//# sourceMappingURL=authService.d.ts.map