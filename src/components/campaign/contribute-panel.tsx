"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { publicStatusLabel } from "@/lib/status";

type ContributorSummary = {
  id: string;
  displayName: string;
  phoneNumber: string;
  status: string;
  pledged: string;
  paid: string;
  outstanding: string;
};

type StoredContributor = {
  displayName: string;
  phoneNumber: string;
};

type Props = {
  campaignCode: string;
  currency: string;
  allowPledges: boolean;
  minimumPledgeAmount?: number | null;
  organiserName: string;
  organiserPhone: string;
  compact?: boolean;
};

const QUICK_AMOUNTS = [20000, 50000, 100000, 200000];

function storageKey(code: string) {
  return `korvio:contributor:${code.toUpperCase()}`;
}

function formatQuickAmount(amount: number) {
  if (amount >= 1000000) return `${amount / 1000000}M`;
  if (amount >= 1000) return `${amount / 1000}k`;
  return String(amount);
}

export function CampaignContributePanel({
  campaignCode,
  currency,
  allowPledges,
  minimumPledgeAmount,
  organiserName,
  organiserPhone,
  compact = false,
}: Props) {
  const [mode, setMode] = useState<"pay" | "pledge">("pay");
  const [stored, setStored] = useState<StoredContributor | null>(null);
  const [contributor, setContributor] = useState<ContributorSummary | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey(campaignCode));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as StoredContributor;
      setStored(parsed);
      setDisplayName(parsed.displayName);
      setPhoneNumber(parsed.phoneNumber);
      void loadStatus(parsed.phoneNumber);
    } catch {
      localStorage.removeItem(storageKey(campaignCode));
    }
  }, [campaignCode]);

  async function loadStatus(phone: string) {
    const res = await fetch(
      `/api/public/campaigns/${campaignCode}/status?phone=${encodeURIComponent(phone)}`,
    );
    const data = await res.json();
    if (data.joined) setContributor(data.contributor);
  }

  async function ensureJoined() {
    if (stored) return stored.phoneNumber;
    const res = await fetch(`/api/public/campaigns/${campaignCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, phoneNumber }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to join");
    const saved = { displayName, phoneNumber: data.contributor.phoneNumber };
    localStorage.setItem(storageKey(campaignCode), JSON.stringify(saved));
    setStored(saved);
    setContributor(data.contributor);
    return saved.phoneNumber as string;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const phone = await ensureJoined();
      const endpoint = mode === "pay" ? "pay" : "pledge";
      const res = await fetch(`/api/public/campaigns/${campaignCode}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to complete");

      if (mode === "pay" && data.type === "checkout" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (mode === "pay" && data.type === "direct") {
        setMessage(
          `Send ${data.amount.toLocaleString()} ${currency} to ${data.treasurerName} · ${data.treasurerPhone}`,
        );
      } else {
        setContributor(data.contributor);
        setMessage(mode === "pay" ? "Payment started." : "Pledge recorded. Thank you!");
      }
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleSwitchAccount() {
    localStorage.removeItem(storageKey(campaignCode));
    setStored(null);
    setContributor(null);
    setMessage(null);
    setError(null);
  }

  return (
    <div className={`card ${compact ? "p-5" : "p-6 md:p-7"} lg:sticky lg:top-24`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--ink)]">Contribute</h2>
        {stored ? (
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="text-xs font-medium text-[var(--brand)]"
          >
            Switch
          </button>
        ) : null}
      </div>

      {allowPledges ? (
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-[var(--bg)] p-1">
          <button
            type="button"
            onClick={() => setMode("pay")}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              mode === "pay"
                ? "bg-white text-[var(--brand)] shadow-sm"
                : "text-[var(--ink-soft)]"
            }`}
          >
            Pay now
          </button>
          <button
            type="button"
            onClick={() => setMode("pledge")}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              mode === "pledge"
                ? "bg-white text-[var(--brand)] shadow-sm"
                : "text-[var(--ink-soft)]"
            }`}
          >
            Pledge
          </button>
        </div>
      ) : null}

      {contributor ? (
        <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm">
          <p className="font-medium text-[var(--ink)]">{stored?.displayName}</p>
          <p className="mt-1 text-[var(--ink-soft)]">
            {publicStatusLabel(contributor.status as never)} · Paid {contributor.paid}
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {!stored ? (
          <>
            <div>
              <Label>Your name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <Label>Phone number</Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="256700000000"
                required
              />
            </div>
          </>
        ) : null}

        <div>
          <Label>Amount ({currency})</Label>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={
              minimumPledgeAmount && mode === "pledge"
                ? `Min ${minimumPledgeAmount.toLocaleString()}`
                : "e.g. 50000 or 50k"
            }
            className="text-lg font-semibold"
            required
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(String(value))}
              className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink-soft)] transition hover:border-[var(--brand-soft)] hover:text-[var(--brand)]"
            >
              {formatQuickAmount(value)}
            </button>
          ))}
        </div>

        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading
            ? "Please wait..."
            : mode === "pay"
              ? "Contribute now"
              : "Record pledge"}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs leading-relaxed text-[var(--ink-soft)]">
        Secure payment via Flutterwave · MTN & Airtel supported
        <br />
        Organiser: {organiserName}
      </p>
    </div>
  );
}
