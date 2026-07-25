import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { canCloseCampaign, resolveCloseStatus } from "@/lib/campaigns/cashout-rules";
import { formatMoney } from "@/lib/utils/money";

export async function closeCampaign(input: {
  campaignId: string;
  userId: string;
  note?: string;
}) {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: input.campaignId },
  });

  if (!canCloseCampaign(campaign.status)) {
    throw new Error("Only active campaigns can be closed");
  }

  const pendingCashout = await prisma.cashout.findFirst({
    where: {
      campaignId: campaign.id,
      status: { in: ["PENDING", "PROCESSING"] },
    },
  });

  if (pendingCashout) {
    throw new Error("Finish or cancel the pending cash-out before closing the campaign");
  }

  const newStatus = resolveCloseStatus(campaign);

  const updated = await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: newStatus },
  });

  const defaultNote =
    newStatus === "COMPLETED"
      ? `Campaign goal reached — fundraising is now closed. Total raised: ${formatMoney(campaign.totalReceived, campaign.currency)}.`
      : `Fundraising has been closed by the organiser. Total raised: ${formatMoney(campaign.totalReceived, campaign.currency)}.`;

  await prisma.campaignPublicUpdate.create({
    data: {
      campaignId: campaign.id,
      authorName: campaign.organiserName,
      body: input.note?.trim() || defaultNote,
    },
  });

  await writeAuditLog({
    campaignId: campaign.id,
    userId: input.userId,
    action: "campaign_closed",
    entityType: "campaign",
    entityId: campaign.id,
    previousData: { status: campaign.status },
    newData: { status: newStatus },
  });

  return updated;
}
