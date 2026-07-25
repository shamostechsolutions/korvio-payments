"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function CampaignAdminActions({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "delete" | null>(null);
  const [error, setError] = useState("");

  async function patch(body: { status: string }) {
    const res = await fetch(`/api/admininterface/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Action failed");
  }

  async function approve() {
    if (!confirm("Approve this campaign and make it live on the public page?")) return;
    setLoading("approve");
    setError("");
    try {
      await patch({ status: "ACTIVE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to approve");
    } finally {
      setLoading(null);
    }
  }

  async function remove() {
    if (
      !confirm(
        "Delete this campaign? It will be removed from the public site and organiser dashboard.",
      )
    ) {
      return;
    }
    setLoading("delete");
    setError("");
    try {
      const res = await fetch(`/api/admininterface/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to delete");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete");
    } finally {
      setLoading(null);
    }
  }

  if (status === "CANCELLED") {
    return <span className="text-xs text-[var(--dash-muted)]">Deleted</span>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {status === "DRAFT" ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void approve()}
            className="dash-btn-primary inline-flex items-center gap-1.5 text-xs"
          >
            {loading === "approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Approve & go live
          </button>
        ) : null}
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => void remove()}
          className="dash-btn-secondary inline-flex items-center gap-1.5 text-xs text-red-400"
        >
          {loading === "delete" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Delete
        </button>
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
