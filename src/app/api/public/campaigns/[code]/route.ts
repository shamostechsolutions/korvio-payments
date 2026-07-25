import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { daysRemaining, formatMoney } from "@/lib/utils/money";
import { publicStatusLabel } from "@/lib/status";
import { whatsappJoinLink } from "@/lib/utils/codes";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { campaignCode: code.toUpperCase() },
  });

  if (!campaign || ["CANCELLED", "DRAFT"].includes(campaign.status)) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const contributors = await prisma.contributor.findMany({
    where: { campaignId: campaign.id },
    orderBy: { displayName: "asc" },
  });

  const listVisible = campaign.contributorListVisibility !== "HIDDEN";
  const publicList = listVisible
    ? contributors
        .filter((c) => !c.hideFromList)
        .filter((c) => {
          if (campaign.contributorListVisibility === "OPT_IN_ONLY") {
            return c.publicName || c.anonymous;
          }
          return true;
        })
        .map((c, index) => {
          const name =
            c.anonymous ||
            campaign.contributorListVisibility === "STATUSES_WITHOUT_NAMES"
              ? "Anonymous contributor"
              : c.displayName;

          const showAmount =
            c.publicAmount &&
            (campaign.contributionAmountVisibility !== "PRIVATE" ||
              campaign.contributorListVisibility === "AMOUNTS_WHEN_PERMITTED");

          return {
            position: index + 1,
            name:
              campaign.contributorListVisibility === "STATUSES_WITHOUT_NAMES"
                ? undefined
                : name,
            status:
              campaign.contributorListVisibility === "NAMES_ONLY"
                ? undefined
                : publicStatusLabel(c.status),
            amount: showAmount
              ? formatMoney(c.paidAmount || c.pledgedAmount, campaign.currency)
              : undefined,
          };
        })
    : [];

  const counts = {
    fullyPaid: contributors.filter((c) =>
      ["FULLY_PAID", "PAID_WITHOUT_PLEDGE", "OVERPAID"].includes(c.status),
    ).length,
    partiallyPaid: contributors.filter((c) => c.status === "PARTIALLY_PAID").length,
    pledged: contributors.filter((c) => c.status === "PLEDGED").length,
    unpaid: contributors.filter((c) =>
      ["JOINED", "NOT_YET_PLEDGED", "NOT_JOINED"].includes(c.status),
    ).length,
  };

  return NextResponse.json({
    campaign: {
      name: campaign.name,
      code: campaign.campaignCode,
      description: campaign.description,
      category: campaign.category,
      currency: campaign.currency,
      target: formatMoney(campaign.targetAmount, campaign.currency),
      pledged: formatMoney(campaign.totalPledged, campaign.currency),
      received: formatMoney(campaign.totalReceived, campaign.currency),
      outstanding: formatMoney(
        Math.max(0, campaign.totalPledged - campaign.totalReceived),
        campaign.currency,
      ),
      deadline: campaign.deadline,
      daysRemaining: daysRemaining(campaign.deadline),
      organiserName: campaign.organiserName,
      imageUrl: campaign.imageUrl,
      status: campaign.status,
    },
    counts: {
      contributors: contributors.length,
      ...counts,
    },
    contributors: publicList,
    whatsappUrl: whatsappJoinLink(
      process.env.WHATSAPP_BUSINESS_NUMBER || "256700000000",
      campaign.campaignCode,
    ),
  });
}
