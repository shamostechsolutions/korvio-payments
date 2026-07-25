import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format, subDays } from "date-fns";
import {
  Calendar,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import {
  campaignProgressPct,
  isOpenFundraising,
} from "@/lib/campaigns/fundraising";
import { prisma } from "@/lib/db";
import { ContributionBars } from "@/components/dashboard/contribution-bars";
import { DashStatCard } from "@/components/dashboard/dash-stat-card";
import { ShareCampaignPanel } from "@/components/dashboard/share-campaign-panel";
import { ProgressBar } from "@/components/campaign/progress-bar";
import {
  PLATFORM_FEE_PERCENT_LABEL,
  calculateCashoutNet,
} from "@/lib/payments/fees";
import { daysRemaining, formatMoney } from "@/lib/utils/money";
import { publicStatusLabel } from "@/lib/status";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function CampaignOverviewPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { campaignId } = await params;
  const access = await getCampaignAccess(campaignId, user);
  if (!access) notFound();

  const campaign = access.campaign;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";
  const publicUrl = `${appUrl.replace(/\/$/, "")}/c/${campaign.campaignCode}`;

  const [contributors, recentPayments, allPayments] = await Promise.all([
    prisma.contributor.findMany({
      where: { campaignId: campaign.id },
      orderBy: { lastActivityAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { campaignId: campaign.id, paymentStatus: "SUCCESSFUL" },
      include: { contributor: true },
      orderBy: { completedAt: "desc" },
      take: 8,
    }),
    prisma.payment.findMany({
      where: { campaignId: campaign.id, paymentStatus: "SUCCESSFUL" },
      select: { amount: true, completedAt: true },
    }),
  ]);

  const openMode = isOpenFundraising(campaign);
  const progressPct = campaignProgressPct(campaign);

  const cashoutPreview = calculateCashoutNet(campaign.availableBalance);

  const chartDays = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const key = format(day, "yyyy-MM-dd");
    const amount = allPayments
      .filter((p) => p.completedAt && format(p.completedAt, "yyyy-MM-dd") === key)
      .reduce((sum, p) => sum + p.amount, 0);
    return { label: format(day, "EEE"), amount };
  });

  const counts = {
    fullyPaid: contributors.filter((c) =>
      ["FULLY_PAID", "PAID_WITHOUT_PLEDGE", "OVERPAID"].includes(c.status),
    ).length,
    pledged: contributors.filter((c) => c.status === "PLEDGED").length,
    unpaid: contributors.filter((c) =>
      ["JOINED", "NOT_YET_PLEDGED", "NOT_JOINED"].includes(c.status),
    ).length,
  };

  const isLive = campaign.status === "ACTIVE";

  return (
    <div className="space-y-6">
      {!isLive ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-[var(--dash-ink)]">
          <span className="font-semibold text-amber-400">Pending approval</span>
          {" — "}
          Your campaign is not public yet. Korvio will review it before contributions can start.
        </div>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--dash-ink)] md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">
            {campaign.name} · {campaign.campaignCode}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/c/${campaign.campaignCode}`}
            target="_blank"
            className={`dash-btn-secondary ${!isLive ? "pointer-events-none opacity-50" : ""}`}
          >
            Preview page
          </Link>
          <Link href={`/dashboard/campaigns/${campaign.id}/wallet`} className="dash-btn-primary">
            Wallet & cash-out
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashStatCard
          label="Received"
          value={formatMoney(campaign.totalReceived, campaign.currency)}
          hint={
            openMode
              ? "Open contributions"
              : `Target ${formatMoney(campaign.targetAmount, campaign.currency)}`
          }
          icon={TrendingUp}
          accent="success"
        />
        <DashStatCard
          label="Pledged"
          value={formatMoney(campaign.totalPledged, campaign.currency)}
          hint={`${counts.pledged} active pledges`}
          icon={Target}
        />
        <DashStatCard
          label="Wallet balance"
          value={formatMoney(campaign.availableBalance, campaign.currency)}
          hint={`Cash-out ~${formatMoney(cashoutPreview.netAmount, campaign.currency)} after ${PLATFORM_FEE_PERCENT_LABEL} fee`}
          icon={Wallet}
          accent="success"
        />
        <DashStatCard
          label="Contributors"
          value={String(contributors.length)}
          hint={`${counts.fullyPaid} fully paid · ${counts.unpaid} unpaid`}
          icon={Users}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="dash-card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--dash-ink)]">Overview</h2>
              <p className="text-sm text-[var(--dash-muted)]">Last 7 days of contributions</p>
            </div>
            {!openMode && progressPct !== null ? (
              <span className="rounded-lg bg-[var(--dash-bg)] px-3 py-1.5 text-xs font-medium text-[var(--dash-muted)]">
                {progressPct}% of goal
              </span>
            ) : (
              <span className="rounded-lg bg-[var(--dash-bg)] px-3 py-1.5 text-xs font-medium text-[var(--dash-muted)]">
                Open contributions
              </span>
            )}
          </div>
          {!openMode && progressPct !== null ? (
            <div className="mt-4">
              <ProgressBar value={progressPct} />
              <p className="mt-2 text-sm text-[var(--dash-muted)]">
                {formatMoney(campaign.totalReceived, campaign.currency)} raised of{" "}
                {formatMoney(campaign.targetAmount, campaign.currency)}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--dash-muted)]">
              {formatMoney(campaign.totalReceived, campaign.currency)} raised ·{" "}
              {contributors.length} contributors
            </p>
          )}
          <ContributionBars
            points={chartDays}
            currency={campaign.currency}
            maxAmount={Math.max(
              ...chartDays.map((d) => d.amount),
              openMode ? 0 : campaign.targetAmount / 7,
              1,
            )}
          />
        </section>

        <section className="dash-card p-5">
          <h2 className="text-base font-semibold text-[var(--dash-ink)]">Campaign insights</h2>
          <ul className="mt-4 space-y-4">
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                <Calendar className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--dash-ink)]">
                  {daysRemaining(campaign.deadline)} days left
                </p>
                <p className="text-xs text-[var(--dash-muted)]">Until deadline</p>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--dash-ink)]">{counts.fullyPaid} paid</p>
                <p className="text-xs text-[var(--dash-muted)]">Contributors fully paid</p>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Target className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--dash-ink)]">
                  {formatMoney(campaign.totalPledged, campaign.currency)} pledged
                </p>
                <p className="text-xs text-[var(--dash-muted)]">{counts.pledged} active pledges</p>
              </div>
            </li>
          </ul>
          <p className="mt-4 rounded-lg bg-[var(--dash-bg)] px-3 py-2 text-xs text-[var(--dash-muted)]">
            Status: <span className="font-semibold text-teal-400">{campaign.status}</span>
          </p>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="dash-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--dash-ink)]">Recent payments</h2>
              <p className="text-sm text-[var(--dash-muted)]">
                You received {recentPayments.length} recent contribution
                {recentPayments.length === 1 ? "" : "s"}.
              </p>
            </div>
            <Link
              href={`/dashboard/campaigns/${campaign.id}/payments`}
              className="text-sm font-medium text-teal-400 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-1">
            {recentPayments.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--dash-muted)]">No payments yet.</p>
            ) : (
              recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-[var(--dash-bg)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-400">
                      {initials(p.contributor.displayName)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[var(--dash-ink)]">
                        {p.contributor.displayName}
                      </p>
                      <p className="text-xs text-[var(--dash-muted)]">
                        {p.completedAt
                          ? format(p.completedAt, "MMM d · h:mm a")
                          : publicStatusLabel(p.contributor.status)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-emerald-400">
                    {access.canViewAmounts
                      ? `+${formatMoney(p.amount, campaign.currency)}`
                      : "••••"}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <ShareCampaignPanel
          publicUrl={publicUrl}
          campaignCode={campaign.campaignCode}
          isLive={isLive}
        />
      </div>
    </div>
  );
}
