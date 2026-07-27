"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { ExternalLink, Eye, Loader2, X } from "lucide-react";
import { categoryLabel } from "@/lib/campaigns/labels";
import { fundraisingModeLabel, isOpenFundraising } from "@/lib/campaigns/fundraising";
import { formatMoney } from "@/lib/utils/money";
import type { CampaignCategory, FundraisingMode } from "@prisma/client";

type CampaignDetails = {
  id: string;
  campaignCode: string;
  name: string;
  category: CampaignCategory;
  description: string;
  currency: string;
  fundraisingMode: FundraisingMode;
  targetAmount: number;
  totalPledged: number;
  totalReceived: number;
  totalExpenses: number;
  totalFees: number;
  availableBalance: number;
  startDate: string;
  deadline: string;
  status: string;
  imageUrl: string | null;
  isVerified: boolean;
  organiserName: string;
  organiserPhone: string;
  beneficiaryName: string | null;
  contactPerson: string | null;
  allowPledges: boolean;
  allowPartialPayments: boolean;
  allowAnonymous: boolean;
  allowInKind: boolean;
  contributorListVisibility: string;
  contributionAmountVisibility: string;
  createdAt: string;
  updatedAt: string;
  deletionRequestedAt: string | null;
  owner: {
    id: string;
    fullName: string;
    email: string | null;
    phoneNumber: string;
    createdAt: string;
  };
  deletionRequestedBy: {
    fullName: string;
    email: string | null;
  } | null;
  _count: {
    contributors: number;
    payments: number;
    expenses: number;
    cashouts: number;
    reminders: number;
    publicUpdates: number;
  };
  payments: Array<{
    id: string;
    amount: number;
    completedAt: string | null;
    contributor: { displayName: string };
  }>;
  cashouts: Array<{
    id: string;
    amount: number;
    status: string;
    requestedAt: string;
    payoutRecipientName: string | null;
  }>;
};

function statusLabel(status: string) {
  if (status === "DRAFT") return "Pending approval";
  return status.replaceAll("_", " ");
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--dash-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[var(--dash-ink)]">{value}</dd>
    </div>
  );
}

