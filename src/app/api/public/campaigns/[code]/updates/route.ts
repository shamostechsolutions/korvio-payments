import { NextResponse } from "next/server";
import { getPublicCampaign } from "@/lib/contributors/web";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const campaign = await getPublicCampaign(code);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const updates = await prisma.campaignPublicUpdate.findMany({
    where: { campaignId: campaign.id },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    updates: updates.map((u) => ({
      id: u.id,
      authorName: u.authorName,
      body: u.body,
      publishedAt: u.publishedAt.toISOString(),
      publishedLabel: format(u.publishedAt, "yyyy-MM-dd"),
    })),
  });
}
