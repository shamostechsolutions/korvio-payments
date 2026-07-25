import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/** Use direct/session URL for seed — transaction pooler (6543) breaks Prisma transactions. */
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

const DEMO_CAMPAIGN_CODES = ["MSW-2026"];

async function main() {
  const passwordHash = await bcrypt.hash("korvio123", 12);

  await prisma.user.upsert({
    where: { email: "shamos@korvio.com" },
    update: {},
    create: {
      fullName: "Korvio Platform Admin",
      email: "shamos@korvio.com",
      phoneNumber: "256700000102",
      passwordHash,
      accountType: "ADMIN",
    },
  });

  const removed = await prisma.campaign.deleteMany({
    where: { campaignCode: { in: DEMO_CAMPAIGN_CODES } },
  });

  console.log("Platform admin ready: shamos@korvio.com / korvio123");
  if (removed.count > 0) {
    console.log(`Removed ${removed.count} demo campaign(s): ${DEMO_CAMPAIGN_CODES.join(", ")}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
