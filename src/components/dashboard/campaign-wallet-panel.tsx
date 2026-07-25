"use client";

import { useMemo, useState } from "react";
import { Input, Label, Select } from "@/components/ui/input";
import {
  PLATFORM_FEE_PERCENT_LABEL,
  calculateCashoutNet,
} from "@/lib/payments/fees";
import { formatMoney } from "@/lib/utils/money";
import { DashBadge, DashCard, DashMessage } from "@/components/dashboard/dash-page";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { canCloseCampaign } from "@/lib/campaigns/cashout-rules";

type Cashout = {
  id: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  payoutPhone: string;
  status: string;
  requestedAt: string;
  processedAt: string | null;
};

type Props = {
  campaignId: string;
  currency: string;
  organiserPhone: string;
  campaignStatus: string;
  fundraisingMode: "GOAL" | "OPEN";
  availableBalance: number;
  minCashoutAmount: number;
  initialCashouts: Cashout[];
  canRequestCashout: boolean;
  canCloseCampaign: boolean;
};

function cashoutStatusLabel(status: string) {
  if (status === "COMPLETED") return "Paid";
  if (status === "PROCESSING") return "Processing";
  if (status === "PENDING") return "Pending";
  if (status === "FAILED") return "Failed";
  return status.toLowerCase();
}

