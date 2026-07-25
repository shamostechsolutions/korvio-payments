-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ADMIN', 'CONTRIBUTOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CLOSED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CampaignCategory" AS ENUM ('WEDDING', 'INTRODUCTION', 'FUNERAL', 'MEDICAL', 'EDUCATION', 'CHURCH', 'ALUMNI', 'COMMUNITY', 'OFFICE', 'BIRTHDAY', 'FAMILY_EMERGENCY', 'ASSOCIATION', 'MEMBERSHIP', 'FUNDRAISING', 'OTHER');

-- CreateEnum
CREATE TYPE "ContributorListVisibility" AS ENUM ('NAMES_AND_STATUSES', 'NAMES_ONLY', 'STATUSES_WITHOUT_NAMES', 'HIDDEN', 'OPT_IN_ONLY', 'AMOUNTS_WHEN_PERMITTED');

-- CreateEnum
CREATE TYPE "AmountVisibility" AS ENUM ('PRIVATE', 'PUBLIC_OPT_IN', 'PUBLIC');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'TREASURER', 'SECRETARY', 'AUDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "AdminStatus" AS ENUM ('INVITED', 'ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "ContributorStatus" AS ENUM ('NOT_JOINED', 'JOINED', 'NOT_YET_PLEDGED', 'PLEDGED', 'PAYMENT_PENDING', 'PARTIALLY_PAID', 'FULLY_PAID', 'PAID_WITHOUT_PLEDGE', 'OVERPAID', 'PAYMENT_FAILED', 'WAIVED', 'ANONYMOUS', 'IN_KIND', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PledgeStatus" AS ENUM ('ACTIVE', 'FULFILLED', 'CANCELLED', 'CHANGED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MTN_MOMO', 'AIRTEL_MONEY', 'BANK', 'CARD', 'CASH', 'CHEQUE', 'CARD_TERMINAL', 'IN_PERSON', 'DIRECT_TO_TREASURER', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'REVERSED');

-- CreateEnum
CREATE TYPE "ExpenseApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InKindStatus" AS ENUM ('PLEDGED', 'DELIVERED', 'VERIFIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('PLEDGE_UNPAID', 'PARTIAL_OUTSTANDING', 'PROMISED_DATE_APPROACHING', 'PROMISED_DATE_PASSED', 'DEADLINE_APPROACHING', 'PAYMENT_FAILED', 'PAYMENT_PENDING_TOO_LONG', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('SCHEDULED', 'PENDING_APPROVAL', 'SENT', 'FAILED', 'CANCELLED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ReminderTone" AS ENUM ('FRIENDLY', 'FORMAL', 'URGENT');

-- CreateEnum
CREATE TYPE "ConversationState" AS ENUM ('IDLE', 'AWAITING_CAMPAIGN_SELECTION', 'AWAITING_MAIN_MENU', 'AWAITING_PLEDGE_AMOUNT', 'AWAITING_PLEDGE_DATE', 'AWAITING_PLEDGE_CONFIRMATION', 'AWAITING_PAYMENT_AMOUNT', 'AWAITING_PAYMENT_METHOD', 'AWAITING_PHONE_CONFIRMATION', 'AWAITING_PAYMENT_COMPLETION', 'AWAITING_REMINDER_CONFIRMATION', 'AWAITING_EXPENSE_DETAILS', 'AWAITING_ADMIN_COMMAND', 'AWAITING_RECORD_PAYMENT', 'AWAITING_CONTACT_MESSAGE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT,
    "profile_image" TEXT,
    "account_type" "AccountType" NOT NULL DEFAULT 'CONTRIBUTOR',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "phone_number" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "campaign_code" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CampaignCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "target_amount" INTEGER NOT NULL,
    "total_pledged" INTEGER NOT NULL DEFAULT 0,
    "total_received" INTEGER NOT NULL DEFAULT 0,
    "total_expenses" INTEGER NOT NULL DEFAULT 0,
    "total_fees" INTEGER NOT NULL DEFAULT 0,
    "total_in_kind_value" INTEGER NOT NULL DEFAULT 0,
    "available_balance" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "image_url" TEXT,
    "organiser_name" TEXT NOT NULL,
    "organiser_phone" TEXT NOT NULL,
    "beneficiary_name" TEXT,
    "contact_person" TEXT,
    "contributor_list_visibility" "ContributorListVisibility" NOT NULL DEFAULT 'NAMES_AND_STATUSES',
    "contribution_amount_visibility" "AmountVisibility" NOT NULL DEFAULT 'PRIVATE',
    "allow_pledges" BOOLEAN NOT NULL DEFAULT true,
    "allow_partial_payments" BOOLEAN NOT NULL DEFAULT true,
    "allow_anonymous_contributions" BOOLEAN NOT NULL DEFAULT false,
    "allow_in_kind_contributions" BOOLEAN NOT NULL DEFAULT false,
    "payment_methods" "PaymentMethod"[],
    "reminder_frequency_days" INTEGER NOT NULL DEFAULT 7,
    "reminder_tone" "ReminderTone" NOT NULL DEFAULT 'FRIENDLY',
    "reminders_require_approval" BOOLEAN NOT NULL DEFAULT false,
    "allow_reminder_opt_out" BOOLEAN NOT NULL DEFAULT true,
    "public_reminders_enabled" BOOLEAN NOT NULL DEFAULT false,
    "minimum_pledge_amount" INTEGER,
    "manual_payment_verify_threshold" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_administrators" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "permissions" TEXT[],
    "status" "AdminStatus" NOT NULL DEFAULT 'INVITED',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "campaign_administrators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributors" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT,
    "display_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT,
    "group_label" TEXT,
    "notes" TEXT,
    "public_name" BOOLEAN NOT NULL DEFAULT true,
    "public_amount" BOOLEAN NOT NULL DEFAULT false,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "hide_from_list" BOOLEAN NOT NULL DEFAULT false,
    "allow_reminders" BOOLEAN NOT NULL DEFAULT true,
    "allow_updates" BOOLEAN NOT NULL DEFAULT true,
    "status" "ContributorStatus" NOT NULL DEFAULT 'JOINED',
    "pledged_amount" INTEGER NOT NULL DEFAULT 0,
    "paid_amount" INTEGER NOT NULL DEFAULT 0,
    "outstanding_amount" INTEGER NOT NULL DEFAULT 0,
    "expected_payment_date" TIMESTAMP(3),
    "last_payment_at" TIMESTAMP(3),
    "last_reminder_at" TIMESTAMP(3),
    "reminder_count" INTEGER NOT NULL DEFAULT 0,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pledges" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "contributor_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "expected_payment_date" TIMESTAMP(3),
    "status" "PledgeStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pledges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "contributor_id" TEXT NOT NULL,
    "pledge_id" TEXT,
    "transaction_reference" TEXT NOT NULL,
    "provider_reference" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_provider" TEXT,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "provider_fee" INTEGER NOT NULL DEFAULT 0,
    "platform_fee" INTEGER NOT NULL DEFAULT 0,
    "net_amount" INTEGER NOT NULL DEFAULT 0,
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "recorded_by" TEXT,
    "manual_payment" BOOLEAN NOT NULL DEFAULT false,
    "requires_verification" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "proof_url" TEXT,
    "notes" TEXT,
    "payer_phone" TEXT,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "supplier" TEXT,
    "amount" INTEGER NOT NULL,
    "payment_method" "PaymentMethod",
    "expense_date" TIMESTAMP(3) NOT NULL,
    "receipt_url" TEXT,
    "notes" TEXT,
    "approval_status" "ExpenseApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "recorded_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "planned" INTEGER NOT NULL,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "committed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "in_kind_contributions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "contributor_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity" TEXT,
    "estimated_value" INTEGER NOT NULL,
    "delivery_date" TIMESTAMP(3),
    "status" "InKindStatus" NOT NULL DEFAULT 'PLEDGED',
    "notes" TEXT,
    "proof_url" TEXT,
    "verified_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "in_kind_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "contributor_id" TEXT,
    "reminder_type" "ReminderType" NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "message" TEXT NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_conversations" (
    "id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "campaign_id" TEXT,
    "contributor_id" TEXT,
    "current_state" "ConversationState" NOT NULL DEFAULT 'IDLE',
    "state_data" JSONB NOT NULL DEFAULT '{}',
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "previous_data" JSONB,
    "new_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_milestones" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "reached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "campaign_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "otp_codes_phone_number_purpose_idx" ON "otp_codes"("phone_number", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_campaign_code_key" ON "campaigns"("campaign_code");

-- CreateIndex
CREATE INDEX "campaigns_owner_id_idx" ON "campaigns"("owner_id");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_administrators_campaign_id_user_id_key" ON "campaign_administrators"("campaign_id", "user_id");

-- CreateIndex
CREATE INDEX "contributors_campaign_id_status_idx" ON "contributors"("campaign_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "contributors_campaign_id_phone_number_key" ON "contributors"("campaign_id", "phone_number");

-- CreateIndex
CREATE INDEX "pledges_campaign_id_idx" ON "pledges"("campaign_id");

-- CreateIndex
CREATE INDEX "pledges_contributor_id_idx" ON "pledges"("contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transaction_reference_key" ON "payments"("transaction_reference");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "payments_campaign_id_payment_status_idx" ON "payments"("campaign_id", "payment_status");

-- CreateIndex
CREATE INDEX "payments_contributor_id_idx" ON "payments"("contributor_id");

-- CreateIndex
CREATE INDEX "payments_provider_reference_idx" ON "payments"("provider_reference");

-- CreateIndex
CREATE INDEX "expenses_campaign_id_idx" ON "expenses"("campaign_id");

-- CreateIndex
CREATE INDEX "reminders_campaign_id_status_idx" ON "reminders"("campaign_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_conversations_phone_number_key" ON "whatsapp_conversations"("phone_number");

-- CreateIndex
CREATE INDEX "audit_logs_campaign_id_created_at_idx" ON "audit_logs"("campaign_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_milestones_campaign_id_key_key" ON "campaign_milestones"("campaign_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_eventId_key" ON "webhook_events"("provider", "eventId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_administrators" ADD CONSTRAINT "campaign_administrators_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_administrators" ADD CONSTRAINT "campaign_administrators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pledges" ADD CONSTRAINT "pledges_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pledges" ADD CONSTRAINT "pledges_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_pledge_id_fkey" FOREIGN KEY ("pledge_id") REFERENCES "pledges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_kind_contributions" ADD CONSTRAINT "in_kind_contributions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_kind_contributions" ADD CONSTRAINT "in_kind_contributions_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_kind_contributions" ADD CONSTRAINT "in_kind_contributions_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_milestones" ADD CONSTRAINT "campaign_milestones_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
