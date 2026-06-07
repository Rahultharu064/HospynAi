import { ChatMessageInput, AudioMessageInput, ChatHistoryInput } from '../validators/chatbotValidator';
import { ChatResponse, AudioChatResponse, ChatHistoryResponse, ChatStats } from '../../../types/chatbotTypes';
export declare class ChatbotService {
    /**
     * ============================================
     * TEXT CHAT
     * ============================================
     */
    static processTextMessage(data: ChatMessageInput, userId: string, ipAddress: string): Promise<ChatResponse>;
    /**
     * ============================================
     * VOICE CHAT (Audio to Text to AI to Response)
     * ============================================
     */
    static processAudioMessage(audioFile: Express.Multer.File | Buffer, data: AudioMessageInput, userId: string): Promise<AudioChatResponse>;
    /**
     * ============================================
     * STREAMING TEXT CHAT
     * ============================================
     */
    static streamTextMessage(data: ChatMessageInput, userId: string, callbacks: {
        onToken: (token: string) => void;
        onComplete: (response: ChatResponse) => void;
        onError: (error: Error) => void;
    }): Promise<void>;
    /**
     * ============================================
     * CHAT HISTORY
     * ============================================
     */
    static getChatHistory(query: ChatHistoryInput): Promise<ChatHistoryResponse>;
    /**
     * ============================================
     * CLEAR CHAT HISTORY
     * ============================================
     */
    static clearHistory(sessionId?: string, patientId?: string): Promise<void>;
    /**
     * ============================================
     * CHAT STATISTICS
     * ============================================
     */
    static getChatStats(): Promise<ChatStats>;
    private static getRecentHistory;
    private static saveConversation;
    private static executeFunction;
    private static generateSuggestedActions;
}
//# sourceMappingURL=chatbotService.d.ts.map