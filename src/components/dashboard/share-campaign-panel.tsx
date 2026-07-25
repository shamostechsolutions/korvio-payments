"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";

type Props = {
  publicUrl: string;
  campaignCode: string;
};

export function ShareCampaignPanel({ publicUrl, campaignCode }: Props) {
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
        Send this link to your group. Contributors join and pay on the web — no app needed.
      </p>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--dash-muted)]">
        Code · {campaignCode}
      </p>
      <p className="mt-1 break-all rounded-lg bg-[var(--dash-bg)] px-3 py-2 text-sm text-teal-400">
        {publicUrl}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => void copyLink()} className="dash-btn-secondary">
          <Copy className="h-4 w-4" />
          {copied ? "Copied" : "Copy link"}
        </button>
        <a href={publicUrl} target="_blank" rel="noreferrer" className="dash-btn-primary">
          <ExternalLink className="h-4 w-4" />
          Open page
        </a>
      </div>
    </div>
  );
}
