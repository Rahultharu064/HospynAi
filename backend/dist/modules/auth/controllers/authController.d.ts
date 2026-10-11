import { NextFunction, Request, Response } from 'express';
export declare class AuthController {
    static register: (req: Request, res: Response, next: NextFunction) => void;
    /** Staff provisioning — guarded by authenticate + authorize(SUPER_ADMIN, ADMIN) on the route. */
    static createStaff: (req: Request, res: Response, next: NextFunction) => void;
    static login: (req: Request, res: Response, next: NextFunction) => void;
    static logout: (req: Request, res: Response, next: NextFunction) => void;
    /** Sign out of every device — revokes all sessions and refresh tokens. */
    static logoutAll: (req: Request, res: Response, next: NextFunction) => void;
    /** "Where you're signed in" — active sessions for the current user. */
    static listSessions: (req: Request, res: Response, next: NextFunction) => void;
    /** Revoke a single other session. Scoped to the caller's own sessions. */
    static revokeSession: (req: Request, res: Response, next: NextFunction) => void;
    static verifyOtp: (req: Request, res: Response, next: NextFunction) => void;
    static resendOtp: (req: Request, res: Response, next: NextFunction) => void;
    static refreshToken: (req: Request, res: Response, next: NextFunction) => void;
    static forgotPassword: (req: Request, res: Response, next: NextFunction) => void;
    static resetPassword: (req: Request, res: Response, next: NextFunction) => void;
    static changePassword: (req: Request, res: Response, next: NextFunction) => void;
    static getMe: (req: Request, res: Response, next: NextFunction) => void;
    static updateProfile: (req: Request, res: Response, next: NextFunction) => void;
    static uploadAvatar: (req: Request, res: Response, next: NextFunction) => void;
    static deactivateAccount: (req: Request, res: Response, next: NextFunction) => void;
    static googleCallback: (req: Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=authController.d.ts.map