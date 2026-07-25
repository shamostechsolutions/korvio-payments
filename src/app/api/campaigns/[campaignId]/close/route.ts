import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { requireCampaignPermission } from "@/lib/campaigns/access";
import { closeCampaign } from "@/lib/campaigns/close";

const schema = z.object({
  note: z.string().max(2000).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId } = await params;
    const access = await requireCampaignPermission(campaignId, user, "campaign.close");

    const body = schema.parse(await request.json().catch(() => ({})));
    const campaign = await closeCampaign({
      campaignId: access.campaign.id,
      userId: user.id,
      note: body.note,
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to close campaign" },
      { status: 400 },
    );
  }
}
