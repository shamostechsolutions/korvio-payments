import type { Campaign, FundraisingMode } from "@prisma/client";
import { isOpenFundraising } from "@/lib/campaigns/fundraising";

/** Minimum wallet balance required to request a cash-out (UGX cents/smallest unit). */
export const MIN_CASHOUT_AMOUNT = Number(process.env.MIN_CASHOUT_AMOUNT ?? "50000");

const CASHOUT_BLOCKED_STATUSES = new Set<Campaign["status"]>([
  "DRAFT",
  "CANCELLED",
  "ARCHIVED",
  "PAUSED",
]);

const FINAL_CASHOUT_STATUSES = new Set<Campaign["status"]>(["CLOSED", "COMPLETED"]);

export function isFinalCashoutEligible(status: Campaign["status"]) {
  return FINAL_CASHOUT_STATUSES.has(status);
}

export function canCampaignRequestCashout(input: {
  status: Campaign["status"];
  availableBalance: number;
  hasPendingCashout: boolean;
}): boolean {
  if (CASHOUT_BLOCKED_STATUSES.has(input.status)) return false;
  if (input.hasPendingCashout) return false;
  if (input.availableBalance <= 0) return false;
  if (input.availableBalance >= MIN_CASHOUT_AMOUNT) return true;
  return isFinalCashoutEligible(input.status);
}

export function minCashoutForCampaign(input: {
  status: Campaign["status"];
  availableBalance: number;
}): number {
  if (
    isFinalCashoutEligible(input.status) &&
    input.availableBalance > 0 &&
    input.availableBalance < MIN_CASHOUT_AMOUNT
  ) {
    return input.availableBalance;
  }
  return MIN_CASHOUT_AMOUNT;
}

export function canCloseCampaign(status: Campaign["status"] | string): boolean {
  return status === "ACTIVE";
}

export function resolveCloseStatus(campaign: {
  fundraisingMode: FundraisingMode | null;
  targetAmount: number;
  totalReceived: number;
}): "COMPLETED" | "CLOSED" {
  if (isOpenFundraising(campaign)) {
    return "CLOSED";
  }
  if (campaign.totalReceived >= campaign.targetAmount) {
    return "COMPLETED";
  }
  return "CLOSED";
}

export function maskPayoutPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "Mobile money";
  return `${digits.slice(0, 3)}***${digits.slice(-3)}`;
}
