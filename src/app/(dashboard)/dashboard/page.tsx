import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { formatMoney, daysRemaining } from "@/lib/utils/money";
import { redirect } from "next/navigation";

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
      acc.target += c.targetAmount;
      acc.received += c.totalReceived;
      acc.pledged += c.totalPledged;
      return acc;
    },
    { target: 0, received: 0, pledged: 0 },
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-4 md:flex-row md:p-6">
      <DashboardSidebar />
      <main className="flex-1 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-700 text-[var(--brand)]">
              Hello, {user.fullName.split(" ")[0]}
            </h1>
            <p className="mt-1 text-[var(--ink-soft)]">
              Manage pledges, payments and WhatsApp updates across your campaigns.
            </p>
          </div>
          <Link href="/dashboard/new">
            <Button>Create campaign</Button>
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Campaigns" value={String(campaigns.length)} />
          <StatCard label="Total pledged" value={formatMoney(totals.pledged)} />
          <StatCard label="Total received" value={formatMoney(totals.received)} />
        </div>

        <section className="space-y-3">
          {campaigns.length === 0 ? (
            <div className="surface rounded-3xl p-8">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-700 text-[var(--brand)]">
                No campaigns yet
              </h2>
              <p className="mt-2 max-w-lg text-[var(--ink-soft)]">
                Create your first contribution campaign, share the WhatsApp link,
                and stop editing pledge lists by hand.
              </p>
              <Link href="/dashboard/new" className="mt-4 inline-block">
                <Button>Create your first campaign</Button>
              </Link>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/dashboard/campaigns/${campaign.id}/overview`}
                className="surface block rounded-3xl p-5 transition hover:border-[var(--brand-soft)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-xl font-700 text-[var(--brand)]">
                      {campaign.name}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {campaign.campaignCode} · {campaign.category.replaceAll("_", " ")} ·{" "}
                      {daysRemaining(campaign.deadline)} days left
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                    {campaign.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <p className="text-sm text-[var(--ink-soft)]">
                    Target{" "}
                    <span className="font-semibold text-[var(--ink)]">
                      {formatMoney(campaign.targetAmount, campaign.currency)}
                    </span>
                  </p>
                  <p className="text-sm text-[var(--ink-soft)]">
                    Pledged{" "}
                    <span className="font-semibold text-[var(--ink)]">
                      {formatMoney(campaign.totalPledged, campaign.currency)}
                    </span>
                  </p>
                  <p className="text-sm text-[var(--ink-soft)]">
                    Received{" "}
                    <span className="font-semibold text-[var(--ink)]">
                      {formatMoney(campaign.totalReceived, campaign.currency)}
                    </span>
                  </p>
                </div>
              </Link>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
