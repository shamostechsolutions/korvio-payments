"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";

type Props = {
  publicUrl: string;
  campaignCode: string;
  isLive?: boolean;
};

export function ShareCampaignPanel({ publicUrl, campaignCode, isLive = true }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="dash-card p-5">
      <h2 className="text-base font-semibold text-[var(--dash-ink)]">Share campaign</h2>
      <p className="mt-1 text-sm text-[var(--dash-muted)]">
        {isLive
          ? "Send this link to your group. Contributors join and pay on the web — no app needed."
          : "Your campaign is awaiting Korvio approval. The public link will work after we review and approve it."}
      </p>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--dash-muted)]">
        Code · {campaignCode}
      </p>
      <p className="mt-1 break-all rounded-lg bg-[var(--dash-bg)] px-3 py-2 text-sm text-teal-400">
        {publicUrl}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="dash-btn-secondary"
          disabled={!isLive}
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copied" : "Copy link"}
        </button>
        {isLive ? (
          <a href={publicUrl} target="_blank" rel="noreferrer" className="dash-btn-primary">
            <ExternalLink className="h-4 w-4" />
            Open page
          </a>
        ) : (
          <span className="dash-btn-primary pointer-events-none opacity-50">Awaiting approval</span>
        )}
      </div>
    </div>
  );
}
