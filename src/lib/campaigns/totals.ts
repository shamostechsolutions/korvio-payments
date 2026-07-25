import { prisma } from "@/lib/db";
import { deriveContributorStatus } from "@/lib/status";

export async function recalculateContributorAndCampaign(contributorId: string) {
  return prisma.$transaction(async (tx) => {
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
    const [pledgedAgg, receivedAgg, expenseAgg, feeAgg, inKindAgg] = await Promise.all([
      tx.contributor.aggregate({
        where: { campaignId },
        _sum: { pledgedAmount: true },
      }),
      tx.payment.aggregate({
        where: { campaignId, paymentStatus: "SUCCESSFUL" },
        _sum: { amount: true, platformFee: true, providerFee: true },
      }),
      tx.expense.aggregate({
        where: { campaignId, approvalStatus: "APPROVED" },
        _sum: { amount: true },
      }),
      tx.payment.aggregate({
        where: { campaignId, paymentStatus: "SUCCESSFUL" },
        _sum: { platformFee: true, providerFee: true },
      }),
      tx.inKindContribution.aggregate({
        where: { campaignId, status: { in: ["DELIVERED", "VERIFIED", "PLEDGED"] } },
        _sum: { estimatedValue: true },
      }),
    ]);

    const totalPledged = pledgedAgg._sum.pledgedAmount ?? 0;
    const totalReceived = receivedAgg._sum.amount ?? 0;
    const totalExpenses = expenseAgg._sum.amount ?? 0;
    const totalFees =
      (feeAgg._sum.platformFee ?? 0) + (feeAgg._sum.providerFee ?? 0);
    const totalInKindValue = inKindAgg._sum.estimatedValue ?? 0;
    const availableBalance = totalReceived - totalFees - totalExpenses;

    await tx.campaign.update({
      where: { id: campaignId },
      data: {
        totalPledged,
        totalReceived,
        totalExpenses,
        totalFees,
        totalInKindValue,
        availableBalance,
      },
    });

    return { pledgedAmount, paidAmount, outstandingAmount, status };
  });
}
