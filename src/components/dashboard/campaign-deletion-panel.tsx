"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type Props = {
  campaignId: string;
  campaignName: string;
  status: string;
  deletionRequestedAt: string | null;
  isOwner: boolean;
};

export function CampaignDeletionPanel({
  campaignId,
  campaignName,
  status,
  deletionRequestedAt,
  isOwner,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestedAt, setRequestedAt] = useState(deletionRequestedAt);

  if (!isOwner || status === "CANCELLED") return null;

  const isDraft = status === "DRAFT";
  const hasDeletionRequest = Boolean(requestedAt);

  async function handleConfirm() {
    setLoading(true);
    setError("");

    try {
      if (isDraft) {
        const res = await fetch(`/api/campaigns/${campaignId}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to delete campaign");
        setOpen(false);
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const res = await fetch(`/api/campaigns/${campaignId}/deletion-request`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to request deletion");
      setRequestedAt(data.campaign.deletionRequestedAt);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dash-card border-red-500/20 p-5">
      <h2 className="text-base font-semibold text-[var(--dash-ink)]">
        {isDraft ? "Delete campaign" : "Remove campaign"}
      </h2>
      {isDraft ? (
        <p className="mt-1 text-sm text-[var(--dash-muted)]">
          This campaign is still pending approval. You can delete it now — no request needed.
        </p>
      ) : hasDeletionRequest ? (
        <p className="mt-1 text-sm text-[var(--dash-muted)]">
          You requested deletion on{" "}
          <span className="font-medium text-[var(--dash-ink)]">
            {new Date(requestedAt!).toLocaleString()}
          </span>
          . Korvio will review and remove the campaign. It stays live until then.
        </p>
      ) : (
        <p className="mt-1 text-sm text-[var(--dash-muted)]">
          This campaign is live. You cannot delete it yourself — request removal and Korvio will
          review before taking it down.
        </p>
      )}

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

      {!hasDeletionRequest || isDraft ? (
        <button
          type="button"
          className="mt-4 dash-btn-secondary text-red-400"
          onClick={() => setOpen(true)}
        >
          {isDraft ? "Delete campaign" : "Request deletion"}
        </button>
      ) : null}

      <ConfirmModal
        open={open}
        onOpenChange={(next) => {
          if (!loading) setOpen(next);
        }}
        title={isDraft ? "Delete this campaign?" : "Request campaign deletion?"}
        description={
          isDraft
            ? `"${campaignName}" will be removed permanently. This cannot be undone.`
            : `"${campaignName}" will stay live for now. Korvio will review your request and remove the public page if approved.`
        }
        confirmLabel={isDraft ? "Delete campaign" : "Submit request"}
        variant="danger"
        loading={loading}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
