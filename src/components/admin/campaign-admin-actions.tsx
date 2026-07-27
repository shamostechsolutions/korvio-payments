"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type PendingAction = "approve" | "delete";

const actionConfig: Record<
  PendingAction,
  {
    title: string;
    description: string;
    confirmLabel: string;
    variant: "default" | "danger";
  }
> = {
  approve: {
    title: "Approve campaign?",
    description: "This campaign will go live on the public page and can start accepting contributions.",
    confirmLabel: "Approve & go live",
    variant: "default",
  },
  delete: {
    title: "Delete campaign?",
    description:
      "This campaign will be removed from the public site and organiser dashboard. This action cannot be undone.",
    confirmLabel: "Delete",
    variant: "danger",
  },
};

export function CampaignAdminActions({
  campaignId,
  status,
  deletionRequestedAt,
}: {
  campaignId: string;
  status: string;
  deletionRequestedAt?: Date | string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<PendingAction | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
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

  async function handleConfirm() {
    if (!pendingAction) return;

    setLoading(pendingAction);
    setError("");
    try {
      if (pendingAction === "approve") {
        await patch({ status: "ACTIVE" });
      } else {
        const res = await fetch(`/api/admininterface/campaigns/${campaignId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to delete");
      }
      setPendingAction(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  if (status === "CANCELLED") {
    return <span className="text-xs text-[var(--dash-muted)]">Deleted</span>;
  }

  const modal = pendingAction ? actionConfig[pendingAction] : null;

  return (
    <>
      <div className="flex flex-col gap-2">
        {deletionRequestedAt ? (
          <p className="text-xs font-medium text-red-400">Deletion requested by organiser</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {status === "DRAFT" ? (
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => setPendingAction("approve")}
              className="dash-btn-primary inline-flex items-center gap-1.5 text-xs"
            >
              Approve & go live
            </button>
          ) : null}
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => setPendingAction("delete")}
            className="dash-btn-secondary inline-flex items-center gap-1.5 text-xs text-red-400"
          >
            Delete
          </button>
        </div>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>

      {modal ? (
        <ConfirmModal
          open={pendingAction !== null}
          onOpenChange={(open) => {
            if (!open && !loading) setPendingAction(null);
          }}
          title={modal.title}
          description={modal.description}
          confirmLabel={modal.confirmLabel}
          variant={modal.variant}
          loading={loading !== null}
          onConfirm={handleConfirm}
        />
      ) : null}
    </>
  );
}
