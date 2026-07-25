import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { recalculateCampaignWallet } from "@/lib/campaigns/totals";
import { calculateCashoutNet } from "@/lib/payments/fees";
import type { PaymentMethod } from "@prisma/client";

const CASHOUT_ELIGIBLE_STATUSES = new Set(["COMPLETED", "CLOSED"]);

export async function getCampaignWallet(campaignId: string) {
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  const cashouts = await prisma.cashout.findMany({
    where: { campaignId },
    orderBy: { requestedAt: "desc" },
  });

  const pendingCashout = cashouts.find((c) =>
    ["PENDING", "PROCESSING"].includes(c.status),
  );

  const { platformFee, netAmount } = calculateCashoutNet(campaign.availableBalance);

  return {
    campaign,
    totalReceived: campaign.totalReceived,
    totalExpenses: campaign.totalExpenses,
    availableBalance: campaign.availableBalance,
    totalFees: campaign.totalFees,
    pendingCashout,
    cashouts,
    cashoutPreview: { platformFee, netAmount },
    canRequestCashout:
      CASHOUT_ELIGIBLE_STATUSES.has(campaign.status) &&
      campaign.availableBalance > 0 &&
      !pendingCashout,
  };
}

export async function requestCampaignCashout(input: {
  campaignId: string;
  userId: string;
  payoutPhone: string;
  payoutMethod?: PaymentMethod;
}) {
  const wallet = await getCampaignWallet(input.campaignId);

  if (!CASHOUT_ELIGIBLE_STATUSES.has(wallet.campaign.status)) {
    throw new Error("Close or complete the campaign before requesting a cash-out");
  }
  if (wallet.availableBalance <= 0) {
    throw new Error("No funds available to cash out");
  }
  if (wallet.pendingCashout) {
    throw new Error("A cash-out request is already pending");
  }

  const amount = wallet.availableBalance;
  const { platformFee, netAmount } = calculateCashoutNet(amount);

  const cashout = await prisma.cashout.create({
    data: {
      campaignId: input.campaignId,
      requestedById: input.userId,
      amount,
      platformFee,
      netAmount,
      payoutPhone: input.payoutPhone,
      payoutMethod: input.payoutMethod ?? "MTN_MOMO",
      status: "PENDING",
    },
  });

  await recalculateCampaignWallet(input.campaignId);

  await writeAuditLog({
    campaignId: input.campaignId,
    userId: input.userId,
    action: "cashout_requested",
    entityType: "cashout",
    entityId: cashout.id,
    newData: cashout,
  });

  return cashout;
}
