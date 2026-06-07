export declare class TwilioClient {
    private client;
    private twiml;
    constructor();
    /**
     * Initiate outbound call
     */
    makeCall(to: string, from: string, twimlUrl: string, statusCallback?: string): Promise<{
        callSid: string;
        status: string;
    }>;
    /**
     * Generate greeting TwiML for outbound calls
     */
    generateGreetingTwiML(message?: string): string;
    /**
     * Generate TwiML for incoming call handling
     */
    generateIncomingTwiML(): string;
    /**
     * Generate AI response TwiML
     */
    generateResponseTwiML(message: string, gatherAfter?: boolean): string;
    /**
     * Generate transfer to human TwiML
     */
    generateTransferTwiML(transferTo: string, message?: string): string;
    /**
     * Generate voicemail TwiML
     */
    generateVoicemailTwiML(): string;
    /**
     * Generate end call TwiML
     */
    generateEndCallTwiML(message?: string): string;
    /**
     * Get call details
     */
    getCall(callSid: string): Promise<any>;
    /**
     * Update call
     */
    updateCall(callSid: string, twiml: string): Promise<void>;
    /**
     * Hang up call
     */
    hangUpCall(callSid: string): Promise<void>;
    /**
     * Get active calls
     */
    getActiveCalls(): Promise<any[]>;
}
export declare const twilioClient: TwilioClient;
//# sourceMappingURL=twilioClient.d.ts.map