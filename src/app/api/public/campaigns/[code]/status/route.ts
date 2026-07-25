import { NextResponse } from "next/server";
import {
  contributorSummary,
  getPublicCampaign,
  normalizePhone,
} from "@/lib/contributors/web";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const campaign = await getPublicCampaign(code);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const phone = normalizePhone(new URL(request.url).searchParams.get("phone") || "");
  if (!phone) {
    return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  }

  const contributor = await prisma.contributor.findUnique({
    where: {
      campaignId_phoneNumber: { campaignId: campaign.id, phoneNumber: phone },
    },
  });

  if (!contributor) {
    return NextResponse.json({ joined: false });
  }

  return NextResponse.json({
    joined: true,
    contributor: contributorSummary(campaign, contributor),
  });
}
