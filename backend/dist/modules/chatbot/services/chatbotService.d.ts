import { ChatMessageInput, AudioMessageInput, ChatHistoryInput } from '../validators/chatbotValidator';
import { ChatResponse, AudioChatResponse, ChatHistoryResponse } from '../../../types/chatbotTypes';
export declare class ChatbotService {
    /**
     * `patientId` arrives from the caller (or from a tool argument the model inferred
     * out of user text), and the record behind it holds allergies, chronic conditions
     * and medications. Nothing about being signed in earns you a stranger's chart, so
     * every read of it goes through here first.
     */
    private static assertPatientAccess;
    static processTextMessage(data: ChatMessageInput, userId: string, ipAddress: string): Promise<ChatResponse>;
    static processAudioMessage(audioFile: Express.Multer.File | Buffer, data: AudioMessageInput, userId: string, ipAddress?: string): Promise<AudioChatResponse>;
    static streamTextMessage(data: ChatMessageInput, userId: string, callbacks: {
        onToken: (token: string) => void;
        onComplete: (response: ChatResponse) => void;
        onError: (error: Error) => void;
    }): Promise<void>;
    /**
     * Scoped to the caller. `sessionId` is a client-supplied uuid, so without the
     * userId filter anyone holding (or guessing) one could read someone else's
     * conversation — and these transcripts discuss symptoms and medications.
     * Staff who pass a `patientId` are checked against that chart first.
     */
    static getChatHistory(query: ChatHistoryInput, userId: string): Promise<ChatHistoryResponse>;
    static clearHistory(userId: string, sessionId?: string, patientId?: string): Promise<void>;
    static getChatStats(): Promise<any>;
    private static getRecentHistory;
    private static saveConversation;
    private static executeFunction;
    private static scheduleAppointment;
    private static generateSuggestedActions;
}
//# sourceMappingURL=chatbotService.d.ts.map