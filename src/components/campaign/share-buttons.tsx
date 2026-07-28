"use client";

import { CampaignShareActions } from "@/components/campaign/campaign-share-actions";
import type { CampaignShareMessageInput } from "@/lib/campaigns/share-message";

type Props = CampaignShareMessageInput & {
  campaignCode: string;
};

export function ShareButtons(props: Props) {
  return <CampaignShareActions variant="public" {...props} />;
}
