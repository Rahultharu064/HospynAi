import { UserRole } from '@prisma/client';
import { RegisterInput, LoginInput, ResetPasswordInput, ChangePasswordInput, UpdateProfileInput } from '../validators/authValidator';
export declare class AuthService {
    /**
     * ============================================
     * REGISTRATION
     * ============================================
     */
    /**
     * Register a new user
     */
    static register(dto: RegisterInput, ipAddress: string, userAgent: string): Promise<{
        userId: string;
        email: string;
        message: string;
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
     * Verify OTP code
     */
    static verifyOtp(email: string, code: string, type: string, ipAddress: string, userAgent: string): Promise<{
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
     * Reset password with token
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
     * Get recent failed login attempts count
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