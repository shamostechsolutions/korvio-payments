-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "is_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "campaigns" ADD COLUMN "allow_support_messages" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "campaign_public_updates" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_public_updates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "campaign_support_messages" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "contributor_id" TEXT,
    "author_name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_public_updates_campaign_id_published_at_idx" ON "campaign_public_updates"("campaign_id", "published_at");

CREATE INDEX "campaign_support_messages_campaign_id_created_at_idx" ON "campaign_support_messages"("campaign_id", "created_at");

-- AddForeignKey
ALTER TABLE "campaign_public_updates" ADD CONSTRAINT "campaign_public_updates_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaign_support_messages" ADD CONSTRAINT "campaign_support_messages_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaign_support_messages" ADD CONSTRAINT "campaign_support_messages_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
