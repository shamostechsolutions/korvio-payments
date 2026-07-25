import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  imageUrl: z.string().optional().nullable(),
  isVerified: z.boolean().optional(),
  allowSupportMessages: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await params;
  const access = await getCampaignAccess(campaignId, user);
  if (!access || access.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = patchSchema.parse(await request.json());
    const imageUrl =
      body.imageUrl === undefined
        ? undefined
        : body.imageUrl && body.imageUrl.trim()
          ? body.imageUrl.trim()
          : null;

    if (imageUrl) {
      try {
        new URL(imageUrl);
      } catch {
        return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
      }
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(body.imageUrl !== undefined ? { imageUrl } : {}),
        ...(body.isVerified !== undefined ? { isVerified: body.isVerified } : {}),
        ...(body.allowSupportMessages !== undefined
          ? { allowSupportMessages: body.allowSupportMessages }
          : {}),
      },
    });

    await writeAuditLog({
      campaignId,
      userId: user.id,
      action: "campaign_public_settings_updated",
      entityType: "campaign",
      entityId: campaignId,
      newData: body,
    });

    return NextResponse.json({ campaign: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update settings" },
      { status: 400 },
    );
  }
}
