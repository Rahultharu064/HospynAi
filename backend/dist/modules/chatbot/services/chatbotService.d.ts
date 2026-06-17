import { ChatMessageInput, AudioMessageInput, ChatHistoryInput } from '../validators/chatbotValidator';
import { ChatResponse, AudioChatResponse, ChatHistoryResponse } from '../../../types/chatbotTypes';
export declare class ChatbotService {
    static processTextMessage(data: ChatMessageInput, userId: string, ipAddress: string): Promise<ChatResponse>;
    static processAudioMessage(audioFile: Express.Multer.File | Buffer, data: AudioMessageInput, userId: string, ipAddress?: string): Promise<AudioChatResponse>;
    static streamTextMessage(data: ChatMessageInput, userId: string, callbacks: {
        onToken: (token: string) => void;
        onComplete: (response: ChatResponse) => void;
        onError: (error: Error) => void;
    }): Promise<void>;
    static getChatHistory(query: ChatHistoryInput): Promise<ChatHistoryResponse>;
    static clearHistory(sessionId?: string, patientId?: string): Promise<void>;
    static getChatStats(): Promise<any>;
    private static getRecentHistory;
    private static saveConversation;
    private static executeFunction;
    private static scheduleAppointment;
    private static generateSuggestedActions;
}
//# sourceMappingURL=chatbotService.d.ts.map