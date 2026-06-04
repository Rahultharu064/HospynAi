export declare const config: {
    port: string | number;
    nodeEnv: string;
    database: {
        url: string;
        poolMin: number;
        poolMax: number;
    };
    jwt: {
        accessTokenSecret: string;
        refreshTokenSecret: string;
        accessTokenExpiry: string;
        refreshTokenExpiry: string;
        issuer: string;
        audience: string;
    };
    otp: {
        length: number;
        expiryMinutes: number;
        maxAttempts: number;
    };
    google: {
        clientId: string;
        clientSecret: string;
        callbackUrl: string;
    };
    security: {
        bcryptRounds: number;
        rateLimitWindow: number;
        rateLimitMax: number;
        maxLoginAttempts: number;
        loginLockoutMinutes: number;
    };
    email: {
        from: string;
        sendgridApiKey: string;
        smtp: {
            host: string;
            port: number;
            user: string;
            password: string;
        };
    };
    twilio: {
        accountSid: string;
        authToken: string;
        phoneNumber: string;
    };
    upload: {
        maxFileSize: number;
        allowedMimeTypes: string[];
        cloudinaryCloudName: string;
        cloudinaryApiKey: string;
        cloudinaryApiSecret: string;
        cloudinaryFolder: string;
    };
    redis: {
        url: string;
        password: string;
    };
    frontendUrl: string;
};
//# sourceMappingURL=index.d.ts.map