function CampaignDetailsContent({
  campaign,
  publicUrl,
}: {
  campaign: CampaignDetails;
  publicUrl: string;
}) {
  const openMode = isOpenFundraising(campaign);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-400">
          {statusLabel(campaign.status)}
        </span>
        <span className="rounded-full bg-[var(--dash-bg)] px-2.5 py-1 text-xs font-medium text-[var(--dash-muted)]">
          {categoryLabel(campaign.category)}
        </span>
        <span className="rounded-full bg-[var(--dash-bg)] px-2.5 py-1 text-xs font-medium text-[var(--dash-muted)]">
          {fundraisingModeLabel(campaign.fundraisingMode)}
        </span>
        {campaign.isVerified ? (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            Verified
          </span>
        ) : null}
        {campaign.deletionRequestedAt ? (
          <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400">
            Deletion requested
          </span>
        ) : null}
      </div>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
          Story
        </h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--dash-ink)]">
          {campaign.description}
        </p>
      </section>

      {campaign.imageUrl ? (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
            Cover image
          </h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={campaign.imageUrl}
            alt=""
            className="mt-2 max-h-48 w-full rounded-xl border border-[var(--dash-border)] object-cover"
          />
        </section>
      ) : null}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
          Campaign
        </h3>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          <Detail label="Code" value={campaign.campaignCode} />
          <Detail label="Currency" value={campaign.currency} />
          <Detail label="Start date" value={format(new Date(campaign.startDate), "MMM d, yyyy")} />
          <Detail label="Deadline" value={format(new Date(campaign.deadline), "MMM d, yyyy")} />
          <Detail label="Created" value={format(new Date(campaign.createdAt), "MMM d, yyyy · h:mm a")} />
          <Detail label="Last updated" value={format(new Date(campaign.updatedAt), "MMM d, yyyy · h:mm a")} />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
          Organiser
        </h3>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          <Detail label="Name" value={campaign.organiserName} />
          <Detail label="Phone" value={campaign.organiserPhone} />
          <Detail label="Beneficiary" value={campaign.beneficiaryName || "—"} />
          <Detail label="Contact person" value={campaign.contactPerson || "—"} />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
          Account owner
        </h3>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          <Detail label="Name" value={campaign.owner.fullName} />
          <Detail label="Email" value={campaign.owner.email || "—"} />
          <Detail label="Phone" value={campaign.owner.phoneNumber} />
          <Detail
            label="Joined Korvio"
            value={format(new Date(campaign.owner.createdAt), "MMM d, yyyy")}
          />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
          Finances
        </h3>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!openMode ? (
            <Detail
              label="Target"
              value={formatMoney(campaign.targetAmount, campaign.currency)}
            />
          ) : null}
          <Detail
            label="Received"
            value={
              <span className="font-semibold text-emerald-400">
                {formatMoney(campaign.totalReceived, campaign.currency)}
              </span>
            }
          />
          <Detail
            label="Pledged"
            value={formatMoney(campaign.totalPledged, campaign.currency)}
          />
          <Detail
            label="Wallet balance"
            value={formatMoney(campaign.availableBalance, campaign.currency)}
          />
          <Detail
            label="Expenses"
            value={formatMoney(campaign.totalExpenses, campaign.currency)}
          />
          <Detail label="Fees" value={formatMoney(campaign.totalFees, campaign.currency)} />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
          Activity
        </h3>
        <dl className="mt-3 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Detail label="Contributors" value={campaign._count.contributors} />
          <Detail label="Payments" value={campaign._count.payments} />
          <Detail label="Expenses" value={campaign._count.expenses} />
          <Detail label="Cash-outs" value={campaign._count.cashouts} />
          <Detail label="Reminders" value={campaign._count.reminders} />
          <Detail label="Updates" value={campaign._count.publicUpdates} />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
          Settings
        </h3>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          <Detail label="Pledges" value={campaign.allowPledges ? "Allowed" : "Off"} />
          <Detail label="Partial payments" value={campaign.allowPartialPayments ? "Allowed" : "Off"} />
          <Detail label="Anonymous" value={campaign.allowAnonymous ? "Allowed" : "Off"} />
          <Detail label="In-kind" value={campaign.allowInKind ? "Allowed" : "Off"} />
          <Detail
            label="Contributor list"
            value={campaign.contributorListVisibility.replaceAll("_", " ").toLowerCase()}
          />
          <Detail
            label="Amount visibility"
            value={campaign.contributionAmountVisibility.replaceAll("_", " ").toLowerCase()}
          />
        </dl>
      </section>

      {campaign.deletionRequestedAt ? (
        <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <h3 className="text-sm font-semibold text-red-400">Deletion request</h3>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">
            Requested {format(new Date(campaign.deletionRequestedAt), "MMM d, yyyy · h:mm a")}
            {campaign.deletionRequestedBy
              ? ` by ${campaign.deletionRequestedBy.fullName}${campaign.deletionRequestedBy.email ? ` (${campaign.deletionRequestedBy.email})` : ""}`
              : ""}
            .
          </p>
        </section>
      ) : null}

      {campaign.payments.length ? (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
            Recent payments
          </h3>
          <ul className="mt-3 space-y-2">
            {campaign.payments.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-[var(--dash-bg)] px-3 py-2 text-sm"
              >
                <span className="text-[var(--dash-ink)]">{payment.contributor.displayName}</span>
                <span className="font-semibold text-emerald-400">
                  {formatMoney(payment.amount, campaign.currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {campaign.cashouts.length ? (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
            Recent cash-outs
          </h3>
          <ul className="mt-3 space-y-2">
            {campaign.cashouts.map((cashout) => (
              <li
                key={cashout.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-[var(--dash-bg)] px-3 py-2 text-sm"
              >
                <span className="text-[var(--dash-muted)]">
                  {cashout.payoutRecipientName || "Organiser"} · {cashout.status}
                </span>
                <span className="font-medium text-[var(--dash-ink)]">
                  {formatMoney(cashout.amount, campaign.currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {campaign.status === "ACTIVE" ? (
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="dash-btn-secondary inline-flex w-full justify-center sm:w-auto"
        >
          <ExternalLink className="h-4 w-4" />
          Open public page
        </a>
      ) : null}
    </div>
  );
}

export function CampaignDetailsButton({
  campaignId,
  campaignName,
  variant = "button",
}: {
  campaignId: string;
  campaignName: string;
  variant?: "button" | "link";
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<{ campaign: CampaignDetails; publicUrl: string } | null>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, loading]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    void fetch(`/api/admininterface/campaigns/${campaignId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Unable to load campaign");
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load campaign");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, campaignId]);

  const trigger =
    variant === "link" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left font-medium text-[var(--dash-ink)] hover:text-teal-400"
      >
        {campaignName}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="dash-btn-secondary inline-flex items-center gap-1.5 text-xs"
      >
        <Eye className="h-3.5 w-3.5" />
        View details
      </button>
    );

  return (
    <>
      {trigger}

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <button
                type="button"
                aria-label="Close dialog"
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                disabled={loading}
                onClick={() => setOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="campaign-details-title"
                className="relative z-10 flex max-h-[min(90vh,820px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] shadow-2xl"
              >
                <div className="flex items-start justify-between gap-4 border-b border-[var(--dash-border)] px-6 py-4">
                  <div className="min-w-0">
                    <h2
                      id="campaign-details-title"
                      className="truncate text-lg font-semibold text-[var(--dash-ink)]"
                    >
                      {campaignName}
                    </h2>
                    {data?.campaign ? (
                      <p className="mt-1 text-sm text-[var(--dash-muted)]">
                        {data.campaign.campaignCode}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label="Close"
                    className="rounded-lg p-2 text-[var(--dash-muted)] transition hover:bg-[var(--dash-bg)] hover:text-[var(--dash-ink)]"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {loading ? (
                    <div className="flex items-center justify-center py-16 text-[var(--dash-muted)]">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : error ? (
                    <p className="py-8 text-center text-sm text-red-400">{error}</p>
                  ) : data ? (
                    <CampaignDetailsContent campaign={data.campaign} publicUrl={data.publicUrl} />
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
