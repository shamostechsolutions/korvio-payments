import { NextResponse } from "next/server";
import { z } from "zod";
import { getCampaignWallet, requestCampaignCashout } from "@/lib/campaigns/cashout";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await params;
  const access = await getCampaignAccess(campaignId, user);
  if (!access || !access.canViewAmounts) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const wallet = await getCampaignWallet(access.campaign.id);
  return NextResponse.json(wallet);
}

const postSchema = z.object({
  payoutPhone: z.string().min(10).max(20),
  payoutMethod: z.enum(["MTN_MOMO", "AIRTEL_MONEY"]).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId } = await params;
    const access = await getCampaignAccess(campaignId, user);
    if (!access || !["OWNER", "TREASURER"].includes(access.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = postSchema.parse(await request.json());
    const cashout = await requestCampaignCashout({
      campaignId: access.campaign.id,
      userId: user.id,
      payoutPhone: body.payoutPhone,
      payoutMethod: body.payoutMethod,
    });

    return NextResponse.json({ cashout });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to request cash-out" },
      { status: 400 },
    );
  }
}
