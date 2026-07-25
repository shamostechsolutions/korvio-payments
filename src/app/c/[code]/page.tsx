import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { prisma } from "@/lib/db";
import { daysRemaining, formatMoney } from "@/lib/utils/money";
import { publicStatusLabel } from "@/lib/status";
import { whatsappJoinLink } from "@/lib/utils/codes";

export default async function PublicCampaignPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { campaignCode: code.toUpperCase() },
  });

  if (!campaign || campaign.status === "CANCELLED") notFound();

  const contributors = await prisma.contributor.findMany({
    where: { campaignId: campaign.id },
    orderBy: { displayName: "asc" },
  });

  const counts = {
    contributors: contributors.length,
    fullyPaid: contributors.filter((c) =>
      ["FULLY_PAID", "PAID_WITHOUT_PLEDGE", "OVERPAID"].includes(c.status),
    ).length,
    partiallyPaid: contributors.filter((c) => c.status === "PARTIALLY_PAID").length,
    pledged: contributors.filter((c) => c.status === "PLEDGED").length,
    unpaid: contributors.filter((c) =>
      ["JOINED", "NOT_YET_PLEDGED", "NOT_JOINED"].includes(c.status),
    ).length,
  };

  const list =
    campaign.contributorListVisibility === "HIDDEN"
      ? []
      : contributors
          .filter((c) => !c.hideFromList)
          .filter((c) => {
            if (campaign.contributorListVisibility === "OPT_IN_ONLY") {
              return c.publicName || c.anonymous;
            }
            return true;
          })
          .map((c, index) => {
            const name =
              c.anonymous ||
              campaign.contributorListVisibility === "STATUSES_WITHOUT_NAMES"
                ? "Anonymous contributor"
                : c.displayName;
            const showAmount =
              c.publicAmount &&
              (campaign.contributionAmountVisibility !== "PRIVATE" ||
                campaign.contributorListVisibility === "AMOUNTS_WHEN_PERMITTED");
            return {
              position: index + 1,
              name:
                campaign.contributorListVisibility === "STATUSES_WITHOUT_NAMES"
                  ? undefined
                  : name,
              status:
                campaign.contributorListVisibility === "NAMES_ONLY"
                  ? undefined
                  : publicStatusLabel(c.status),
              amount: showAmount
                ? formatMoney(c.paidAmount || c.pledgedAmount, campaign.currency)
                : undefined,
            };
          });

  const whatsappUrl = whatsappJoinLink(
    process.env.WHATSAPP_BUSINESS_NUMBER || "256700000000",
    campaign.campaignCode,
  );

  return (
    <main className="brand-pattern min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Logo />
        <section className="surface rounded-3xl p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
            {campaign.campaignCode}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--brand)]">
            {campaign.name}
          </h1>
          <p className="mt-3 text-[var(--ink-soft)]">{campaign.description}</p>
          <div className="mt-6">
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <Button size="lg">Pledge or pay on WhatsApp</Button>
            </a>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="Target"
            value={formatMoney(campaign.targetAmount, campaign.currency)}
          />
          <StatCard
            label="Pledged"
            value={formatMoney(campaign.totalPledged, campaign.currency)}
          />
          <StatCard
            label="Received"
            value={formatMoney(campaign.totalReceived, campaign.currency)}
          />
          <StatCard
            label="Days remaining"
            value={String(daysRemaining(campaign.deadline))}
            hint={`${counts.contributors} contributors`}
          />
        </div>

        <section className="surface rounded-3xl p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--brand)]">
            Progress
          </h2>
          <ul className="mt-4 grid gap-2 text-sm text-[var(--ink-soft)] sm:grid-cols-2">
            <li>✅ Fully paid: {counts.fullyPaid}</li>
            <li>🟡 Partially paid: {counts.partiallyPaid}</li>
            <li>🤝 Pledged: {counts.pledged}</li>
            <li>⚪ Not yet paid: {counts.unpaid}</li>
          </ul>
        </section>

        {list.length ? (
          <section className="surface rounded-3xl p-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--brand)]">
              Contribution status
            </h2>
            <ol className="mt-4 space-y-2 text-sm">
              {list.map((c) => (
                <li
                  key={c.position}
                  className="flex justify-between gap-3 border-b border-[var(--line)] pb-2"
                >
                  <span>
                    {c.position}. {c.name || "Contributor"}
                    {c.status ? ` — ${c.status}` : ""}
                  </span>
                  {c.amount ? (
                    <span className="font-medium text-[var(--brand)]">{c.amount}</span>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <p className="text-center text-sm text-[var(--ink-soft)]">
          Individual amounts stay private unless a contributor chooses to share them.{" "}
          <Link href="/" className="font-semibold text-[var(--brand)]">
            About Korvio
          </Link>
        </p>
      </div>
    </main>
  );
}
