"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function CashoutActions({
  cashoutId,
  status,
  automatedPayoutAvailable,
  manualPayoutAvailable,
  payoutPhone,
  payoutRecipientName,
  netAmount,
}: {
  cashoutId: string;
  status: string;
  automatedPayoutAvailable: boolean;
  manualPayoutAvailable: boolean;
  payoutPhone: string;
  payoutRecipientName: string | null;
  netAmount: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

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
    setManualOpen(false);
    router.refresh();
  }

  if (["COMPLETED", "FAILED", "CANCELLED"].includes(status)) {
    return <span className="text-xs text-[var(--dash-muted)]">Finalized</span>;
  }

  const receiverLabel = payoutRecipientName
    ? `${payoutRecipientName} (${payoutPhone})`
    : payoutPhone;

  const showAutomated = status === "PENDING" && automatedPayoutAvailable;
  const showManual =
    manualPayoutAvailable && (status === "PENDING" || status === "PROCESSING");

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {showAutomated ? (
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => setApproveOpen(true)}
              className="dash-btn-primary inline-flex items-center gap-1.5 text-xs"
            >
              {loading === "approve_payout" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : null}
              Send via PawaPay
            </button>
          ) : null}

          {showManual ? (
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => setManualOpen(true)}
              className={
                showAutomated
                  ? "dash-btn-secondary inline-flex items-center gap-1.5 text-xs"
                  : "dash-btn-primary inline-flex items-center gap-1.5 text-xs"
              }
            >
              {loading === "complete_manual" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : null}
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
        </div>

        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>

      <ConfirmModal
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Send via PawaPay?"
        description={`Send ${netAmount} to ${receiverLabel} automatically through PawaPay. Confirm the receiver details before continuing.`}
        confirmLabel="Send via PawaPay"
        loading={loading === "approve_payout"}
        onConfirm={() => patch({ action: "approve_payout" })}
      />

      <ConfirmModal
        open={manualOpen}
        onOpenChange={setManualOpen}
        title="Mark as paid manually?"
        description={`Confirm you have already sent ${netAmount} to ${receiverLabel} from your own MoMo. Korvio will not call PawaPay for this cash-out.`}
        confirmLabel="Yes, paid manually"
        loading={loading === "complete_manual"}
        onConfirm={() =>
          patch({
            action: "complete_manual",
            notes: "Paid manually by Korvio platform admin",
          })
        }
      />
    </>
  );
}
