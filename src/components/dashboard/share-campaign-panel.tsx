"use client";

import { Clock, ExternalLink } from "lucide-react";
import { CampaignShareActions } from "@/components/campaign/campaign-share-actions";
import type { CampaignShareMessageInput } from "@/lib/campaigns/share-message";

type Props = CampaignShareMessageInput & {
  campaignCode: string;
  isLive?: boolean;
};

export function ShareCampaignPanel({
  publicUrl,
  campaignCode,
  isLive = true,
  ...shareInput
}: Props) {
  if (!isLive) {
    return (
      <div className="dash-card p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-[var(--dash-ink)]">Not live yet</h2>
            <p className="mt-1 text-sm text-[var(--dash-muted)]">
              Your campaign is with Korvio for review. You cannot share a public link until it is
              approved — sharing now would send people to a page that does not work.
            </p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--dash-muted)]">
              Reference code · {campaignCode}
            </p>
            <p className="mt-4 text-sm text-[var(--dash-muted)]">
              Check back here — your share message will appear once Korvio approves the campaign.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--dash-ink)]">Share campaign</h2>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">
            Copy the message below into your group chat, or share straight to WhatsApp.
          </p>
        </div>
        <a href={publicUrl} target="_blank" rel="noreferrer" className="dash-btn-secondary shrink-0">
          <ExternalLink className="h-4 w-4" />
          Open page
        </a>
      </div>

      <div className="mt-4">
        <CampaignShareActions
          variant="dashboard"
          campaignCode={campaignCode}
          publicUrl={publicUrl}
          {...shareInput}
        />
      </div>
    </div>
  );
}
