import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { recalculateCampaignWallet } from "@/lib/campaigns/totals";
import {
  MIN_CASHOUT_AMOUNT,
  canCampaignRequestCashout,
} from "@/lib/campaigns/cashout-rules";
import { calculateCashoutNet } from "@/lib/payments/fees";
import { formatMoney } from "@/lib/utils/money";
import type { PaymentMethod } from "@prisma/client";

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
    minCashoutAmount: MIN_CASHOUT_AMOUNT,
    cashoutPreview: { platformFee, netAmount },
    canRequestCashout: canCampaignRequestCashout({
      status: campaign.status,
      availableBalance: campaign.availableBalance,
      hasPendingCashout: Boolean(pendingCashout),
    }),
  };
}

export async function requestCampaignCashout(input: {
  campaignId: string;
  userId: string;
  payoutPhone: string;
  payoutMethod?: PaymentMethod;
  amount?: number;
}) {
  const wallet = await getCampaignWallet(input.campaignId);

  if (
    !canCampaignRequestCashout({
      status: wallet.campaign.status,
      availableBalance: wallet.availableBalance,
      hasPendingCashout: Boolean(wallet.pendingCashout),
    })
  ) {
    if (wallet.pendingCashout) {
      throw new Error("A cash-out request is already pending");
    }
    if (wallet.availableBalance < MIN_CASHOUT_AMOUNT) {
      throw new Error(
        `Minimum cash-out is ${formatMoney(MIN_CASHOUT_AMOUNT, wallet.campaign.currency)}`,
      );
    }
    throw new Error("This campaign cannot request a cash-out right now");
  }

  const amount = input.amount ?? wallet.availableBalance;

  if (amount <= 0 || amount > wallet.availableBalance) {
    throw new Error("Invalid cash-out amount");
  }

  if (amount < MIN_CASHOUT_AMOUNT) {
    throw new Error(
      `Minimum cash-out is ${formatMoney(MIN_CASHOUT_AMOUNT, wallet.campaign.currency)}`,
    );
  }

  const { platformFee, netAmount } = calculateCashoutNet(amount);

  const cashout = await prisma.cashout.create({
    data: {
      campaignId: input.campaignId,
      requestedById: input.userId,
      amount,
      platformFee,
      netAmount,
      payoutPhone: input.payoutPhone.trim(),
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

  if (process.env.PAYMENT_PROVIDER === "pawapay") {
    const { initiatePawapayPayoutForCashout } = await import(
      "@/lib/payments/pawapay/payouts"
    );
    return initiatePawapayPayoutForCashout(cashout.id);
  }

  return cashout;
}

export async function getPublicCampaignCashouts(campaignId: string) {
  return prisma.cashout.findMany({
    where: { campaignId, status: "COMPLETED" },
    orderBy: { processedAt: "desc" },
    select: {
      id: true,
      netAmount: true,
      amount: true,
      platformFee: true,
      processedAt: true,
      requestedAt: true,
    },
  });
}
