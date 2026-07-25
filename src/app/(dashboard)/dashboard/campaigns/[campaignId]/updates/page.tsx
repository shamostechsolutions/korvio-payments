"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashCard, DashMessage, DashPageHeader } from "@/components/dashboard/dash-page";

export default function UpdatesPage() {
  const params = useParams<{ campaignId: string }>();
  const [update, setUpdate] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [copied, setCopied] = useState("");

  async function load(list = true) {
    const res = await fetch(
      `/api/campaigns/${params.campaignId}/updates?list=${list ? "1" : "0"}`,
    );
    const data = await res.json();
    if (res.ok) {
      setUpdate(data.update);
      setShareMessage(data.shareMessage);
    }
  }

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.campaignId]);

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  return (
    <div className="space-y-6">
      <DashPageHeader
        title="Group updates"
        description="Generate a progress update you can copy and share with your group. Individual amounts stay private."
      />

      <DashCard>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void load(true)} className="dash-btn-primary">
            Generate with list
          </button>
          <button type="button" onClick={() => void load(false)} className="dash-btn-secondary">
            Totals only
          </button>
        </div>
      </DashCard>

      <DashCard>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-[var(--dash-ink)]">Group update</h2>
          <button
            type="button"
            className="dash-btn-secondary text-sm"
            onClick={() => void copy(update, "update")}
          >
            {copied === "update" ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-[var(--dash-bg)] p-4 text-sm text-[var(--dash-ink)]">
          {update || "Generating..."}
        </pre>
      </DashCard>

      <DashCard>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-[var(--dash-ink)]">Shareable invite</h2>
          <button
            type="button"
            className="dash-btn-secondary text-sm"
            onClick={() => void copy(shareMessage, "share")}
          >
            {copied === "share" ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-[var(--dash-bg)] p-4 text-sm text-[var(--dash-muted)]">
          {shareMessage}
        </pre>
      </DashCard>
    </div>
  );
}
