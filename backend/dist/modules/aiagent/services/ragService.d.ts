import { IngestDocumentInput, RagQueryInput, RagDocumentQueryInput } from '../validators/aiagentValidators';
import { RagQueryResponse, RagDocumentResponse } from '../../../types/aiagentTypes';
export declare class RagService {
    /**
     * ============================================
     * INGEST DOCUMENT
     * ============================================
     */
    static ingestDocument(file: Express.Multer.File, data: IngestDocumentInput, userId: string): Promise<RagDocumentResponse>;
    /**
     * ============================================
     * QUERY RAG
     * ============================================
     */
    static query(data: RagQueryInput): Promise<RagQueryResponse>;
    /**
     * ============================================
     * LIST RAG DOCUMENTS
     * ============================================
     */
    static listDocuments(query: RagDocumentQueryInput): Promise<{
        documents: RagDocumentResponse[];
        pagination: any;
    }>;
    /**
     * ============================================
     * DELETE DOCUMENT
     * ============================================
     */
    static deleteDocument(id: string, userId: string): Promise<void>;
    private static chunkText;
    private static formatDocumentResponse;
}
//# sourceMappingURL=ragService.d.ts.map