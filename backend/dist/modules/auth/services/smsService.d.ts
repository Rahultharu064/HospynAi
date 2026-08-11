declare class SmsServiceClass {
    private client;
    constructor();
    sendSms(to: string, body: string): Promise<boolean>;
    sendOtpSms(phone: string, otp: string): Promise<void>;
}
export declare const SmsService: SmsServiceClass;
export {};
//# sourceMappingURL=smsService.d.ts.map