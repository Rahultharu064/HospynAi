import { TokenPayload, AuthTokens } from '../../../types/authTypes';
/** Refresh-token lifetime in days. "Remember me" is what makes a login long-lived. */
export declare const REFRESH_TOKEN_DAYS: {
    readonly default: 7;
    readonly rememberMe: 30;
};
export declare function refreshTokenLifetimeDays(rememberMe: boolean): number;
export declare class TokenService {
    static generateAccessToken(payload: TokenPayload): string;
    static generateRefreshToken(): string;
    /**
     * Mint the first access/refresh pair for a freshly created session.
     *
     * The refresh token's `family` is set to the session's opaque token rather than a
     * fresh random value. Both are unguessable random strings, so reuse detection
     * (revoke-everything-sharing-a-family) behaves exactly as before — but it now also
     * tells `rotateRefreshToken` which session a refresh belongs to, which is what
     * lets rotation reuse that session instead of creating a new row every time.
     *
     * @param sessionId the Session's opaque `token` (not its DB id) — this is what
     *   authMiddleware looks up and what ends up in the JWT.
     */
    static createAuthTokens(userId: string, email: string, role: string, sessionId: string, rememberMe?: boolean): Promise<AuthTokens>;
    /**
     * Rotate a refresh token, keeping the caller on the same session.
     *
     * Two things this deliberately does not do:
     *
     *  - It does not create a Session row. It used to, on every single refresh, which
     *    left a trail of live sessions that `logout` never reached (it only kills the
     *    current one) and made `activeSessions` on the profile meaningless.
     *  - It does not reset the refresh window to a fixed 7 days. The rotated token
     *    inherits the original's `expiresAt`, so a 30-day "remember me" login stays
     *    30 days, and a rotation can't be used to extend a session indefinitely.
     */
    static rotateRefreshToken(oldRefreshToken: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens>;
    static revokeAllUserTokens(userId: string): Promise<void>;
    /** Revoke every refresh token issued against a single session. */
    static revokeSessionTokens(sessionToken: string): Promise<void>;
}
//# sourceMappingURL=tokenService.d.ts.map