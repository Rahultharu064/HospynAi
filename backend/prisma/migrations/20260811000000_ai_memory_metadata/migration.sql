-- Add metadata column to ai_memories for storing tags, source, and sessionId
ALTER TABLE "ai_memories" ADD COLUMN "metadata" JSONB;
