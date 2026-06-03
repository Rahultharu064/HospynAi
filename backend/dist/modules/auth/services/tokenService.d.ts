import { TokenPayload, AuthTokens } from '../../../types/authTypes';
export declare class TokenService {
    static generateAccessToken(payload: TokenPayload): string;
    static generateRefreshToken(): string;
    static createAuthTokens(userId: string, email: string, role: string, sessionId: string, rememberMe?: boolean): Promise<AuthTokens>;
    static rotateRefreshToken(oldRefreshToken: string): Promise<AuthTokens>;
    static revokeAllUserTokens(userId: string): Promise<void>;
}
//# sourceMappingURL=tokenService.d.ts.map