-- CreateEnum
CREATE TYPE "CashoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "cashouts" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "platform_fee" INTEGER NOT NULL,
    "net_amount" INTEGER NOT NULL,
    "payout_phone" TEXT NOT NULL,
    "payout_method" "PaymentMethod" NOT NULL DEFAULT 'MTN_MOMO',
    "status" "CashoutStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "cashouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cashouts_campaign_id_status_idx" ON "cashouts"("campaign_id", "status");

-- AddForeignKey
ALTER TABLE "cashouts" ADD CONSTRAINT "cashouts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cashouts" ADD CONSTRAINT "cashouts_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
