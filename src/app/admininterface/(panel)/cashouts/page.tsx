import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { CashoutActions } from "@/components/admin/cashout-actions";
import { formatMoney } from "@/lib/utils/money";
import { isPawapayPayoutsEnabled } from "@/lib/payments/pawapay/config";

export default async function AdminCashoutsPage() {
  const pawapayEnabled = isPawapayPayoutsEnabled();
  const cashouts = await prisma.cashout.findMany({
    orderBy: { requestedAt: "desc" },
    include: {
      campaign: { select: { name: true, campaignCode: true, currency: true } },
      requestedBy: { select: { fullName: true, email: true, phoneNumber: true } },
    },
  });

  const pending = cashouts.filter((c) => ["PENDING", "PROCESSING"].includes(c.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--dash-ink)]">Cash-outs</h1>
        <p className="mt-1 text-sm text-[var(--dash-muted)]">
          {pending.length} awaiting your approval ·{" "}
          {pawapayEnabled
            ? "Review each request, then approve to send via PawaPay."
            : "Send MoMo manually, then mark paid."}
        </p>
      </div>

      <section className="dash-card hidden overflow-x-auto p-5 md:block">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--dash-border)] text-[var(--dash-muted)]">
              <th className="pb-3 pr-4 font-medium">Campaign</th>
              <th className="pb-3 pr-4 font-medium">Requested by</th>
              <th className="pb-3 pr-4 font-medium">Receiver</th>
              <th className="pb-3 pr-4 font-medium">Net amount</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 pr-4 font-medium">Requested</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cashouts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[var(--dash-muted)]">
                  No cash-out requests yet.
                </td>
              </tr>
            ) : (
              cashouts.map((c) => (
                <tr key={c.id} className="border-b border-[var(--dash-border)] last:border-0">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/c/${c.campaign.campaignCode}`}
                      target="_blank"
                      className="font-medium text-[var(--dash-ink)] hover:text-teal-400"
                    >
                      {c.campaign.name}
                    </Link>
                    <p className="text-xs text-[var(--dash-muted)]">{c.campaign.campaignCode}</p>
                  </td>
                  <td className="py-3 pr-4 text-[var(--dash-muted)]">
                    {c.requestedBy.fullName}
                    <span className="block text-xs">{c.requestedBy.phoneNumber}</span>
                  </td>
                  <td className="py-3 pr-4">
                    {c.payoutRecipientName ? (
                      <span className="font-medium text-[var(--dash-ink)]">
                        {c.payoutRecipientName}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--dash-muted)]">Not named</span>
                    )}
                    <span className="block font-medium text-[var(--dash-ink)]">{c.payoutPhone}</span>
                    <span className="block text-xs text-[var(--dash-muted)]">
                      {c.payoutMethod.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-emerald-400">
                      {formatMoney(c.netAmount, c.campaign.currency)}
                    </span>
                    <span className="block text-xs text-[var(--dash-muted)]">
                      Gross {formatMoney(c.amount, c.campaign.currency)} · fee{" "}
                      {formatMoney(c.platformFee, c.campaign.currency)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={
                        c.status === "COMPLETED"
                          ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400"
                          : c.status === "PENDING"
                            ? "rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400"
                            : "rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400"
                      }
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[var(--dash-muted)]">
                    {format(c.requestedAt, "MMM d, yyyy · h:mm a")}
                  </td>
                  <td className="py-3">
                    <CashoutActions
                      cashoutId={c.id}
                      status={c.status}
                      pawapayEnabled={pawapayEnabled}
                      payoutPhone={c.payoutPhone}
                      payoutRecipientName={c.payoutRecipientName}
                      netAmount={formatMoney(c.netAmount, c.campaign.currency)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="space-y-3 md:hidden">
        {cashouts.length === 0 ? (
          <div className="dash-card p-8 text-center text-[var(--dash-muted)]">
            No cash-out requests yet.
          </div>
        ) : (
          cashouts.map((c) => (
            <article key={c.id} className="dash-card space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/c/${c.campaign.campaignCode}`}
                    target="_blank"
                    className="font-medium text-[var(--dash-ink)] hover:text-teal-400"
                  >
                    {c.campaign.name}
                  </Link>
                  <p className="text-xs text-[var(--dash-muted)]">{c.campaign.campaignCode}</p>
                </div>
                <span
                  className={
                    c.status === "COMPLETED"
                      ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400"
                      : c.status === "PENDING"
                        ? "rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400"
                        : "rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400"
                  }
                >
                  {c.status}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-[var(--dash-muted)]">Requested by</dt>
                  <dd className="mt-0.5 font-medium text-[var(--dash-ink)]">{c.requestedBy.fullName}</dd>
                  <dd className="text-xs text-[var(--dash-muted)]">{c.requestedBy.phoneNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--dash-muted)]">Receiver</dt>
                  <dd className="mt-0.5 font-medium text-[var(--dash-ink)]">
                    {c.payoutRecipientName || "Not named"}
                  </dd>
                  <dd className="text-xs text-[var(--dash-muted)]">{c.payoutPhone}</dd>
                  <dd className="text-xs text-[var(--dash-muted)]">
                    {c.payoutMethod.replaceAll("_", " ")}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-[var(--dash-muted)]">Net amount</dt>
                  <dd className="mt-0.5 font-semibold text-emerald-400">
                    {formatMoney(c.netAmount, c.campaign.currency)}
                  </dd>
                  <dd className="text-xs text-[var(--dash-muted)]">
                    Gross {formatMoney(c.amount, c.campaign.currency)} · fee{" "}
                    {formatMoney(c.platformFee, c.campaign.currency)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-[var(--dash-muted)]">Requested</dt>
                  <dd className="mt-0.5 text-[var(--dash-muted)]">
                    {format(c.requestedAt, "MMM d, yyyy · h:mm a")}
                  </dd>
                </div>
              </dl>

              <div className="border-t border-[var(--dash-border)] pt-3">
                <CashoutActions
                  cashoutId={c.id}
                  status={c.status}
                  pawapayEnabled={pawapayEnabled}
                  payoutPhone={c.payoutPhone}
                  payoutRecipientName={c.payoutRecipientName}
                  netAmount={formatMoney(c.netAmount, c.campaign.currency)}
                />
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
