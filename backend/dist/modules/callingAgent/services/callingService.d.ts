import { InitiateCallInput, TransferToHumanInput, CallQueryInput } from '../validators/callingValidator';
import { CallListResponse, OutboundCallResponse, CallStats, ActiveCall, CallTranscript } from '../../../types/callingTypes';
export declare class CallingService {
    static initiateOutboundCall(data: InitiateCallInput, userId: string): Promise<OutboundCallResponse>;
    static handleIncomingCall(twilioRequest: any): Promise<string>;
    static processVoiceInput(twilioRequest: any): Promise<string>;
    private static handleEmergency;
    static transferToHuman(data: TransferToHumanInput, userId: string): Promise<{
        twiml: string;
    }>;
    static handleStatusCallback(statusData: any): Promise<void>;
    static handleVoicemail(data: any): Promise<void>;
    static handleTranscription(data: any): Promise<void>;
    static handleRecording(data: any): Promise<void>;
    static getCallLogs(query: CallQueryInput): Promise<CallListResponse>;
    static getCallTranscript(callSid: string): Promise<CallTranscript | null>;
    static getCallStats(): Promise<CallStats>;
    static getActiveCalls(): Promise<ActiveCall[]>;
    private static formatCallResponse;
}
//# sourceMappingURL=callingService.d.ts.map