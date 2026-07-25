-- CreateEnum
CREATE TYPE "FundraisingMode" AS ENUM ('GOAL', 'OPEN');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "fundraising_mode" "FundraisingMode" NOT NULL DEFAULT 'GOAL';

-- AlterTable (allow zero target for open campaigns)
ALTER TABLE "campaigns" ALTER COLUMN "target_amount" SET DEFAULT 0;