export function CampaignWalletPanel({
  campaignId,
  currency,
  organiserPhone,
  campaignStatus,
  fundraisingMode,
  availableBalance,
  minCashoutAmount,
  initialCashouts,
  canRequestCashout,
  canCloseCampaign: canClose,
}: Props) {
  const [payoutPhone, setPayoutPhone] = useState(organiserPhone);
  const [payoutMethod, setPayoutMethod] = useState<"MTN_MOMO" | "AIRTEL_MONEY">("MTN_MOMO");
  const [cashoutAmount, setCashoutAmount] = useState(String(availableBalance));
  const [cashouts, setCashouts] = useState(initialCashouts);
  const [balance, setBalance] = useState(availableBalance);
  const [status, setStatus] = useState(campaignStatus);
  const [canRequest, setCanRequest] = useState(canRequestCashout);
  const [showClose, setShowClose] = useState(canClose);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [cashoutModalOpen, setCashoutModalOpen] = useState(false);
  const [closeNote, setCloseNote] = useState("");
  const [loading, setLoading] = useState<"close" | "cashout" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const parsedAmount = useMemo(() => {
    const value = Number(cashoutAmount.replace(/,/g, ""));
    return Number.isFinite(value) ? Math.round(value) : 0;
  }, [cashoutAmount]);

  const preview = useMemo(
    () => calculateCashoutNet(parsedAmount > 0 ? parsedAmount : 0),
    [parsedAmount],
  );

  const isClosed = ["COMPLETED", "CLOSED"].includes(status);
  const openMode = fundraisingMode === "OPEN";

  async function closeCampaign() {
    setLoading("close");
    setError("");
    const res = await fetch(`/api/campaigns/${campaignId}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: closeNote.trim() || undefined }),
    });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) {
      setError(data.error || "Unable to close campaign");
      return;
    }
    setStatus(data.campaign.status);
    setShowClose(false);
    setCloseModalOpen(false);
    setMessage(
      data.campaign.status === "COMPLETED"
        ? "Campaign completed — fundraising is closed and a public update was posted."
        : "Campaign closed — no new contributions will be accepted.",
    );
  }

  async function requestCashout() {
    setLoading("cashout");
    setError("");
    const res = await fetch(`/api/campaigns/${campaignId}/cashouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payoutPhone,
        payoutMethod,
        amount: parsedAmount,
      }),
    });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) {
      setError(data.error || "Unable to request cash-out");
      return;
    }
    setCashouts((prev) => [data.cashout, ...prev]);
    const newBalance = Math.max(0, balance - data.cashout.amount);
    setBalance(newBalance);
    setCashoutAmount(String(newBalance));
    setCanRequest(newBalance >= minCashoutAmount);
    setCashoutModalOpen(false);
    setMessage(
      `Cash-out requested. ${formatMoney(data.cashout.netAmount, currency)} will be sent to ${data.cashout.payoutPhone} after Korvio processes it (usually within 1 business day).`,
    );
  }

  return (
    <div className="space-y-6">
      <DashCard>
        <p className="text-sm text-[var(--dash-muted)]">
          {openMode
            ? "Open contributions stay live until you close the campaign. You can withdraw in parts as money comes in."
            : "You can withdraw in parts while fundraising is active, or close the campaign when you are done."}{" "}
          Korvio takes a {PLATFORM_FEE_PERCENT_LABEL} service fee at cash-out — contributors never
          pay extra at checkout. Every completed withdrawal appears on your public campaign page.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
              In wallet
            </p>
            <p className="mt-2 text-2xl font-bold text-teal-400">
              {formatMoney(balance, currency)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
              Korvio fee ({PLATFORM_FEE_PERCENT_LABEL})
            </p>
            <p className="mt-2 text-2xl font-bold text-[var(--dash-ink)]">
              {formatMoney(preview.platformFee, currency)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
              You receive
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">
              {formatMoney(preview.netAmount, currency)}
            </p>
          </div>
        </div>

        {isClosed ? (
          <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            Campaign is {status === "COMPLETED" ? "complete" : "closed"}. New contributions are
            stopped.
          </p>
        ) : null}

        {showClose && canCloseCampaign(status) ? (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-4">
            <p className="text-sm font-medium text-amber-400">Ready to stop fundraising?</p>
            <p className="mt-1 text-sm text-[var(--dash-muted)]">
              Closing posts a public update and hides the contribute button. You can still cash out
              any remaining balance.
            </p>
            <div className="mt-3">
              <Label>Optional note for supporters</Label>
              <textarea
                rows={2}
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="Thank you everyone — we reached our goal!"
                className="mt-1 w-full rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-2 text-sm text-[var(--dash-ink)]"
              />
            </div>
            <button
              type="button"
              className="dash-btn-secondary mt-3 text-sm"
              onClick={() => setCloseModalOpen(true)}
            >
              Close campaign
            </button>
          </div>
        ) : null}

        {canRequest && balance >= minCashoutAmount ? (
          <div className="mt-6 space-y-4 border-t border-[var(--dash-border)] pt-6">
            <div>
              <Label>Amount to withdraw</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  inputMode="numeric"
                  value={cashoutAmount}
                  onChange={(e) => setCashoutAmount(e.target.value)}
                />
                <button
                  type="button"
                  className="dash-btn-secondary shrink-0 text-sm"
                  onClick={() => setCashoutAmount(String(balance))}
                >
                  Max
                </button>
              </div>
              <p className="mt-1 text-xs text-[var(--dash-muted)]">
                Minimum {formatMoney(minCashoutAmount, currency)} · Remaining after request:{" "}
                {formatMoney(Math.max(0, balance - parsedAmount), currency)}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Payout mobile money number</Label>
                <Input
                  value={payoutPhone}
                  onChange={(e) => setPayoutPhone(e.target.value)}
                  placeholder="256700000000"
                />
              </div>
              <div>
                <Label>Network</Label>
                <Select
                  value={payoutMethod}
                  onChange={(e) =>
                    setPayoutMethod(e.target.value as "MTN_MOMO" | "AIRTEL_MONEY")
                  }
                >
                  <option value="MTN_MOMO">MTN MoMo</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                </Select>
              </div>
            </div>
            <button
              type="button"
              className="dash-btn-primary inline-flex items-center gap-2"
              onClick={() => setCashoutModalOpen(true)}
              disabled={parsedAmount < minCashoutAmount || parsedAmount > balance}
            >
              Request cash-out
            </button>
          </div>
        ) : balance > 0 && balance < minCashoutAmount ? (
          <p className="mt-4 text-sm text-[var(--dash-muted)]">
            Minimum cash-out is {formatMoney(minCashoutAmount, currency)}. Keep collecting until
            your wallet reaches that amount.
          </p>
        ) : null}

        {message ? (
          <div className="mt-4">
            <DashMessage type="success">{message}</DashMessage>
          </div>
        ) : null}
        {error ? (
          <div className="mt-4">
            <DashMessage type="error">{error}</DashMessage>
          </div>
        ) : null}
      </DashCard>

      {cashouts.length ? (
        <DashCard>
          <h3 className="font-semibold text-[var(--dash-ink)]">Cash-out history</h3>
          <ul className="mt-4 divide-y divide-[var(--dash-border)]">
            {cashouts.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-[var(--dash-ink)]">
                    {formatMoney(c.netAmount, currency)} to {c.payoutPhone}
                  </p>
                  <p className="text-xs text-[var(--dash-muted)]">
                    {new Date(c.requestedAt).toLocaleString()} · Gross{" "}
                    {formatMoney(c.amount, currency)} · Fee{" "}
                    {formatMoney(c.platformFee, currency)}
                  </p>
                </div>
                <DashBadge>{cashoutStatusLabel(c.status)}</DashBadge>
              </li>
            ))}
          </ul>
        </DashCard>
      ) : null}

      <ConfirmModal
        open={closeModalOpen}
        onOpenChange={setCloseModalOpen}
        title="Close this campaign?"
        description="Fundraising will stop and a public update will be posted. You can still withdraw any money left in the wallet."
        confirmLabel="Close campaign"
        variant="danger"
        loading={loading === "close"}
        onConfirm={closeCampaign}
      />

      <ConfirmModal
        open={cashoutModalOpen}
        onOpenChange={setCashoutModalOpen}
        title="Confirm cash-out"
        description={`Withdraw ${formatMoney(parsedAmount, currency)} from the campaign wallet. You will receive ${formatMoney(preview.netAmount, currency)} on ${payoutPhone} after the ${PLATFORM_FEE_PERCENT_LABEL} Korvio fee. This cannot be undone once processing starts.`}
        confirmLabel="Request cash-out"
        loading={loading === "cashout"}
        onConfirm={requestCashout}
      />
    </div>
  );
}
