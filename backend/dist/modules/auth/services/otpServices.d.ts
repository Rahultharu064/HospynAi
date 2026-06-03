export declare class OtpService {
    static generateOtp(): string;
    static createAndSendOtp(userId: string, email: string, phone: string | null, type: 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR', channel: 'EMAIL' | 'SMS'): Promise<void>;
    static verifyOtp(userId: string, code: string, type: string): Promise<boolean>;
}
//# sourceMappingURL=otpServices.d.ts.map