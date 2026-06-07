import { Request, Response, NextFunction } from 'express';
export declare function validateTwilioSignature(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
export declare function handleIncomingCallWebhook(req: Request, res: Response): Promise<void>;
export declare function handleVoiceInputWebhook(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleStatusCallbackWebhook(req: Request, res: Response): Promise<void>;
export declare function handleVoicemailWebhook(req: Request, res: Response): Promise<void>;
export declare function handleTranscriptionWebhook(req: Request, res: Response): Promise<void>;
export declare function handleRecordingWebhook(req: Request, res: Response): Promise<void>;
export declare function handleTransferWebhook(req: Request, res: Response): Promise<void>;
export declare function handleEmergencyWebhook(req: Request, res: Response): Promise<void>;
export declare function handleGatherFallbackWebhook(req: Request, res: Response): Promise<void>;
export declare function twilioErrorHandler(err: Error, req: Request, res: Response, next: NextFunction): void;
declare const _default: {
    validateTwilioSignature: typeof validateTwilioSignature;
    handleIncomingCallWebhook: typeof handleIncomingCallWebhook;
    handleVoiceInputWebhook: typeof handleVoiceInputWebhook;
    handleStatusCallbackWebhook: typeof handleStatusCallbackWebhook;
    handleVoicemailWebhook: typeof handleVoicemailWebhook;
    handleTranscriptionWebhook: typeof handleTranscriptionWebhook;
    handleRecordingWebhook: typeof handleRecordingWebhook;
    handleTransferWebhook: typeof handleTransferWebhook;
    handleEmergencyWebhook: typeof handleEmergencyWebhook;
    handleGatherFallbackWebhook: typeof handleGatherFallbackWebhook;
    twilioErrorHandler: typeof twilioErrorHandler;
};
export default _default;
//# sourceMappingURL=twilioWebhook.d.ts.map