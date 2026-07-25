import type { Campaign, Contributor } from "@prisma/client";
import { isOpenFundraising } from "@/lib/campaigns/fundraising";
import { daysRemaining, formatMoney } from "@/lib/utils/money";
import { publicStatusLabel } from "@/lib/status";

export function campaignIntroMessage(campaign: Campaign) {
  const outstanding = Math.max(0, campaign.totalPledged - campaign.totalReceived);
  const lines = [
    "👋 Welcome to Korvio",
    "",
    `🎉 ${campaign.name}`,
  ];

  if (campaign.description?.trim()) {
    lines.push("", campaign.description.trim());
  }

  lines.push(
    "",
    "📊 Campaign progress",
  );

  if (!isOpenFundraising(campaign)) {
    lines.push(`🎯 Target: ${formatMoney(campaign.targetAmount, campaign.currency)}`);
  } else {
    lines.push("🤝 Open contributions — give what you can");
  }

  lines.push(
    `🤝 Pledged: ${formatMoney(campaign.totalPledged, campaign.currency)}`,
    `✅ Received: ${formatMoney(campaign.totalReceived, campaign.currency)}`,
    `⏳ Outstanding: ${formatMoney(outstanding, campaign.currency)}`,
    `📅 ${daysRemaining(campaign.deadline)} days remaining`,
  );

  if (campaign.beneficiaryName) {
    lines.push(`💝 For: ${campaign.beneficiaryName}`);
  }

  lines.push(
    `👤 Organiser: ${campaign.organiserName}`,
    "",
    "Your contribution amount stays private.",
    "Only you and authorised treasurers can see it.",
  );

  return lines.join("\n");
}

export function pledgeConfirmation(campaign: Campaign, contributor: Contributor) {
  return [
    "🤝 Pledge recorded",
    "",
    "Campaign:",
    campaign.name,
    "",
    "Your pledge:",
    formatMoney(contributor.pledgedAmount, campaign.currency),
    "",
    "Paid:",
    formatMoney(contributor.paidAmount, campaign.currency),
    "",
    "Remaining:",
    formatMoney(contributor.outstandingAmount, campaign.currency),
    "",
    "Expected payment date:",
    contributor.expectedPaymentDate
      ? contributor.expectedPaymentDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Not sure yet",
    "",
    "Your amount is private and can only be viewed by you and authorised campaign administrators.",
    "",
    "Would you like to pay now?",
    "",
    "1. Pay now",
    "2. Pay later",
    "3. Change pledge",
    "4. Cancel",
  ].join("\n");
}

export function balanceMessage(campaign: Campaign, contributor: Contributor) {
  return [
    "📊 Your contribution",
    "",
    "Campaign:",
    campaign.name,
    "",
    "Pledged:",
    formatMoney(contributor.pledgedAmount, campaign.currency),
    "",
    "Paid:",
    formatMoney(contributor.paidAmount, campaign.currency),
    "",
    "Outstanding:",
    formatMoney(contributor.outstandingAmount, campaign.currency),
    "",
    "Status:",
    publicStatusLabel(contributor.status).replace(/^[^\s]+\s/, ""),
    "",
    contributor.expectedPaymentDate
      ? `Expected completion: ${contributor.expectedPaymentDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function progressMessage(campaign: Campaign, contributorCount: number, counts: {
  fullyPaid: number;
  partiallyPaid: number;
  pledged: number;
}) {
  const outstanding = Math.max(0, campaign.totalPledged - campaign.totalReceived);
  return [
    `📊 ${campaign.name}`,
    "",
    "🎯 Target:",
    formatMoney(campaign.targetAmount, campaign.currency),
    "",
    "🤝 Total pledged:",
    formatMoney(campaign.totalPledged, campaign.currency),
    "",
    "✅ Total received:",
    formatMoney(campaign.totalReceived, campaign.currency),
    "",
    "⏳ Outstanding pledges:",
    formatMoney(outstanding, campaign.currency),
    "",
    "👥 Contributors:",
    String(contributorCount),
    "",
    "✅ Fully paid:",
    String(counts.fullyPaid),
    "",
    "🟡 Partially paid:",
    String(counts.partiallyPaid),
    "",
    "🤝 Pledged:",
    String(counts.pledged),
    "",
    "📅 Days remaining:",
    String(daysRemaining(campaign.deadline)),
  ].join("\n");
}

export function paymentReceipt(campaign: Campaign, contributor: Contributor, amount: number, reference: string) {
  return [
    "✅ Payment received",
    "",
    "Campaign:",
    campaign.name,
    "",
    "Amount paid:",
    formatMoney(amount, campaign.currency),
    "",
    "Your total pledge:",
    formatMoney(contributor.pledgedAmount, campaign.currency),
    "",
    "Total paid:",
    formatMoney(contributor.paidAmount, campaign.currency),
    "",
    "Remaining balance:",
    formatMoney(contributor.outstandingAmount, campaign.currency),
    "",
    "Status:",
    publicStatusLabel(contributor.status).replace(/^[^\s]+\s/, ""),
    "",
    "Reference:",
    reference,
    "",
    "Thank you for your support 🎉",
  ].join("\n");
}
