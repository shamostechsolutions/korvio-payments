import type { Campaign, Contributor } from "@prisma/client";
import { daysRemaining, formatMoney } from "@/lib/utils/money";
import { publicStatusLabel } from "@/lib/status";
import { whatsappJoinLink } from "@/lib/utils/codes";

type UpdateInput = {
  campaign: Campaign;
  contributors: Contributor[];
  includeList?: boolean;
  recentActivity?: string[];
};

function countByStatus(contributors: Contributor[]) {
  const fullyPaid = contributors.filter((c) =>
    ["FULLY_PAID", "PAID_WITHOUT_PLEDGE", "OVERPAID", "WAIVED"].includes(c.status),
  ).length;
  const partiallyPaid = contributors.filter((c) => c.status === "PARTIALLY_PAID").length;
  const pledged = contributors.filter((c) => c.status === "PLEDGED").length;
  const unpaid = contributors.filter((c) =>
    ["JOINED", "NOT_YET_PLEDGED", "NOT_JOINED", "PAYMENT_FAILED"].includes(c.status),
  ).length;

  return { fullyPaid, partiallyPaid, pledged, unpaid };
}

export function generateGroupUpdate({
  campaign,
  contributors,
  includeList = true,
  recentActivity = [],
}: UpdateInput): string {
  const counts = countByStatus(contributors);
  const outstanding = Math.max(0, campaign.totalPledged - campaign.totalReceived);
  const link = whatsappJoinLink(
    process.env.WHATSAPP_BUSINESS_NUMBER || "256700000000",
    campaign.campaignCode,
  );

  const lines = [
    "━━━━━━━━━━━━━━━━",
    "",
    `🎉 ${campaign.name}`,
    "",
    "🎯 Target",
    formatMoney(campaign.targetAmount, campaign.currency),
    "",
    "🤝 Pledged",
    formatMoney(campaign.totalPledged, campaign.currency),
    "",
    "✅ Received",
    formatMoney(campaign.totalReceived, campaign.currency),
    "",
    "⏳ Outstanding",
    formatMoney(outstanding, campaign.currency),
    "",
    "👥 Contributors",
    String(contributors.length),
    "",
    "✅ Fully paid",
    String(counts.fullyPaid),
    "",
    "🟡 Partially paid",
    String(counts.partiallyPaid),
    "",
    "🤝 Pledged",
    String(counts.pledged),
    "",
    "📅 Days remaining",
    String(daysRemaining(campaign.deadline)),
  ];

  if (includeList && campaign.contributorListVisibility !== "HIDDEN") {
    lines.push("", "Contribution status", "");
    const visible = contributors
      .filter((c) => !c.hideFromList)
      .filter((c) => {
        if (campaign.contributorListVisibility === "OPT_IN_ONLY") {
          return c.publicName || c.anonymous;
        }
        return true;
      })
      .slice(0, 40);

    visible.forEach((c, index) => {
      const name =
        c.anonymous || campaign.contributorListVisibility === "STATUSES_WITHOUT_NAMES"
          ? "Anonymous contributor"
          : c.displayName;

      if (campaign.contributorListVisibility === "NAMES_ONLY") {
        lines.push(`${index + 1}. ${name}`);
      } else {
        const amountPart =
          c.publicAmount &&
          (campaign.contributionAmountVisibility !== "PRIVATE" ||
            campaign.contributorListVisibility === "AMOUNTS_WHEN_PERMITTED")
            ? ` — ${formatMoney(c.paidAmount || c.pledgedAmount, campaign.currency)}`
            : "";
        lines.push(`${index + 1}. ${name} — ${publicStatusLabel(c.status)}${amountPart}`);
      }
    });
  }

  if (recentActivity.length) {
    lines.push("", "Recent activity", "");
    recentActivity.slice(0, 5).forEach((item) => lines.push(item));
  }

  lines.push(
    "",
    "Tap below to pledge, pay or check your balance:",
    link,
    "",
    "━━━━━━━━━━━━━━━━",
  );

  return lines.join("\n");
}

export function generateShareMessage(campaign: Campaign): string {
  const link = whatsappJoinLink(
    process.env.WHATSAPP_BUSINESS_NUMBER || "256700000000",
    campaign.campaignCode,
  );

  return [
    `🎉 ${campaign.name}`,
    "",
    `🎯 Target: ${formatMoney(campaign.targetAmount, campaign.currency)}`,
    `📅 Deadline: ${campaign.deadline.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    "",
    "Pledge, pay or check your balance privately on Korvio:",
    link,
  ].join("\n");
}
