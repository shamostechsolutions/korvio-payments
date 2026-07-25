import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { recalculateContributorAndCampaign } from "../src/lib/campaigns/totals";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("korvio123", 12);

  const owner = await prisma.user.upsert({
    where: { email: "moses@korvio.app" },
    update: {},
    create: {
      fullName: "Moses Etuku",
      email: "moses@korvio.app",
      phoneNumber: "256700000100",
      passwordHash,
      accountType: "ADMIN",
    },
  });

  const treasurer = await prisma.user.upsert({
    where: { email: "treasurer@korvio.app" },
    update: {},
    create: {
      fullName: "Sarah Treasurer",
      email: "treasurer@korvio.app",
      phoneNumber: "256700000101",
      passwordHash,
      accountType: "ADMIN",
    },
  });

  await prisma.campaign.deleteMany({ where: { campaignCode: "MSW-2026" } });

  const campaign = await prisma.campaign.create({
    data: {
      campaignCode: "MSW-2026",
      ownerId: owner.id,
      name: "Moses & Sharon Wedding Contribution",
      category: "WEDDING",
      description:
        "Help us celebrate and cover wedding costs with clear pledges, private payments and full accountability.",
      currency: "UGX",
      targetAmount: 20_000_000,
      startDate: new Date("2026-06-01"),
      deadline: new Date("2026-08-30"),
      organiserName: "Moses Etuku",
      organiserPhone: "256700000100",
      beneficiaryName: "Moses & Sharon",
      contactPerson: "Sarah Treasurer",
      status: "ACTIVE",
      allowPledges: true,
      allowPartialPayments: true,
      contributorListVisibility: "NAMES_AND_STATUSES",
      contributionAmountVisibility: "PRIVATE",
      paymentMethods: ["MTN_MOMO", "AIRTEL_MONEY", "CASH", "BANK", "DIRECT_TO_TREASURER"],
      administrators: {
        create: [
          {
            userId: owner.id,
            role: "OWNER",
            permissions: [],
            status: "ACTIVE",
            acceptedAt: new Date(),
          },
          {
            userId: treasurer.id,
            role: "TREASURER",
            permissions: [],
            status: "ACTIVE",
            acceptedAt: new Date(),
          },
        ],
      },
    },
  });

  const people = [
    { name: "Moses", phone: "256700000201", pledge: 500_000, paid: 500_000 },
    { name: "Emma", phone: "256700000202", pledge: 300_000, paid: 100_000 },
    { name: "Peter", phone: "256700000203", pledge: 250_000, paid: 0 },
    { name: "Sarah", phone: "256700000204", pledge: 200_000, paid: 200_000 },
    { name: "John", phone: "256700000205", pledge: 0, paid: 0 },
  ];

  for (const person of people) {
    const contributor = await prisma.contributor.create({
      data: {
        campaignId: campaign.id,
        displayName: person.name,
        phoneNumber: person.phone,
        status: "JOINED",
      },
    });

    if (person.pledge > 0) {
      await prisma.pledge.create({
        data: {
          campaignId: campaign.id,
          contributorId: contributor.id,
          amount: person.pledge,
          expectedPaymentDate: new Date("2026-08-15"),
          status: "ACTIVE",
        },
      });
    }

    if (person.paid > 0) {
      await prisma.payment.create({
        data: {
          campaignId: campaign.id,
          contributorId: contributor.id,
          transactionReference: `KRV-MSW-${person.phone.slice(-4)}`,
          amount: person.paid,
          currency: "UGX",
          paymentMethod: "MTN_MOMO",
          paymentProvider: "mock",
          paymentStatus: "SUCCESSFUL",
          providerFee: 0,
          platformFee: 0,
          netAmount: person.paid,
          completedAt: new Date(),
          manualPayment: true,
          notes: "Seed payment",
        },
      });
    }

    await recalculateContributorAndCampaign(contributor.id);
  }

  await prisma.expense.create({
    data: {
      campaignId: campaign.id,
      category: "Venue",
      description: "Booking deposit",
      supplier: "Garden Venue",
      amount: 1_500_000,
      paymentMethod: "BANK",
      expenseDate: new Date("2026-07-01"),
      approvalStatus: "APPROVED",
      recordedById: treasurer.id,
      approvedById: owner.id,
    },
  });

  const any = await prisma.contributor.findFirst({ where: { campaignId: campaign.id } });
  if (any) await recalculateContributorAndCampaign(any.id);

  console.log("Seeded Korvio demo data");
  console.log("Login: moses@korvio.app / korvio123");
  console.log("Campaign code: MSW-2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
