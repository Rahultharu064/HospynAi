-- Vectorless RAG: store document chunks in PostgreSQL (full-text search, no vector DB)

CREATE TABLE "rag_chunks" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "token_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_chunks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rag_chunks_document_id_idx" ON "rag_chunks"("document_id");

CREATE INDEX "rag_chunks_content_fts_idx" ON "rag_chunks"
  USING gin (to_tsvector('english', "content"));

ALTER TABLE "rag_chunks" ADD CONSTRAINT "rag_chunks_document_id_fkey"
  FOREIGN KEY ("document_id") REFERENCES "rag_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
