"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  PLATFORM_FEE_PERCENT_LABEL,
  calculateCashoutNet,
} from "@/lib/payments/fees";
import { formatMoney } from "@/lib/utils/money";

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
  availableBalance: number;
  initialCashouts: Cashout[];
  canRequestCashout: boolean;
};

export function CampaignWalletPanel({
  campaignId,
  currency,
  organiserPhone,
  campaignStatus,
  availableBalance,
  initialCashouts,
  canRequestCashout,
}: Props) {
  const [payoutPhone, setPayoutPhone] = useState(organiserPhone);
  const [cashouts, setCashouts] = useState(initialCashouts);
  const [balance, setBalance] = useState(availableBalance);
  const [canRequest, setCanRequest] = useState(canRequestCashout);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const preview = calculateCashoutNet(balance);

  async function requestCashout() {
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch(`/api/campaigns/${campaignId}/cashouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutPhone, payoutMethod: "MTN_MOMO" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Unable to request cash-out");
      return;
    }
    setCashouts((prev) => [data.cashout, ...prev]);
    setBalance(0);
    setCanRequest(false);
    setMessage(
      `Cash-out requested. ${formatMoney(data.cashout.netAmount, currency)} will be sent to ${data.cashout.payoutPhone} after we process it.`,
    );
  }

  const needsClose = !["COMPLETED", "CLOSED"].includes(campaignStatus);

  return (
    <div className="space-y-6">
      <section className="surface rounded-3xl p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-700 text-[var(--brand)]">
          Campaign wallet
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Contributions land here as people pay. When the campaign is closed, request a cash-out to
          your mobile money. Korvio takes a {PLATFORM_FEE_PERCENT_LABEL} service fee at cash-out —
          contributors never pay extra at checkout.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
              In wallet
            </p>
            <p className="mt-2 text-2xl font-bold text-[var(--brand)]">
              {formatMoney(balance, currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
              Korvio fee ({PLATFORM_FEE_PERCENT_LABEL})
            </p>
            <p className="mt-2 text-2xl font-bold text-[var(--ink)]">
              {formatMoney(preview.platformFee, currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
              You receive
            </p>
            <p className="mt-2 text-2xl font-bold text-[var(--success)]">
              {formatMoney(preview.netAmount, currency)}
            </p>
          </div>
        </div>

        {needsClose ? (
          <p className="mt-4 rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--ink-soft)]">
            Mark the campaign as <strong>completed</strong> or <strong>closed</strong> before you
            can cash out.
          </p>
        ) : null}

        {canRequest && balance > 0 ? (
          <div className="mt-6 space-y-4 border-t border-[var(--line)] pt-6">
            <div>
              <Label>Payout mobile money number</Label>
              <Input
                value={payoutPhone}
                onChange={(e) => setPayoutPhone(e.target.value)}
                placeholder="256700000000"
              />
            </div>
            <Button type="button" onClick={() => void requestCashout()} disabled={loading}>
              Request cash-out
            </Button>
          </div>
        ) : null}

        {message ? <p className="mt-4 text-sm text-[var(--success)]">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      </section>

      {cashouts.length ? (
        <section className="surface rounded-3xl p-6">
          <h3 className="font-semibold text-[var(--ink)]">Cash-out history</h3>
          <ul className="mt-4 divide-y divide-[var(--line)]">
            {cashouts.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-[var(--ink)]">
                    {formatMoney(c.netAmount, currency)} to {c.payoutPhone}
                  </p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {new Date(c.requestedAt).toLocaleString()} · Fee{" "}
                    {formatMoney(c.platformFee, currency)}
                  </p>
                </div>
                <span className="badge">{c.status.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
