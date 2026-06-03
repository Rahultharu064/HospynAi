declare class EmailServiceClass {
    private transporter;
    private useSendGrid;
    constructor();
    sendMail(to: string, subject: string, html: string): Promise<void>;
    sendOtpEmail(to: string, otp: string, type: string): Promise<void>;
    sendWelcomeEmail(to: string, firstName: string): Promise<void>;
    sendPasswordChangeNotification(to: string, firstName: string): Promise<void>;
    private getOtpTemplate;
}
export declare const EmailService: EmailServiceClass;
export {};
//# sourceMappingURL=emailService.d.ts.map