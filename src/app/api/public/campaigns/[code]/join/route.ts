import { NextResponse } from "next/server";
import { z } from "zod";
import {
  contributorSummary,
  getPublicCampaign,
  joinCampaign,
} from "@/lib/contributors/web";

const bodySchema = z.object({
  displayName: z.string().min(2).max(80),
  phoneNumber: z.string().min(10).max(20),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const campaign = await getPublicCampaign(code);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const body = bodySchema.parse(await request.json());
    const contributor = await joinCampaign({
      campaignId: campaign.id,
      phoneNumber: body.phoneNumber,
      displayName: body.displayName,
    });

    return NextResponse.json({
      contributor: contributorSummary(campaign, contributor),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to join campaign" },
      { status: 400 },
    );
  }
}
