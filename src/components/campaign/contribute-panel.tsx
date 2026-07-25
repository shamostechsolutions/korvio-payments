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
};

function storageKey(code: string) {
  return `korvio:contributor:${code.toUpperCase()}`;
}

export function CampaignContributePanel({
  campaignCode,
  currency,
  allowPledges,
  minimumPledgeAmount,
  organiserName,
  organiserPhone,
}: Props) {
  const [stored, setStored] = useState<StoredContributor | null>(null);
  const [contributor, setContributor] = useState<ContributorSummary | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pledgeAmount, setPledgeAmount] = useState("");
  const [payAmount, setPayAmount] = useState("");
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
    if (data.joined) {
      setContributor(data.contributor);
    }
  }

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
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
      setMessage("You have joined this campaign.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to join");
    } finally {
      setLoading(false);
    }
  }

  async function handlePledge(event: React.FormEvent) {
    event.preventDefault();
    if (!stored) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/public/campaigns/${campaignCode}/pledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: stored.phoneNumber, amount: pledgeAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to pledge");
      setContributor(data.contributor);
      setPledgeAmount("");
      setMessage("Pledge recorded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to pledge");
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(event: React.FormEvent) {
    event.preventDefault();
    if (!stored) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/public/campaigns/${campaignCode}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: stored.phoneNumber, amount: payAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to pay");

      if (data.type === "checkout" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.type === "direct") {
        setMessage(
          `Pay ${data.amount.toLocaleString()} ${currency} directly to ${data.treasurerName} (${data.treasurerPhone}). The treasurer will record your payment.`,
        );
        setPayAmount("");
        return;
      }

      throw new Error("Unexpected payment response");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to pay");
    } finally {
      setLoading(false);
    }
  }

  function handleSwitchAccount() {
    localStorage.removeItem(storageKey(campaignCode));
    setStored(null);
    setContributor(null);
    setDisplayName("");
    setPhoneNumber("");
    setMessage(null);
    setError(null);
  }

  if (!stored) {
    return (
      <section className="surface rounded-3xl p-6 md:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--brand)]">
          Contribute
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Join this campaign to pledge or pay online. Your amount stays private.
        </p>
        <form onSubmit={handleJoin} className="mt-6 space-y-4">
          <div>
            <Label>Your name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Moses Etuku"
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
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? "Joining..." : "Join campaign"}
          </Button>
        </form>
      </section>
    );
  }

  return (
    <section className="surface rounded-3xl p-6 md:p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--brand)]">
            Your contribution
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            {stored.displayName} · {stored.phoneNumber}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSwitchAccount}
          className="text-xs font-semibold text-[var(--brand)]"
        >
          Switch
        </button>
      </div>

      {contributor ? (
        <div className="mt-4 grid gap-2 rounded-2xl bg-[var(--accent-soft)]/40 p-4 text-sm">
          <p>
            Status:{" "}
            <span className="font-semibold">
              {publicStatusLabel(contributor.status as never)}
            </span>
          </p>
          <p>Pledged: {contributor.pledged}</p>
          <p>Paid: {contributor.paid}</p>
          <p>Outstanding: {contributor.outstanding}</p>
        </div>
      ) : null}

      {message ? <p className="mt-4 text-sm text-[var(--brand)]">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}

      {allowPledges ? (
        <form onSubmit={handlePledge} className="mt-6 space-y-3 border-t border-[var(--line)] pt-6">
          <h3 className="font-semibold text-[var(--ink)]">Make a pledge</h3>
          <div>
            <Label>Amount ({currency})</Label>
            <Input
              value={pledgeAmount}
              onChange={(e) => setPledgeAmount(e.target.value)}
              placeholder={minimumPledgeAmount ? `Min ${minimumPledgeAmount}` : "e.g. 50000 or 50k"}
              required
            />
          </div>
          <Button type="submit" variant="secondary" disabled={loading} className="w-full">
            Record pledge
          </Button>
        </form>
      ) : null}

      <form onSubmit={handlePay} className="mt-6 space-y-3 border-t border-[var(--line)] pt-6">
        <h3 className="font-semibold text-[var(--ink)]">Pay now</h3>
        <p className="text-sm text-[var(--ink-soft)]">
          Pay online via Flutterwave, or follow treasurer instructions if direct payment is enabled.
        </p>
        <div>
          <Label>Amount ({currency})</Label>
          <Input
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            placeholder="e.g. 50000 or 50k"
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? "Starting payment..." : "Pay now"}
        </Button>
      </form>

      <p className="mt-4 text-xs text-[var(--ink-soft)]">
        Treasurer: {organiserName} · {organiserPhone}
      </p>
    </section>
  );
}
