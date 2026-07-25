import { prisma } from "@/lib/db";
import { deriveContributorStatus } from "@/lib/status";

export async function recalculateCampaignWallet(campaignId: string) {
  const [receivedAgg, cashoutAgg, feeAgg] = await Promise.all([
    prisma.payment.aggregate({
      where: { campaignId, paymentStatus: "SUCCESSFUL" },
      _sum: { amount: true },
    }),
    prisma.cashout.aggregate({
      where: {
        campaignId,
        status: { in: ["PENDING", "PROCESSING", "COMPLETED"] },
      },
      _sum: { amount: true },
    }),
    prisma.cashout.aggregate({
      where: { campaignId, status: "COMPLETED" },
      _sum: { platformFee: true },
    }),
  ]);

  const totalReceived = receivedAgg._sum.amount ?? 0;
  const reservedForCashouts = cashoutAgg._sum.amount ?? 0;
  const totalFees = feeAgg._sum.platformFee ?? 0;
  const availableBalance = Math.max(0, totalReceived - reservedForCashouts);

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      totalReceived,
      totalExpenses: 0,
      totalFees,
      availableBalance,
    },
  });

  return { totalReceived, totalFees, availableBalance };
}

export async function recalculateContributorAndCampaign(contributorId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const contributor = await tx.contributor.findUniqueOrThrow({
      where: { id: contributorId },
      include: {
        pledges: { where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 1 },
        payments: { where: { paymentStatus: "SUCCESSFUL" } },
        inKindItems: true,
      },
    });

    const pledgedAmount = contributor.pledges[0]?.amount ?? 0;
    const paidAmount = contributor.payments.reduce((sum, p) => sum + p.amount, 0);
    const outstandingAmount = Math.max(0, pledgedAmount - paidAmount);
    const isInKind = contributor.inKindItems.some((i) => i.status !== "CANCELLED");
    const status = deriveContributorStatus({
      pledgedAmount,
      paidAmount,
      isInKind,
      anonymous: contributor.anonymous,
    });

    await tx.contributor.update({
      where: { id: contributorId },
      data: {
        pledgedAmount,
        paidAmount,
        outstandingAmount,
        status,
        expectedPaymentDate: contributor.pledges[0]?.expectedPaymentDate,
        lastPaymentAt:
          contributor.payments.sort(
            (a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
          )[0]?.completedAt ?? null,
        lastActivityAt: new Date(),
      },
    });

    const campaignId = contributor.campaignId;
    const [pledgedAgg, inKindAgg] = await Promise.all([
      tx.contributor.aggregate({
        where: { campaignId },
        _sum: { pledgedAmount: true },
      }),
      tx.inKindContribution.aggregate({
        where: { campaignId, status: { in: ["DELIVERED", "VERIFIED", "PLEDGED"] } },
        _sum: { estimatedValue: true },
      }),
    ]);

    await tx.campaign.update({
      where: { id: campaignId },
      data: {
        totalPledged: pledgedAgg._sum.pledgedAmount ?? 0,
        totalInKindValue: inKindAgg._sum.estimatedValue ?? 0,
      },
    });

    return { campaignId, pledgedAmount, paidAmount, outstandingAmount, status };
  });

  await recalculateCampaignWallet(result.campaignId);

  return {
    pledgedAmount: result.pledgedAmount,
    paidAmount: result.paidAmount,
    outstandingAmount: result.outstandingAmount,
    status: result.status,
  };
}
