import { randomUUID } from "crypto";
import type { PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { publishCashoutLedgerEntry } from "@/lib/admin/cashouts";
import { recalculateCampaignWallet } from "@/lib/campaigns/totals";
import { pawapayRequest } from "./client";
import {
  formatPawapayAmount,
  normalizeUgandaPhone,
  pawapayDefaultCurrency,
  pawapayProviderForMethod,
} from "./config";
import { mapPawapayPayoutStatus } from "./status";

type PawapayPayoutResponse = {
  payoutId: string;
  status: "ACCEPTED" | "REJECTED" | "DUPLICATE_IGNORED";
  failureReason?: { failureCode?: string; failureMessage?: string };
};

type PawapayPayoutCallback = {
  payoutId: string;
  status: string;
  amount?: string;
  currency?: string;
  failureReason?: { failureMessage?: string };
};

export async function initiatePawapayPayoutForCashout(
  cashoutId: string,
  adminUserId?: string,
) {
  const cashout = await prisma.cashout.findUniqueOrThrow({
    where: { id: cashoutId },
    include: { campaign: { select: { currency: true, name: true } } },
  });

  if (cashout.providerPayoutId) {
    return cashout;
  }

  const payoutId = randomUUID();
  const phone = normalizeUgandaPhone(cashout.payoutPhone);
  const provider = pawapayProviderForMethod(cashout.payoutMethod as PaymentMethod);
  const currency = cashout.campaign.currency || pawapayDefaultCurrency();

  const response = await pawapayRequest<PawapayPayoutResponse>("/v2/payouts", {
    method: "POST",
    body: JSON.stringify({
      payoutId,
      amount: formatPawapayAmount(cashout.netAmount, currency),
      currency,
      recipient: {
        type: "MMO",
        accountDetails: {
          phoneNumber: phone,
          provider,
        },
      },
      clientReferenceId: cashout.id,
      customerMessage: cashout.campaign.name.slice(0, 22) || "Korvio cashout",
    }),
  });

  if (response.status === "REJECTED") {
    const failed = await prisma.cashout.update({
      where: { id: cashout.id },
      data: {
        status: "FAILED",
        processedAt: new Date(),
        notes: response.failureReason?.failureMessage || "PawaPay rejected payout",
      },
    });
    await recalculateCampaignWallet(cashout.campaignId);
    return failed;
  }

  const updated = await prisma.cashout.update({
    where: { id: cashout.id },
    data: {
      status: "PROCESSING",
      providerPayoutId: response.payoutId,
      notes: "Payout submitted to PawaPay",
    },
  });

  await writeAuditLog({
    campaignId: cashout.campaignId,
    userId: adminUserId,
    action: "pawapay_payout_initiated",
    entityType: "cashout",
    entityId: cashout.id,
    newData: { payoutId: response.payoutId, status: response.status },
  });

  return updated;
}

export async function completeCashoutFromPawapayCallback(body: PawapayPayoutCallback) {
  if (!body.payoutId) {
    throw new Error("Missing payoutId in PawaPay payout callback");
  }

  const cashout = await prisma.cashout.findFirst({
    where: { providerPayoutId: body.payoutId },
  });

  if (!cashout) {
    throw new Error("Cash-out not found for PawaPay payoutId");
  }

  const mapped = mapPawapayPayoutStatus(body.status);

  if (mapped === "PROCESSING") {
    return { cashout, updated: false as const };
  }

  if (cashout.status === "COMPLETED" || cashout.status === "FAILED") {
    return { cashout, updated: false as const };
  }

  const updated = await prisma.cashout.update({
    where: { id: cashout.id },
    data: {
      status: mapped,
      processedAt: new Date(),
      notes:
        mapped === "FAILED"
          ? body.failureReason?.failureMessage || "PawaPay payout failed"
          : "Paid via PawaPay",
    },
  });

  await recalculateCampaignWallet(cashout.campaignId);

  if (mapped === "COMPLETED") {
    await publishCashoutLedgerEntry(cashout.id);
  }

  await writeAuditLog({
    campaignId: cashout.campaignId,
    action: mapped === "COMPLETED" ? "cashout_completed" : "cashout_failed",
    entityType: "cashout",
    entityId: cashout.id,
    previousData: { status: cashout.status },
    newData: { status: mapped },
  });

  return { cashout: updated, updated: true as const };
}
