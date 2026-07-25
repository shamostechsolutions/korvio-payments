import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await params;
  const access = await getCampaignAccess(campaignId, user);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates = await prisma.campaignPublicUpdate.findMany({
    where: { campaignId },
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json({ updates });
}

const postSchema = z.object({
  body: z.string().min(10).max(5000),
  authorName: z.string().min(2).max(80).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await params;
  const access = await getCampaignAccess(campaignId, user);
  if (!access || !access.has("updates.generate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = postSchema.parse(await request.json());
    const update = await prisma.campaignPublicUpdate.create({
      data: {
        campaignId,
        authorName: body.authorName || access.campaign.organiserName,
        body: body.body.trim(),
      },
    });

    await writeAuditLog({
      campaignId,
      userId: user.id,
      action: "public_update_posted",
      entityType: "campaign_public_update",
      entityId: update.id,
      newData: update,
    });

    return NextResponse.json({
      update: {
        ...update,
        publishedLabel: format(update.publishedAt, "yyyy-MM-dd"),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to post update" },
      { status: 400 },
    );
  }
}
