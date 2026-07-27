import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { canOrganiserDeleteDraft } from "@/lib/campaigns/delete";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await params;
  const access = await getCampaignAccess(campaignId, user);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [contributors, recentPayments, expenses] = await Promise.all([
    prisma.contributor.findMany({
      where: { campaignId: access.campaign.id },
      orderBy: { joinedAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { campaignId: access.campaign.id },
      include: { contributor: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.expense.findMany({
      where: { campaignId: access.campaign.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const statusCounts = {
    fullyPaid: contributors.filter((c) =>
      ["FULLY_PAID", "PAID_WITHOUT_PLEDGE", "OVERPAID"].includes(c.status),
    ).length,
    partiallyPaid: contributors.filter((c) => c.status === "PARTIALLY_PAID").length,
    pledged: contributors.filter((c) => c.status === "PLEDGED").length,
    unpaid: contributors.filter((c) =>
      ["JOINED", "NOT_YET_PLEDGED", "NOT_JOINED"].includes(c.status),
    ).length,
  };

  const sanitizedContributors = access.canViewAmounts
    ? contributors
    : contributors.map((c) => ({
        ...c,
        pledgedAmount: null,
        paidAmount: null,
        outstandingAmount: null,
      }));

  return NextResponse.json({
    campaign: access.campaign,
    role: access.role,
    canViewAmounts: access.canViewAmounts,
    contributors: sanitizedContributors,
    recentPayments: access.canViewAmounts
      ? recentPayments
      : recentPayments.map((p) => ({
          ...p,
          amount: null,
          netAmount: null,
          providerFee: null,
          platformFee: null,
        })),
    expenses: access.has("expenses.record") || access.canViewAmounts ? expenses : [],
    statusCounts,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId } = await params;
    const access = await getCampaignAccess(campaignId, user);
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (access.role !== "OWNER") {
      return NextResponse.json({ error: "Only the campaign owner can delete this campaign" }, { status: 403 });
    }

    const campaign = access.campaign;
    if (!canOrganiserDeleteDraft(campaign)) {
      return NextResponse.json(
        {
          error:
            "Only pending campaigns can be deleted directly. Request deletion and Korvio will remove live campaigns.",
        },
        { status: 400 },
      );
    }

    const successfulPayments = await prisma.payment.count({
      where: { campaignId: campaign.id, paymentStatus: "SUCCESSFUL" },
    });
    if (successfulPayments > 0) {
      return NextResponse.json(
        { error: "This campaign has received payments and cannot be deleted directly." },
        { status: 400 },
      );
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "CANCELLED" },
    });

    await writeAuditLog({
      campaignId: campaign.id,
      userId: user.id,
      action: "campaign_deleted_by_owner",
      entityType: "campaign",
      entityId: campaign.id,
      previousData: { status: campaign.status, name: campaign.name },
      newData: { status: "CANCELLED" },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete campaign" }, { status: 500 });
  }
}
