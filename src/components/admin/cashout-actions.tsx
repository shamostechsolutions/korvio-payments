"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CashoutActions({
  cashoutId,
  status,
}: {
  cashoutId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(nextStatus: string) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admininterface/cashouts/${cashoutId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Unable to update cash-out");
      return;
    }
    router.refresh();
  }

  if (["COMPLETED", "FAILED", "CANCELLED"].includes(status)) {
    return <span className="text-xs text-[var(--dash-muted)]">Finalized</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "PENDING" ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void updateStatus("PROCESSING")}
          className="dash-btn-secondary text-xs"
        >
          Mark processing
        </button>
      ) : null}
      <button
        type="button"
        disabled={loading}
        onClick={() => void updateStatus("COMPLETED")}
        className="dash-btn-primary text-xs"
      >
        Mark paid
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => void updateStatus("FAILED")}
        className="dash-btn-secondary text-xs text-red-400"
      >
        Failed
      </button>
      {error ? <p className="w-full text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
