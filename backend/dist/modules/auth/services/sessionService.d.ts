export declare class SessionService {
    static createSession(userId: string, ipAddress: string, userAgent: string, rememberMe?: boolean): Promise<string>;
    static validateSession(token: string): Promise<boolean>;
    static invalidateSession(token: string): Promise<void>;
    static invalidateAllUserSessions(userId: string): Promise<void>;
    static cleanupExpiredSessions(): Promise<void>;
}
//# sourceMappingURL=sessionService.d.ts.map