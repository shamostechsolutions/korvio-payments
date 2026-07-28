import type { CampaignCategory } from "@prisma/client";
import { formatMoney } from "@/lib/utils/money";
import { isOpenFundraising } from "@/lib/campaigns/fundraising";

export type CampaignShareMessageInput = {
  name: string;
  category: CampaignCategory;
  beneficiaryName?: string | null;
  currency: string;
  targetAmount: number;
  fundraisingMode?: "GOAL" | "OPEN" | null;
  totalReceived?: number;
  contributorCount: number;
  publicUrl: string;
};

function collectionCause(input: CampaignShareMessageInput): string {
  const who = input.beneficiaryName?.trim() || input.name;

  switch (input.category) {
    case "MEDICAL":
      return `${who}'s medical bills`;
    case "FUNERAL":
      return `${who}'s funeral`;
    case "EDUCATION":
      return `${who}'s school fees`;
    case "WEDDING":
    case "INTRODUCTION":
      return who;
    case "FAMILY_EMERGENCY":
      return `${who}'s emergency fund`;
    case "CHURCH":
      return input.name;
    case "COMMUNITY":
      return input.name;
    case "OFFICE":
      return input.name;
    case "BIRTHDAY":
      return `${who}'s birthday`;
    case "ALUMNI":
      return input.name;
    default:
      return input.name;
  }
}

function peopleJoinedLine(count: number) {
  if (count === 0) return "Be the first to contribute";
  if (count === 1) return "1 person already joined";
  return `${count} people already joined`;
}

function statsLine(input: CampaignShareMessageInput): string {
  const people = peopleJoinedLine(input.contributorCount);

  if (isOpenFundraising(input)) {
    const raised = input.totalReceived ?? 0;
    if (raised > 0) {
      return `${formatMoney(raised, input.currency)} raised · ${people}`;
    }
    return `Open contributions · ${people}`;
  }

  return `Goal: ${formatMoney(input.targetAmount, input.currency)} · ${people}`;
}

export function generateCampaignShareMessage(input: CampaignShareMessageInput): string {
  const cause = collectionCause(input);
  return [
    `🙏 We're collecting for ${cause}.`,
    `Every contribution helps. Tap to give: ${input.publicUrl}`,
    statsLine(input),
  ].join("\n");
}

export function whatsappShareUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
