"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function CashoutActions({
  cashoutId,
  status,
  pawapayEnabled,
  payoutPhone,
  payoutRecipientName,
  netAmount,
}: {
  cashoutId: string;
  status: string;
  pawapayEnabled: boolean;
  payoutPhone: string;
  payoutRecipientName: string | null;
  netAmount: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);

  async function patch(body: Record<string, string>) {
    setLoading(body.action ?? body.status ?? "update");
    setError("");
    const res = await fetch(`/api/admininterface/cashouts/${cashoutId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) {
      setError(data.error || "Unable to update cash-out");
      return;
    }
    setApproveOpen(false);
    router.refresh();
  }

  if (["COMPLETED", "FAILED", "CANCELLED"].includes(status)) {
    return <span className="text-xs text-[var(--dash-muted)]">Finalized</span>;
  }

  const receiverLabel = payoutRecipientName
    ? `${payoutRecipientName} (${payoutPhone})`
    : payoutPhone;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {status === "PENDING" && pawapayEnabled ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => setApproveOpen(true)}
            className="dash-btn-primary inline-flex items-center gap-1.5 text-xs"
          >
            {loading === "approve_payout" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : null}
            Approve & send payout
          </button>
        ) : null}

        {status === "PENDING" && !pawapayEnabled ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void patch({ status: "PROCESSING" })}
            className="dash-btn-secondary inline-flex items-center gap-1.5 text-xs"
          >
            {loading === "PROCESSING" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Mark processing
          </button>
        ) : null}

        {!pawapayEnabled || status === "PROCESSING" ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void patch({ status: "COMPLETED" })}
            className={
              pawapayEnabled
                ? "dash-btn-secondary inline-flex items-center gap-1.5 text-xs"
                : "dash-btn-primary inline-flex items-center gap-1.5 text-xs"
            }
          >
            {loading === "COMPLETED" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Mark paid manually
          </button>
        ) : null}

        <button
          type="button"
          disabled={loading !== null}
          onClick={() => void patch({ status: "FAILED" })}
          className="dash-btn-secondary inline-flex items-center gap-1.5 text-xs text-red-400"
        >
          {loading === "FAILED" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Reject
        </button>

        {error ? <p className="w-full text-xs text-red-400">{error}</p> : null}
      </div>

      <ConfirmModal
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve cash-out?"
        description={`Send ${netAmount} to ${receiverLabel} via PawaPay. Confirm the receiver details match the campaign purpose before approving.`}
        confirmLabel="Approve & send"
        loading={loading === "approve_payout"}
        onConfirm={() => patch({ action: "approve_payout" })}
      />
    </>
  );
}
