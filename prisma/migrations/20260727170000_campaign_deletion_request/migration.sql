-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "deletion_requested_at" TIMESTAMP(3),
ADD COLUMN "deletion_requested_by_id" TEXT;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_deletion_requested_by_id_fkey" FOREIGN KEY ("deletion_requested_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
