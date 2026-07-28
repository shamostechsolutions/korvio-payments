"use client";

import { useState } from "react";
import { Copy, MessageCircle } from "lucide-react";
import {
  generateCampaignShareMessage,
  type CampaignShareMessageInput,
  whatsappShareUrl,
} from "@/lib/campaigns/share-message";
import { Button } from "@/components/ui/button";

type Props = CampaignShareMessageInput & {
  campaignCode: string;
  variant?: "public" | "dashboard";
};

export function CampaignShareActions({
  variant = "public",
  campaignCode,
  ...input
}: Props) {
  const [copied, setCopied] = useState<"link" | "message" | null>(null);

  const message = generateCampaignShareMessage({
    name: input.name,
    category: input.category,
    beneficiaryName: input.beneficiaryName,
    currency: input.currency,
    targetAmount: input.targetAmount,
    fundraisingMode: input.fundraisingMode,
    totalReceived: input.totalReceived,
    contributorCount: input.contributorCount,
    publicUrl: input.publicUrl,
  });

  async function copy(text: string, key: "link" | "message") {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const isDashboard = variant === "dashboard";

  return (
    <div className="space-y-4">
      <pre className="whitespace-pre-wrap rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm leading-relaxed text-[var(--ink-soft)]">
        {message}
      </pre>

      <div className="flex flex-wrap gap-2">
        {isDashboard ? (
          <>
            <button
              type="button"
              onClick={() => void copy(message, "message")}
              className="dash-btn-primary"
            >
              <Copy className="h-4 w-4" />
              {copied === "message" ? "Copied" : "Copy message"}
            </button>
            <button
              type="button"
              onClick={() => void copy(input.publicUrl, "link")}
              className="dash-btn-secondary"
            >
              <Copy className="h-4 w-4" />
              {copied === "link" ? "Copied" : "Copy link"}
            </button>
            <a
              href={whatsappShareUrl(message)}
              target="_blank"
              rel="noreferrer"
              className="dash-btn-secondary"
            >
              <MessageCircle className="h-4 w-4" />
              Share on WhatsApp
            </a>
          </>
        ) : (
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => void copy(message, "message")}>
              {copied === "message" ? "Message copied" : "Copy message"}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => void copy(input.publicUrl, "link")}>
              {copied === "link" ? "Link copied" : "Copy link"}
            </Button>
            <a href={whatsappShareUrl(message)} target="_blank" rel="noreferrer">
              <Button type="button" variant="secondary" size="sm">
                Share on WhatsApp
              </Button>
            </a>
          </>
        )}
      </div>

      <p className={`text-xs ${isDashboard ? "text-[var(--dash-muted)]" : "text-[var(--ink-soft)]"}`}>
        Code · {campaignCode}
      </p>
    </div>
  );
}
