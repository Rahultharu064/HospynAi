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
        /** smtp | sendgrid — use smtp for Gmail / Mailtrap */
        provider: string;
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
        provider: "cloudinary";
        cloudinaryCloudName: string;
        cloudinaryApiKey: string;
        cloudinaryApiSecret: string;
        cloudinaryFolder: string;
    };
    redis: {
        url: string;
        password: string;
    };
    groq: {
        apiKey: string;
        baseUrl: string;
        model: string;
        whisperModel: string;
    };
    /** Vectorless RAG — chunks stored in PostgreSQL, no Qdrant/embeddings required */
    rag: {
        chunkSize: number;
        chunkOverlap: number;
        defaultMaxResults: number;
    };
    /** Optional — only if you add embedding-based features later */
    openai: {
        apiKey: string;
        embeddingModel: string;
    };
    blockchain: {
        enabled: boolean;
        networkId: number;
        privateKey: string;
        rpcUrl: string;
        polygonMainnetRpc: string;
        polygonAmoyRpc: string;
        deploymentsFile: string;
        defaultProviderAddress: string;
        contracts: {
            medicalRecordAnchor: string;
            patientConsent: string;
            prescriptionVerifier: string;
            medicalDataRegistry: string;
        };
    };
    frontendUrl: string;
};
//# sourceMappingURL=index.d.ts.map