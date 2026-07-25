import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { requireCampaignPermission } from "@/lib/campaigns/access";
import { prisma } from "@/lib/db";
import { generateGroupUpdate, generateShareMessage } from "@/lib/campaigns/updates";
import { writeAuditLog } from "@/lib/audit";
import { publicStatusLabel } from "@/lib/status";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { campaignId } = await params;

  try {
    const access = await requireCampaignPermission(campaignId, user, "updates.generate");
    const includeList = new URL(request.url).searchParams.get("list") !== "0";
    const contributors = await prisma.contributor.findMany({
      where: { campaignId: access.campaign.id },
      orderBy: { lastActivityAt: "desc" },
    });

    const recent = contributors.slice(0, 4).map((c) => {
      const label = publicStatusLabel(c.status);
      if (c.status === "FULLY_PAID" || c.status === "PAID_WITHOUT_PLEDGE") {
        return `✅ ${c.anonymous ? "Anonymous contributor" : c.displayName} completed their contribution`;
      }
      if (c.status === "PARTIALLY_PAID") {
        return `🟡 ${c.displayName} made a partial payment`;
      }
      if (c.status === "PLEDGED") {
        return `🤝 ${c.displayName} made a pledge`;
      }
      return `${label} — ${c.displayName}`;
    });

    const update = generateGroupUpdate({
      campaign: access.campaign,
      contributors,
      includeList,
      recentActivity: recent,
    });

    await writeAuditLog({
      campaignId: access.campaign.id,
      userId: user.id,
      action: "report_generated",
      entityType: "group_update",
      newData: { includeList },
    });

    return NextResponse.json({
      update,
      shareMessage: generateShareMessage(access.campaign),
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
