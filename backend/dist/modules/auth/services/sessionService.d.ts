export declare class SessionService {
    /**
     * Create a session and return its opaque token.
     *
     * The returned value is what gets embedded in the JWT as `sessionId` and what
     * authMiddleware looks up — the DB `id` is never used for that.
     *
     * Session lifetime intentionally matches the refresh-token lifetime for the same
     * login (7 days, or 30 with "remember me"). They used to disagree — sessions got
     * 1 day while refresh tokens got 7 — which meant a "remember me" login silently
     * died after a day.
     */
    static createSession(userId: string, ipAddress: string, userAgent: string, rememberMe?: boolean): Promise<string>;
    static validateSession(token: string): Promise<boolean>;
    static invalidateSession(token: string): Promise<void>;
    static invalidateAllUserSessions(userId: string): Promise<void>;
    /**
     * List a user's live sessions for the "where you're signed in" view.
     *
     * The opaque token is never returned — it's a bearer credential. `current` is
     * derived by comparing against the caller's own session token server-side.
     */
    static listActiveSessions(userId: string, currentSessionToken?: string): Promise<{
        current: boolean;
        id: string;
        createdAt: Date;
        ipAddress: string;
        userAgent: string;
        expiresAt: Date;
        lastActivity: Date;
    }[]>;
    /**
     * Revoke one session by its DB id, scoped to its owner so a caller can't revoke
     * someone else's session by guessing an id.
     */
    static revokeSessionById(userId: string, sessionId: string): Promise<boolean>;
    static cleanupExpiredSessions(): Promise<void>;
}
//# sourceMappingURL=sessionService.d.ts.map