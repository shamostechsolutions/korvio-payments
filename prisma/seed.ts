import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const DEMO_CAMPAIGN_CODES = ["MSW-2026"];

function candidateUrls(): string[] {
  const urls = [process.env.DIRECT_URL, process.env.DATABASE_URL].filter(
    (url): url is string => Boolean(url),
  );
  return [...new Set(urls)];
}

async function connectWithRetry() {
  const urls = candidateUrls();
  if (urls.length === 0) {
    throw new Error("Set DIRECT_URL or DATABASE_URL in .env before running db:seed.");
  }

  const attempts = 3;
  let lastError: unknown;

  for (const url of urls) {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const prisma = new PrismaClient({
        datasources: { db: { url } },
      });

      try {
        await prisma.$connect();
        return prisma;
      } catch (error) {
        lastError = error;
        await prisma.$disconnect().catch(() => undefined);

        if (attempt < attempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
        }
      }
    }
  }

  throw lastError;
}

async function main() {
  const prisma = await connectWithRetry();
  const passwordHash = await bcrypt.hash("korvio123", 12);

  try {
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
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  console.error(
    "\nIf this keeps failing:\n" +
      "  1. Open Supabase → Project Settings → Database and confirm the project is not paused.\n" +
      "  2. Copy a fresh connection string (Session pooler, port 5432) into DIRECT_URL.\n" +
      "  3. Retry: npm run db:seed\n" +
      "  4. Or run the SQL below in Supabase SQL Editor to create the admin manually.\n",
  );
  process.exit(1);
});
