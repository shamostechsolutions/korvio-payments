import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { CashoutActions } from "@/components/admin/cashout-actions";
import { formatMoney } from "@/lib/utils/money";

export default async function AdminCashoutsPage() {
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
          {pending.length} awaiting payout · send MoMo manually then mark paid.
        </p>
      </div>

      <section className="dash-card overflow-x-auto p-5">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--dash-border)] text-[var(--dash-muted)]">
              <th className="pb-3 pr-4 font-medium">Campaign</th>
              <th className="pb-3 pr-4 font-medium">Requested by</th>
              <th className="pb-3 pr-4 font-medium">Payout</th>
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
                    <span className="font-medium text-[var(--dash-ink)]">{c.payoutPhone}</span>
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
                    <CashoutActions cashoutId={c.id} status={c.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
