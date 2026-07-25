import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
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
