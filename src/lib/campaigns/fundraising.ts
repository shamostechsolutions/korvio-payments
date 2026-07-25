import type { CampaignStatus, FundraisingMode } from "@prisma/client";

export type CampaignFundraisingFields = {
  fundraisingMode?: FundraisingMode | null;
  targetAmount: number;
  totalReceived?: number;
  status: CampaignStatus;
};

export const OPEN_FUNDRAISING_DEFAULT_CATEGORIES = new Set([
  "FUNERAL",
  "FAMILY_EMERGENCY",
  "COMMUNITY",
]);

export function isOpenFundraising(campaign: Pick<CampaignFundraisingFields, "fundraisingMode">) {
  return campaign.fundraisingMode === "OPEN";
}

export function campaignProgressPct(
  campaign: Pick<CampaignFundraisingFields, "fundraisingMode" | "targetAmount" | "totalReceived">,
): number | null {
  if (isOpenFundraising(campaign)) return null;
  if (campaign.targetAmount <= 0) return 0;
  const received = campaign.totalReceived ?? 0;
  return Math.round((received / campaign.targetAmount) * 100);
}

export function isCampaignFundraisingComplete(
  campaign: CampaignFundraisingFields,
): boolean {
  if (campaign.status === "COMPLETED" || campaign.status === "CLOSED") {
    return true;
  }
  const progress = campaignProgressPct(campaign);
  return progress !== null && progress >= 100;
}

export function fundraisingModeLabel(mode: FundraisingMode | null | undefined) {
  return mode === "OPEN" ? "Open contributions" : "Fundraising goal";
}
