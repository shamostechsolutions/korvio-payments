import type { Campaign, Contributor, PaymentMethod } from "@prisma/client";
import { formatMoney } from "@/lib/utils/money";
import { sendButtons, sendCtaUrl, sendList, sendText } from "./client";
import { balanceMessage, campaignIntroMessage, progressMessage } from "./messages";

export function createCampaignUrl() {
  const base = (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}/register?intent=create-campaign&from=whatsapp`;
}

export async function sendCreateCampaignInvite(to: string) {
  const url = createCampaignUrl();
  return sendCtaUrl(to, {
    header: "Start your own campaign",
    body: [
      "Set up pledges and payments for your group on Korvio.",
      "",
      "Tap below to create your campaign in a few minutes.",
    ].join("\n"),
    displayText: "Create campaign",
    url,
    footer: "Opens the Korvio website",
  });
}

export async function sendOnboardingMenu(to: string) {
  return sendButtons(to, {
    body: [
      "👋 Welcome to Korvio.",
      "",
      "Join a campaign with a group link, or create your own.",
    ].join("\n"),
    buttons: [
      { id: "JOIN_HELP", title: "Join a campaign" },
      { id: "CREATE_CAMPAIGN", title: "Create campaign" },
    ],
  });
}

/** Full campaign context before asking for payment. */
export async function sendCampaignIntro(to: string, campaign: Campaign) {
  return sendText(to, { body: campaignIntroMessage(campaign) });
}

/** Ask user to type amount after they've seen campaign details. */
export async function sendPayAmountPrompt(to: string, campaign: Campaign) {
  return sendButtons(to, {
    body: [
      "Ready to contribute?",
      "",
      "Reply with the amount you want to pay — e.g. 50000 or 50k",
    ].join("\n"),
    buttons: [
      { id: "STATUS", title: "My status" },
      { id: "MENU", title: "More options" },
    ],
  });
}

export async function sendCampaignJoinFlow(to: string, campaign: Campaign) {
  await sendCampaignIntro(to, campaign);
  return sendPayAmountPrompt(to, campaign);
}

export async function sendMoreOptionsMenu(to: string, campaign: Campaign) {
  return sendList(to, {
    body: `More options for ${campaign.name}`,
    buttonText: "Options",
    sections: [
      {
        title: "Campaign",
        rows: [
          { id: "4", title: "Campaign progress" },
          { id: "PLEDGE", title: "Pledge for later" },
          { id: "5", title: "Contact treasurer" },
          { id: "6", title: "Create my campaign" },
        ],
      },
    ],
  });
}

export async function sendBalanceSummary(
  to: string,
  campaign: Campaign,
  contributor: Contributor,
) {
  await sendText(to, { body: balanceMessage(campaign, contributor) });
  return sendButtons(to, {
    body: "Pay again? Reply with the amount you want to pay.",
    buttons: [
      { id: "PAY", title: "Pay now" },
      { id: "MENU", title: "More options" },
    ],
  });
}

export async function sendProgressSummary(
  to: string,
  campaign: Campaign,
  contributorCount: number,
  counts: { fullyPaid: number; partiallyPaid: number; pledged: number },
) {
  await sendText(to, {
    body: progressMessage(campaign, contributorCount, counts),
  });
  return sendPayAmountPrompt(to, campaign);
}

export async function sendPledgeAmountPrompt(to: string) {
  return sendText(to, {
    body: "How much would you like to pledge? Reply with the amount — e.g. 300000 or 300k",
  });
}

export async function sendReminderAudienceMenu(to: string) {
  return sendList(to, {
    body: "Who should receive private reminders?",
    buttonText: "Choose audience",
    sections: [
      {
        title: "Audience",
        rows: [
          { id: "1", title: "All outstanding" },
          { id: "2", title: "Not paid at all" },
          { id: "3", title: "Partially paid" },
          { id: "5", title: "Promised date passed" },
        ],
      },
    ],
  });
}

export async function sendReminderConfirmMenu(to: string) {
  return sendButtons(to, {
    body: "Confirm sending private reminders now?",
    buttons: [
      { id: "YES", title: "Yes, send now" },
      { id: "NO", title: "Cancel" },
    ],
  });
}

export async function sendCampaignPicker(
  to: string,
  campaigns: { id: string; name: string }[],
) {
  return sendList(to, {
    body: "Your active campaigns\n\nChoose one to continue.",
    buttonText: "Campaigns",
    sections: [
      {
        title: "Campaigns",
        rows: campaigns.slice(0, 10).map((c, i) => ({
          id: String(i + 1),
          title: c.name.slice(0, 24),
        })),
      },
    ],
  });
}

export function defaultPaymentMethod(campaign: Campaign): PaymentMethod {
  const methods = campaign.paymentMethods || [];
  if (methods.includes("MTN_MOMO")) return "MTN_MOMO";
  if (methods.includes("AIRTEL_MONEY")) return "AIRTEL_MONEY";
  if (methods.includes("CARD")) return "CARD";
  if (methods.includes("BANK")) return "BANK";
  return "MTN_MOMO";
}

export function paymentMethodLabel(method: PaymentMethod) {
  switch (method) {
    case "MTN_MOMO":
      return "MTN Mobile Money";
    case "AIRTEL_MONEY":
      return "Airtel Money";
    case "BANK":
      return "Bank";
    case "CARD":
      return "Card";
    default:
      return method.replaceAll("_", " ");
  }
}

export async function sendPaymentCheckout(
  to: string,
  input: {
    campaign: Campaign;
    amount: number;
    checkoutUrl: string;
    reference: string;
  },
) {
  return sendCtaUrl(to, {
    body: [
      "💳 Ready to pay",
      "",
      `Campaign: ${input.campaign.name}`,
      `Amount: ${formatMoney(input.amount, input.campaign.currency)}`,
      "",
      "Tap below to open secure checkout. Your receipt will arrive here on WhatsApp after payment.",
    ].join("\n"),
    displayText: "Pay now",
    url: input.checkoutUrl,
    footer: `Ref: ${input.reference}`,
  });
}
