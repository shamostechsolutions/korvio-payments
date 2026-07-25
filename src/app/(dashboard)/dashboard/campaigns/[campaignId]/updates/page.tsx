"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

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
      <div className="surface rounded-3xl p-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-700 text-[var(--brand)]">
          WhatsApp updates
        </h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Korvio generates a fresh group update you can paste into WhatsApp. Individual amounts stay private.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void load(true)}>Generate with list</Button>
          <Button variant="secondary" onClick={() => void load(false)}>
            Totals only
          </Button>
        </div>
      </div>

      <section className="surface rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-[var(--brand)]">Group update</h2>
          <Button size="sm" variant="secondary" onClick={() => void copy(update, "update")}>
            {copied === "update" ? "Copied" : "Copy"}
          </Button>
        </div>
        <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#0b3d32] p-4 text-sm text-[#f3e7c8]">
          {update || "Generating..."}
        </pre>
      </section>

      <section className="surface rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-[var(--brand)]">Shareable invite</h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void copy(shareMessage, "share")}
          >
            {copied === "share" ? "Copied" : "Copy"}
          </Button>
        </div>
        <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm text-[var(--ink)]">
          {shareMessage}
        </pre>
      </section>
    </div>
  );
}
