import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";

const schema = z.object({
  isVerified: z.boolean().optional(),
  status: z
    .enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CLOSED", "CANCELLED", "ARCHIVED"])
    .optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  try {
    const admin = await requirePlatformAdmin();
    const { campaignId } = await params;
    const body = schema.parse(await request.json());

    const existing = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });

    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(body.isVerified !== undefined ? { isVerified: body.isVerified } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
    });

    await writeAuditLog({
      campaignId,
      userId: admin.id,
      action: "admin_campaign_updated",
      entityType: "campaign",
      entityId: campaignId,
      previousData: { isVerified: existing.isVerified, status: existing.status },
      newData: { isVerified: campaign.isVerified, status: campaign.status },
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update campaign" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  try {
    const admin = await requirePlatformAdmin();
    const { campaignId } = await params;

    const existing = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "CANCELLED" },
    });

    await writeAuditLog({
      campaignId,
      userId: admin.id,
      action: "admin_campaign_deleted",
      entityType: "campaign",
      entityId: campaignId,
      previousData: { status: existing.status, name: existing.name },
      newData: { status: "CANCELLED" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to delete campaign" }, { status: 500 });
  }
}
