import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { requireCampaignPermission } from "@/lib/campaigns/access";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

const createSchema = z.object({
  displayName: z.string().min(1),
  phoneNumber: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  groupLabel: z.string().optional(),
  notes: z.string().optional(),
});

const importSchema = z.object({
  rows: z.array(
    z.object({
      displayName: z.string().min(1),
      phoneNumber: z.string().optional(),
      email: z.string().optional(),
      groupLabel: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { campaignId } = await params;

  try {
    const access = await requireCampaignPermission(campaignId, user, "reports.public");
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");

    const contributors = await prisma.contributor.findMany({
      where: {
        campaignId: access.campaign.id,
        ...(status ? { status: status as never } : {}),
        ...(q
          ? {
              OR: [
                { displayName: { contains: q, mode: "insensitive" } },
                { phoneNumber: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { displayName: "asc" },
    });

    return NextResponse.json({
      contributors: access.canViewAmounts
        ? contributors
        : contributors.map((c) => ({
            ...c,
            pledgedAmount: null,
            paidAmount: null,
            outstandingAmount: null,
          })),
      canViewAmounts: access.canViewAmounts,
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { campaignId } = await params;

  try {
    const access = await requireCampaignPermission(campaignId, user, "contributors.manage");
    const json = await request.json();

    if (Array.isArray(json.rows)) {
      const body = importSchema.parse(json);
      let created = 0;
      for (const row of body.rows) {
        const phone = (row.phoneNumber || `import-${created + 1}-${Date.now()}`).replace(
          /\D/g,
          "",
        );
        try {
          await prisma.contributor.create({
            data: {
              campaignId: access.campaign.id,
              displayName: row.displayName,
              phoneNumber: phone || `pending-${created + 1}`,
              email: row.email || null,
              groupLabel: row.groupLabel,
              notes: row.notes,
              status: "NOT_JOINED",
            },
          });
          created += 1;
        } catch {
          // skip duplicates
        }
      }

      await writeAuditLog({
        campaignId: access.campaign.id,
        userId: user.id,
        action: "contributor_added",
        entityType: "contributor",
        newData: { imported: created },
      });

      return NextResponse.json({ imported: created });
    }

    const body = createSchema.parse(json);
    const contributor = await prisma.contributor.create({
      data: {
        campaignId: access.campaign.id,
        displayName: body.displayName,
        phoneNumber: body.phoneNumber.replace(/\D/g, ""),
        email: body.email || null,
        groupLabel: body.groupLabel,
        notes: body.notes,
        status: "NOT_JOINED",
      },
    });

    await writeAuditLog({
      campaignId: access.campaign.id,
      userId: user.id,
      action: "contributor_added",
      entityType: "contributor",
      entityId: contributor.id,
      newData: contributor,
    });

    return NextResponse.json({ contributor }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to add contributor" }, { status: 400 });
  }
}
