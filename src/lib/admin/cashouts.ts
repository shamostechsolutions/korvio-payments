import type { CashoutStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { recalculateCampaignWallet } from "@/lib/campaigns/totals";

const TERMINAL_STATUSES = new Set<CashoutStatus>(["COMPLETED", "FAILED", "CANCELLED"]);

export async function updateCashoutStatus(input: {
  cashoutId: string;
  status: CashoutStatus;
  adminUserId: string;
  notes?: string;
}) {
  const cashout = await prisma.cashout.findUniqueOrThrow({
    where: { id: input.cashoutId },
    include: { campaign: true },
  });

  if (TERMINAL_STATUSES.has(cashout.status) && cashout.status !== input.status) {
    throw new Error("This cash-out has already been finalized");
  }

  const updated = await prisma.cashout.update({
    where: { id: input.cashoutId },
    data: {
      status: input.status,
      notes: input.notes?.trim() || cashout.notes,
      processedAt: TERMINAL_STATUSES.has(input.status) ? new Date() : null,
    },
  });

  await recalculateCampaignWallet(cashout.campaignId);

  await writeAuditLog({
    campaignId: cashout.campaignId,
    userId: input.adminUserId,
    action: "cashout_status_updated",
    entityType: "cashout",
    entityId: cashout.id,
    previousData: { status: cashout.status },
    newData: { status: input.status, notes: updated.notes },
  });

  return updated;
}
