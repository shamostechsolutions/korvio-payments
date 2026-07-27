import type { Campaign, CampaignStatus } from "@prisma/client";

export function canOrganiserDeleteDraft(campaign: Pick<Campaign, "status">) {
  return campaign.status === "DRAFT";
}

export function canOrganiserRequestDeletion(campaign: Pick<Campaign, "status" | "deletionRequestedAt">) {
  if (campaign.status === "DRAFT" || campaign.status === "CANCELLED") return false;
  return !campaign.deletionRequestedAt;
}

const LIVE_STATUSES = new Set<CampaignStatus>([
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CLOSED",
  "ARCHIVED",
]);

export function isLiveCampaignStatus(status: CampaignStatus) {
  return LIVE_STATUSES.has(status);
}
