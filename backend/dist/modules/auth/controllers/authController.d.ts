import { Request, Response } from 'express';
export declare class AuthController {
    static register: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static login: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static logout: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static verifyOtp: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static resendOtp: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static refreshToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static forgotPassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static resetPassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static changePassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getMe: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static uploadAvatar: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static googleCallback: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=authController.d.ts.map