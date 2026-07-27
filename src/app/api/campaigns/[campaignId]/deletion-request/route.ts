import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { canOrganiserRequestDeletion } from "@/lib/campaigns/delete";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId } = await params;
    const access = await getCampaignAccess(campaignId, user);
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (access.role !== "OWNER") {
      return NextResponse.json({ error: "Only the campaign owner can request deletion" }, { status: 403 });
    }

    const campaign = access.campaign;
    if (!canOrganiserRequestDeletion(campaign)) {
      if (campaign.deletionRequestedAt) {
        return NextResponse.json({ error: "Deletion has already been requested" }, { status: 400 });
      }
      return NextResponse.json(
        { error: "Pending campaigns can be deleted directly. Live campaigns require a deletion request." },
        { status: 400 },
      );
    }

    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        deletionRequestedAt: new Date(),
        deletionRequestedById: user.id,
      },
    });

    await writeAuditLog({
      campaignId: campaign.id,
      userId: user.id,
      action: "campaign_deletion_requested",
      entityType: "campaign",
      entityId: campaign.id,
      previousData: { deletionRequestedAt: null },
      newData: { deletionRequestedAt: updated.deletionRequestedAt },
    });

    return NextResponse.json({ campaign: updated });
  } catch {
    return NextResponse.json({ error: "Unable to request deletion" }, { status: 500 });
  }
}
