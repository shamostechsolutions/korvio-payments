"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  campaignName: string;
  campaignCode: string;
  url: string;
};

export function ShareButtons({ campaignName, campaignCode, url }: Props) {
  const [copied, setCopied] = useState(false);
  const whatsappText = encodeURIComponent(
    `Support "${campaignName}" on Korvio: ${url}`,
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={() => void copyLink()}>
        {copied ? "Link copied" : "Copy link"}
      </Button>
      <a href={whatsappUrl} target="_blank" rel="noreferrer">
        <Button type="button" variant="secondary" size="sm">
          Share on WhatsApp
        </Button>
      </a>
      <span className="self-center text-xs text-[var(--ink-soft)]">{campaignCode}</span>
    </div>
  );
}
