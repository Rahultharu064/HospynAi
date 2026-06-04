/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `branches` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apple_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `document_type` on the `patient_documents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('IN_PERSON', 'TELEMEDICINE', 'WALK_IN', 'EMERGENCY', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'INSURANCE', 'STRIPE', 'KHALTI', 'ESEWA', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'VOICE_CALL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DISCONTINUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LabReportStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('LAB_REPORT', 'PRESCRIPTION', 'INSURANCE_CARD', 'ID_PROOF', 'MEDICAL_CERTIFICATE', 'DISCHARGE_SUMMARY', 'OTHER');

-- CreateEnum
CREATE TYPE "BlockchainRecordType" AS ENUM ('MEDICAL_RECORD', 'PRESCRIPTION', 'CONSENT', 'LAB_REPORT');

-- CreateEnum
CREATE TYPE "VoiceInteractionType" AS ENUM ('APPOINTMENT_BOOKING', 'SYMPTOM_CHECK', 'PRESCRIPTION_QUERY', 'GENERAL_INQUIRY', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('AI_RESOLVED', 'HANDED_OFF', 'MISSED', 'VOICEMAIL', 'ESCALATED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'TRIAL');

-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "code" TEXT,
ADD COLUMN     "is_main_branch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "settings" JSONB;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "address" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "settings" JSONB,
ADD COLUMN     "tax_id" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "patient_documents" DROP COLUMN "document_type",
ADD COLUMN     "document_type" "DocumentType" NOT NULL;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "family_history" JSONB,
ADD COLUMN     "social_history" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "apple_id" TEXT;

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'STARTER',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "maxUsers" INTEGER NOT NULL DEFAULT 10,
    "maxBranches" INTEGER NOT NULL DEFAULT 1,
    "maxStorage" BIGINT NOT NULL DEFAULT 10737418240,
    "features" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "specialization" TEXT,
    "sub_specialization" TEXT,
    "qualification" TEXT,
    "experience" INTEGER,
    "license_number" TEXT,
    "license_expiry" TIMESTAMP(3),
    "biography" TEXT,
    "consultation_fee" DECIMAL(10,2),
    "telemedicine_fee" DECIMAL(10,2),
    "follow_up_fee" DECIMAL(10,2),
    "max_patients_per_day" INTEGER DEFAULT 20,
    "available_for_telemed" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT DEFAULT 'UTC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_schedules" (
    "id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "slot_duration" INTEGER NOT NULL DEFAULT 15,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "break_start" TEXT,
    "break_end" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "organization_id" TEXT,
    "appointment_date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 15,
    "type" "AppointmentType" NOT NULL DEFAULT 'IN_PERSON',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "reason" TEXT,
    "symptoms" TEXT,
    "notes" TEXT,
    "queue_token" TEXT,
    "queue_position" INTEGER,
    "estimated_wait" INTEGER,
    "actual_start_time" TIMESTAMP(3),
    "actual_end_time" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by" TEXT,
    "cancel_reason" TEXT,
    "is_follow_up" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_for_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "doctor_id" TEXT NOT NULL,
    "chief_complaint" TEXT,
    "diagnosis" TEXT,
    "icd10_codes" TEXT[],
    "symptoms" JSONB,
    "vital_signs" JSONB,
    "examination_notes" TEXT,
    "treatment_plan" TEXT,
    "doctor_notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_latest_version" BOOLEAN NOT NULL DEFAULT true,
    "previous_version_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "signed_at" TIMESTAMP(3),
    "signed_by" TEXT,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "medical_record_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "drug_name" TEXT NOT NULL,
    "generic_name" TEXT,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "quantity" TEXT,
    "route" TEXT,
    "instructions" TEXT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "refills_allowed" INTEGER DEFAULT 0,
    "refills_used" INTEGER DEFAULT 0,
    "is_controlled" BOOLEAN NOT NULL DEFAULT false,
    "drug_interactions" JSONB,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_reports" (
    "id" TEXT NOT NULL,
    "medical_record_id" TEXT,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "test_name" TEXT NOT NULL,
    "test_category" TEXT,
    "results" JSONB NOT NULL,
    "normal_ranges" JSONB,
    "interpretation" TEXT,
    "attachments" JSONB,
    "status" "LabReportStatus" NOT NULL DEFAULT 'PENDING',
    "ordered_at" TIMESTAMP(3) NOT NULL,
    "collected_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_logs" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT,
    "user_id" TEXT,
    "appointment_id" TEXT,
    "interaction_type" "VoiceInteractionType" NOT NULL,
    "transcript" TEXT,
    "ai_response" TEXT,
    "audio_url" TEXT,
    "duration" INTEGER,
    "language" TEXT DEFAULT 'en',
    "confidence" DOUBLE PRECISION,
    "intent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_logs" (
    "id" TEXT NOT NULL,
    "call_sid" TEXT NOT NULL,
    "patient_id" TEXT,
    "from_number" TEXT NOT NULL,
    "to_number" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "outcome" "CallOutcome" NOT NULL DEFAULT 'MISSED',
    "duration" INTEGER,
    "transcript" TEXT,
    "recording_url" TEXT,
    "ai_handled" BOOLEAN NOT NULL DEFAULT false,
    "handoff_reason" TEXT,
    "handoff_to" TEXT,
    "metadata" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "tool_calls" JSONB,
    "status" TEXT NOT NULL DEFAULT 'STARTED',
    "duration" INTEGER,
    "tokens_used" INTEGER,
    "cost" DOUBLE PRECISION,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "source_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "chunk_count" INTEGER NOT NULL DEFAULT 0,
    "vector_ids" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_memories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "patient_id" TEXT,
    "memory_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding_id" TEXT,
    "relevance_score" DOUBLE PRECISION,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "patient_id" TEXT,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokens" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain_records" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "medical_record_id" TEXT,
    "record_type" "BlockchainRecordType" NOT NULL,
    "data_hash" TEXT NOT NULL,
    "tx_hash" TEXT,
    "block_number" BIGINT,
    "network_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verified_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "subscription_id" TEXT,
    "organization_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod",
    "gateway_transaction_id" TEXT,
    "gateway_response" JSONB,
    "refund_amount" DECIMAL(10,2),
    "refund_reason" TEXT,
    "refunded_at" TIMESTAMP(3),
    "description" TEXT,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "receipt_url" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "template_id" TEXT,
    "metadata" JSONB,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "drug_name" TEXT NOT NULL,
    "generic_name" TEXT,
    "category" TEXT,
    "manufacturer" TEXT,
    "batch_number" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'tablets',
    "unit_price" DECIMAL(10,2) NOT NULL,
    "selling_price" DECIMAL(10,2) NOT NULL,
    "reorder_level" INTEGER NOT NULL DEFAULT 10,
    "organization_id" TEXT,
    "branch_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_user_id_key" ON "doctor_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_license_number_key" ON "doctor_profiles"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_schedules_doctor_id_day_of_week_key" ON "doctor_schedules"("doctor_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_appointment_id_key" ON "appointments"("appointment_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_queue_token_key" ON "appointments"("queue_token");

-- CreateIndex
CREATE INDEX "appointments_appointment_id_idx" ON "appointments"("appointment_id");

-- CreateIndex
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");

-- CreateIndex
CREATE INDEX "appointments_doctor_id_idx" ON "appointments"("doctor_id");

-- CreateIndex
CREATE INDEX "appointments_appointment_date_idx" ON "appointments"("appointment_date");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_queue_token_idx" ON "appointments"("queue_token");

-- CreateIndex
CREATE INDEX "appointments_organization_id_idx" ON "appointments"("organization_id");

-- CreateIndex
CREATE INDEX "appointments_queue_position_idx" ON "appointments"("queue_position");

-- CreateIndex
CREATE UNIQUE INDEX "medical_records_appointment_id_key" ON "medical_records"("appointment_id");

-- CreateIndex
CREATE INDEX "medical_records_patient_id_idx" ON "medical_records"("patient_id");

-- CreateIndex
CREATE INDEX "medical_records_appointment_id_idx" ON "medical_records"("appointment_id");

-- CreateIndex
CREATE INDEX "medical_records_doctor_id_idx" ON "medical_records"("doctor_id");

-- CreateIndex
CREATE INDEX "medical_records_created_at_idx" ON "medical_records"("created_at");

-- CreateIndex
CREATE INDEX "prescriptions_medical_record_id_idx" ON "prescriptions"("medical_record_id");

-- CreateIndex
CREATE INDEX "prescriptions_patient_id_idx" ON "prescriptions"("patient_id");

-- CreateIndex
CREATE INDEX "prescriptions_doctor_id_idx" ON "prescriptions"("doctor_id");

-- CreateIndex
CREATE INDEX "prescriptions_status_idx" ON "prescriptions"("status");

-- CreateIndex
CREATE INDEX "lab_reports_medical_record_id_idx" ON "lab_reports"("medical_record_id");

-- CreateIndex
CREATE INDEX "lab_reports_patient_id_idx" ON "lab_reports"("patient_id");

-- CreateIndex
CREATE INDEX "lab_reports_doctor_id_idx" ON "lab_reports"("doctor_id");

-- CreateIndex
CREATE INDEX "lab_reports_status_idx" ON "lab_reports"("status");

-- CreateIndex
CREATE INDEX "voice_logs_patient_id_idx" ON "voice_logs"("patient_id");

-- CreateIndex
CREATE INDEX "voice_logs_user_id_idx" ON "voice_logs"("user_id");

-- CreateIndex
CREATE INDEX "voice_logs_created_at_idx" ON "voice_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "call_logs_call_sid_key" ON "call_logs"("call_sid");

-- CreateIndex
CREATE INDEX "call_logs_call_sid_idx" ON "call_logs"("call_sid");

-- CreateIndex
CREATE INDEX "call_logs_patient_id_idx" ON "call_logs"("patient_id");

-- CreateIndex
CREATE INDEX "call_logs_outcome_idx" ON "call_logs"("outcome");

-- CreateIndex
CREATE INDEX "call_logs_started_at_idx" ON "call_logs"("started_at");

-- CreateIndex
CREATE INDEX "agent_logs_user_id_idx" ON "agent_logs"("user_id");

-- CreateIndex
CREATE INDEX "agent_logs_session_id_idx" ON "agent_logs"("session_id");

-- CreateIndex
CREATE INDEX "agent_logs_task_type_idx" ON "agent_logs"("task_type");

-- CreateIndex
CREATE INDEX "agent_logs_created_at_idx" ON "agent_logs"("created_at");

-- CreateIndex
CREATE INDEX "rag_documents_source_type_idx" ON "rag_documents"("source_type");

-- CreateIndex
CREATE INDEX "rag_documents_is_active_idx" ON "rag_documents"("is_active");

-- CreateIndex
CREATE INDEX "ai_memories_user_id_idx" ON "ai_memories"("user_id");

-- CreateIndex
CREATE INDEX "ai_memories_patient_id_idx" ON "ai_memories"("patient_id");

-- CreateIndex
CREATE INDEX "ai_memories_memory_type_idx" ON "ai_memories"("memory_type");

-- CreateIndex
CREATE INDEX "ai_memories_embedding_id_idx" ON "ai_memories"("embedding_id");

-- CreateIndex
CREATE INDEX "conversation_history_session_id_idx" ON "conversation_history"("session_id");

-- CreateIndex
CREATE INDEX "conversation_history_user_id_idx" ON "conversation_history"("user_id");

-- CreateIndex
CREATE INDEX "conversation_history_patient_id_idx" ON "conversation_history"("patient_id");

-- CreateIndex
CREATE INDEX "conversation_history_created_at_idx" ON "conversation_history"("created_at");

-- CreateIndex
CREATE INDEX "blockchain_records_patient_id_idx" ON "blockchain_records"("patient_id");

-- CreateIndex
CREATE INDEX "blockchain_records_tx_hash_idx" ON "blockchain_records"("tx_hash");

-- CreateIndex
CREATE INDEX "blockchain_records_data_hash_idx" ON "blockchain_records"("data_hash");

-- CreateIndex
CREATE INDEX "blockchain_records_status_idx" ON "blockchain_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_invoice_id_key" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_patient_id_idx" ON "payments"("patient_id");

-- CreateIndex
CREATE INDEX "payments_appointment_id_idx" ON "payments"("appointment_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_due_date_idx" ON "payments"("due_date");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "inventory_drug_name_idx" ON "inventory"("drug_name");

-- CreateIndex
CREATE INDEX "inventory_batch_number_idx" ON "inventory"("batch_number");

-- CreateIndex
CREATE INDEX "inventory_expiry_date_idx" ON "inventory"("expiry_date");

-- CreateIndex
CREATE INDEX "inventory_organization_id_idx" ON "inventory"("organization_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs"("organization_id");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_apple_id_key" ON "users"("apple_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_schedules" ADD CONSTRAINT "doctor_schedules_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_logs" ADD CONSTRAINT "voice_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_logs" ADD CONSTRAINT "voice_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_logs" ADD CONSTRAINT "voice_logs_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_logs" ADD CONSTRAINT "agent_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_documents" ADD CONSTRAINT "rag_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_memories" ADD CONSTRAINT "ai_memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_memories" ADD CONSTRAINT "ai_memories_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_history" ADD CONSTRAINT "conversation_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_history" ADD CONSTRAINT "conversation_history_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockchain_records" ADD CONSTRAINT "blockchain_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockchain_records" ADD CONSTRAINT "blockchain_records_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
