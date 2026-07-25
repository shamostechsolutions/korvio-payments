import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeftRight, FolderKanban, TrendingUp, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { DashStatCard } from "@/components/dashboard/dash-stat-card";
import { formatMoney } from "@/lib/utils/money";

export default async function AdminOverviewPage() {
  const [campaignCount, userCount, paymentAgg, pendingCashouts, pendingCampaigns, recentCampaigns] =
    await Promise.all([
      prisma.campaign.count({ where: { status: { not: "CANCELLED" } } }),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.payment.aggregate({
        where: { paymentStatus: "SUCCESSFUL" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.cashout.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
      prisma.campaign.count({ where: { status: "DRAFT" } }),
      prisma.campaign.findMany({
        where: { status: { not: "CANCELLED" } },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { owner: { select: { fullName: true, email: true } } },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--dash-ink)] md:text-3xl">
          Platform overview
        </h1>
        <p className="mt-1 text-sm text-[var(--dash-muted)]">
          All campaigns, payments, and cash-outs across Korvio.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <DashStatCard label="Campaigns" value={String(campaignCount)} icon={FolderKanban} />
        <DashStatCard label="Users" value={String(userCount)} icon={Users} />
        <DashStatCard
          label="Total received"
          value={formatMoney(paymentAgg._sum.amount ?? 0)}
          hint={`${paymentAgg._count} successful payments`}
          icon={TrendingUp}
          accent="success"
        />
        <DashStatCard
          label="Pending approval"
          value={String(pendingCampaigns)}
          hint="Campaigns awaiting go-live"
          icon={FolderKanban}
          accent={pendingCampaigns > 0 ? "warning" : "brand"}
        />
        <DashStatCard
          label="Pending cash-outs"
          value={String(pendingCashouts)}
          hint="Needs manual MoMo payout"
          icon={ArrowLeftRight}
          accent={pendingCashouts > 0 ? "warning" : "brand"}
        />
      </div>

      {pendingCampaigns > 0 ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm">
          <span className="font-semibold text-amber-400">{pendingCampaigns} campaign(s)</span> need
          your approval before they go live.{" "}
          <Link href="/admininterface/campaigns" className="font-semibold text-teal-400">
            Review now
          </Link>
        </div>
      ) : null}

      <section className="dash-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[var(--dash-ink)]">Recent campaigns</h2>
          <Link href="/admininterface/campaigns" className="text-sm font-medium text-teal-400">
            View all
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--dash-border)] text-[var(--dash-muted)]">
                <th className="pb-3 pr-4 font-medium">Campaign</th>
                <th className="pb-3 pr-4 font-medium">Organiser</th>
                <th className="pb-3 pr-4 font-medium">Received</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentCampaigns.map((c) => (
                <tr key={c.id} className="border-b border-[var(--dash-border)] last:border-0">
                  <td className="py-3 pr-4">
                    {c.status === "ACTIVE" ? (
                      <Link
                        href={`/c/${c.campaignCode}`}
                        target="_blank"
                        className="font-medium text-[var(--dash-ink)] hover:text-teal-400"
                      >
                        {c.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-[var(--dash-ink)]">{c.name}</span>
                    )}
                    <p className="text-xs text-[var(--dash-muted)]">{c.campaignCode}</p>
                  </td>
                  <td className="py-3 pr-4 text-[var(--dash-muted)]">
                    {c.owner.fullName}
                    {c.owner.email ? (
                      <span className="block text-xs">{c.owner.email}</span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4 font-semibold text-emerald-400">
                    {formatMoney(c.totalReceived, c.currency)}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={
                        c.status === "DRAFT"
                          ? "rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400"
                          : "rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400"
                      }
                    >
                      {c.status === "DRAFT" ? "Pending approval" : c.status}
                    </span>
                  </td>
                  <td className="py-3 text-[var(--dash-muted)]">
                    {format(c.createdAt, "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
