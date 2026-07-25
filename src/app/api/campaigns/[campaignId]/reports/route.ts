import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { requireCampaignPermission } from "@/lib/campaigns/access";
import { prisma } from "@/lib/db";
import { buildCampaignWorkbook, buildContributorsCsv } from "@/lib/reports/export";
import { writeAuditLog } from "@/lib/audit";
import { formatMoney, daysRemaining } from "@/lib/utils/money";
import { publicStatusLabel } from "@/lib/status";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { campaignId } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";
  const type = searchParams.get("type") || "summary";

  try {
    const access = await requireCampaignPermission(campaignId, user, "reports.public");
    const includeAmounts =
      access.canViewAmounts || access.has("reports.financial");

    const [contributors, payments, expenses] = await Promise.all([
      prisma.contributor.findMany({ where: { campaignId: access.campaign.id } }),
      prisma.payment.findMany({ where: { campaignId: access.campaign.id } }),
      prisma.expense.findMany({ where: { campaignId: access.campaign.id } }),
    ]);

    await writeAuditLog({
      campaignId: access.campaign.id,
      userId: user.id,
      action: "report_generated",
      entityType: "report",
      newData: { format, type, includeAmounts },
    });

    if (format === "csv") {
      const csv = buildContributorsCsv(
        contributors,
        includeAmounts,
        access.campaign.currency,
      );
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${access.campaign.campaignCode}-contributors.csv"`,
        },
      });
    }

    if (format === "xlsx") {
      const buffer = await buildCampaignWorkbook({
        campaign: access.campaign,
        contributors,
        payments,
        expenses,
        includeAmounts,
      });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${access.campaign.campaignCode}-report.xlsx"`,
        },
      });
    }

    const summary = {
      campaign: access.campaign.name,
      code: access.campaign.campaignCode,
      target: formatMoney(access.campaign.targetAmount, access.campaign.currency),
      pledged: formatMoney(access.campaign.totalPledged, access.campaign.currency),
      received: formatMoney(access.campaign.totalReceived, access.campaign.currency),
      outstanding: formatMoney(
        Math.max(0, access.campaign.totalPledged - access.campaign.totalReceived),
        access.campaign.currency,
      ),
      expenses: formatMoney(access.campaign.totalExpenses, access.campaign.currency),
      availableBalance: formatMoney(
        access.campaign.availableBalance,
        access.campaign.currency,
      ),
      contributors: contributors.length,
      daysRemaining: daysRemaining(access.campaign.deadline),
      statusBreakdown: contributors.reduce<Record<string, number>>((acc, c) => {
        const key = publicStatusLabel(c.status);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({
      summary,
      contributors: includeAmounts
        ? contributors
        : contributors.map((c) => ({
            displayName: c.displayName,
            status: c.status,
            publicStatus: publicStatusLabel(c.status),
          })),
      includeAmounts,
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
