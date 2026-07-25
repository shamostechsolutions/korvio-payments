"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CampaignVerifyToggle({
  campaignId,
  isVerified,
}: {
  campaignId: string;
  isVerified: boolean;
}) {
  const router = useRouter();
  const [verified, setVerified] = useState(isVerified);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/admininterface/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: !verified }),
    });
    setLoading(false);
    if (!res.ok) return;
    setVerified(!verified);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void toggle()}
      className={
        verified
          ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400"
          : "rounded-full bg-[var(--dash-bg)] px-3 py-1 text-xs font-semibold text-[var(--dash-muted)]"
      }
    >
      {loading ? "..." : verified ? "Verified" : "Verify"}
    </button>
  );
}
