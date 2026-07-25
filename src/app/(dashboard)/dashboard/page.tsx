import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DashShell } from "@/components/dashboard/dash-shell";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashStatCard } from "@/components/dashboard/dash-stat-card";
import { isOpenFundraising } from "@/lib/campaigns/fundraising";
import { formatMoney, daysRemaining } from "@/lib/utils/money";
import { redirect } from "next/navigation";
import { FolderKanban, Plus, TrendingUp, Wallet } from "lucide-react";

export default async function DashboardHomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const campaigns = await prisma.campaign.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { administrators: { some: { userId: user.id, status: "ACTIVE" } } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const totals = campaigns.reduce(
    (acc, c) => {
      if (!isOpenFundraising(c)) {
        acc.target += c.targetAmount;
      }
      acc.received += c.totalReceived;
      acc.pledged += c.totalPledged;
      acc.wallet += c.availableBalance;
      return acc;
    },
    { target: 0, received: 0, pledged: 0, wallet: 0 },
  );

  return (
    <DashShell
      renderSidebar={({ onNavigate }) => (
        <DashboardSidebar userName={user.fullName} onNavigate={onNavigate} />
      )}
    >
      <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--dash-ink)] md:text-3xl">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-[var(--dash-muted)]">
                Hello, {user.fullName.split(" ")[0]} — manage your campaigns and collections.
              </p>
            </div>
            <Link href="/dashboard/new" className="dash-btn-primary">
              <Plus className="h-4 w-4" />
              Create campaign
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashStatCard
              label="Campaigns"
              value={String(campaigns.length)}
              icon={FolderKanban}
            />
            <DashStatCard
              label="Total received"
              value={formatMoney(totals.received)}
              hint={`Pledged ${formatMoney(totals.pledged)}`}
              icon={TrendingUp}
              accent="success"
            />
            <DashStatCard
              label="Wallet balance"
              value={formatMoney(totals.wallet)}
              hint="Across all campaigns"
              icon={Wallet}
              accent="success"
            />
            <DashStatCard
              label="Total target"
              value={formatMoney(totals.target)}
              hint="Combined goals"
              icon={TrendingUp}
            />
          </div>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--dash-ink)]">Your campaigns</h2>
            {campaigns.length === 0 ? (
              <div className="dash-card p-8 text-center">
                <h3 className="text-lg font-semibold text-[var(--dash-ink)]">No campaigns yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-[var(--dash-muted)]">
                  Create your first campaign, share the public link with your group, and collect
                  payments online.
                </p>
                <Link href="/dashboard/new" className="dash-btn-primary mt-6 inline-flex">
                  Create your first campaign
                </Link>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/dashboard/campaigns/${campaign.id}/overview`}
                  className="dash-card block p-5 transition hover:border-teal-500/30 hover:bg-[var(--dash-card-hover)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--dash-ink)]">
                        {campaign.name}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--dash-muted)]">
                        {campaign.campaignCode} · {campaign.category.replaceAll("_", " ")} ·{" "}
                        {daysRemaining(campaign.deadline)} days left
                      </p>
                    </div>
                    <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400">
                      {campaign.status === "DRAFT" ? "Pending approval" : campaign.status}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <p className="text-sm text-[var(--dash-muted)]">
                      {isOpenFundraising(campaign) ? (
                        <>
                          Type{" "}
                          <span className="font-semibold text-[var(--dash-ink)]">
                            Open contributions
                          </span>
                        </>
                      ) : (
                        <>
                          Target{" "}
                          <span className="font-semibold text-[var(--dash-ink)]">
                            {formatMoney(campaign.targetAmount, campaign.currency)}
                          </span>
                        </>
                      )}
                    </p>
                    <p className="text-sm text-[var(--dash-muted)]">
                      Received{" "}
                      <span className="font-semibold text-emerald-400">
                        {formatMoney(campaign.totalReceived, campaign.currency)}
                      </span>
                    </p>
                    <p className="text-sm text-[var(--dash-muted)]">
                      Wallet{" "}
                      <span className="font-semibold text-[var(--dash-ink)]">
                        {formatMoney(campaign.availableBalance, campaign.currency)}
                      </span>
                    </p>
                  </div>
                </Link>
              ))
            )}
          </section>
      </div>
    </DashShell>
  );
}
