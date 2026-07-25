"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
      <div className="dash-card p-6">
        <h1 className="text-2xl font-bold text-[var(--dash-ink)]">Group updates</h1>
        <p className="mt-2 text-sm text-[var(--dash-muted)]">
          Generate a progress update you can copy and share with your group. Individual amounts
          stay private.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void load(true)} className="dash-btn-primary">
            Generate with list
          </button>
          <button type="button" onClick={() => void load(false)} className="dash-btn-secondary">
            Totals only
          </button>
        </div>
      </div>

      <section className="dash-card p-5">
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
      </section>

      <section className="dash-card p-5">
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
      </section>
    </div>
  );
}
