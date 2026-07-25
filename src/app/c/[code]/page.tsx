import Link from "next/link";
import { notFound } from "next/navigation";
import { CampaignContributePanel } from "@/components/campaign/contribute-panel";
import { CampaignDescription } from "@/components/campaign/campaign-description";
import { ProgressBar } from "@/components/campaign/progress-bar";
import { PublicFooter, PublicHeader } from "@/components/campaign/public-shell";
import { ShareButtons } from "@/components/campaign/share-buttons";
import { SupportMessagesSection } from "@/components/campaign/support-messages";
import { prisma } from "@/lib/db";
import { categoryLabel } from "@/lib/campaigns/labels";
import { daysRemaining, formatMoney } from "@/lib/utils/money";
import { publicStatusLabel } from "@/lib/status";
import { format } from "date-fns";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

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

  const [contributors, publicUpdates] = await Promise.all([
    prisma.contributor.findMany({
      where: { campaignId: campaign.id },
      orderBy: { paidAmount: "desc" },
    }),
    prisma.campaignPublicUpdate.findMany({
      where: { campaignId: campaign.id },
      orderBy: { publishedAt: "desc" },
      take: 10,
    }),
  ]);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";
  const publicUrl = `${appUrl.replace(/\/$/, "")}/c/${campaign.campaignCode}`;

  const progressPct =
    campaign.targetAmount > 0
      ? Math.round((campaign.totalReceived / campaign.targetAmount) * 100)
      : 0;

  const topSupporters = contributors
    .filter((c) => c.paidAmount > 0 && !c.anonymous && !c.hideFromList)
    .slice(0, 5)
    .map((c, i) => ({
      rank: i + 1,
      name: c.displayName,
      amount: formatMoney(c.paidAmount, campaign.currency),
    }));

  const publicList =
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
          .slice(0, 20)
          .map((c) => {
            const name =
              c.anonymous ||
              campaign.contributorListVisibility === "STATUSES_WITHOUT_NAMES"
                ? "Anonymous"
                : c.displayName;
            return {
              id: c.id,
              name,
              status:
                campaign.contributorListVisibility === "NAMES_ONLY"
                  ? undefined
                  : publicStatusLabel(c.status),
              amount:
                c.publicAmount &&
                (campaign.contributionAmountVisibility !== "PRIVATE" ||
                  campaign.contributorListVisibility === "AMOUNTS_WHEN_PERMITTED")
                  ? formatMoney(c.paidAmount || c.pledgedAmount, campaign.currency)
                  : undefined,
            };
          });

  const isComplete = campaign.status === "COMPLETED" || progressPct >= 100;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PublicHeader />

      {campaign.imageUrl ? (
        <div
          className="h-48 w-full bg-cover bg-center md:h-64"
          style={{ backgroundImage: `url(${campaign.imageUrl})` }}
        />
      ) : (
        <div className="hero-gradient h-32 w-full md:h-40" />
      )}

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge">{categoryLabel(campaign.category)}</span>
                {campaign.isVerified ? (
                  <span className="badge badge-success">Verified beneficiary</span>
                ) : null}
                {isComplete ? (
                  <span className="badge badge-success">Campaign complete</span>
                ) : (
                  <span className="badge">{daysRemaining(campaign.deadline)} days left</span>
                )}
              </div>

              <h1 className="text-3xl font-bold leading-tight tracking-tight text-[var(--ink)] md:text-4xl lg:text-[2.75rem]">
                {campaign.name}
              </h1>

              <ShareButtons
                campaignName={campaign.name}
                campaignCode={campaign.campaignCode}
                url={publicUrl}
              />

              {campaign.isVerified ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--ink-soft)]">
                  <span className="font-semibold text-[var(--success)]">Verified beneficiary</span>
                  {" — "}
                  Our team checked this campaign before giving it the badge. We spoke to the
                  organiser and confirmed the story is real.
                </div>
              ) : null}

              <div className="card p-5 md:p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--ink-soft)]">Raised</p>
                    <p className="mt-1 text-3xl font-bold text-[var(--brand)] md:text-4xl">
                      {formatMoney(campaign.totalReceived, campaign.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--ink-soft)]">Goal</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--ink)]">
                      {formatMoney(campaign.targetAmount, campaign.currency)}
                    </p>
                  </div>
                </div>
                <ProgressBar value={progressPct} className="mt-4" />
                <p className="mt-2 text-sm font-medium text-[var(--ink-soft)]">
                  {progressPct}% funded · {contributors.length} contributors
                </p>
              </div>
            </section>

            <section className="card p-5 md:p-6">
              <h2 className="text-lg font-bold text-[var(--ink)]">About this campaign</h2>
              <div className="mt-4">
                <CampaignDescription text={campaign.description} />
              </div>
            </section>

            <section className="card p-5 md:p-6">
              <h2 className="text-lg font-bold text-[var(--ink)]">Organiser</h2>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">
                  {initials(campaign.organiserName)}
                </span>
                <div>
                  <p className="font-semibold text-[var(--ink)]">{campaign.organiserName}</p>
                  <p className="text-sm text-[var(--ink-soft)]">
                    {campaign.contactPerson || "Campaign organiser"} · Uganda
                  </p>
                </div>
              </div>
            </section>

            {publicUpdates.length ? (
              <section className="card p-5 md:p-6">
                <h2 className="text-lg font-bold text-[var(--ink)]">
                  Updates ({publicUpdates.length})
                </h2>
                <ul className="mt-4 space-y-4">
                  {publicUpdates.map((u) => (
                    <li key={u.id} className="border-b border-[var(--line)] pb-4 last:border-0">
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {u.authorName} · {format(u.publishedAt, "yyyy-MM-dd")}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-soft)]">
                        {u.body}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {campaign.allowSupportMessages ? (
              <SupportMessagesSection campaignCode={campaign.campaignCode} />
            ) : null}

            {topSupporters.length ? (
              <section className="card p-5 md:p-6">
                <h2 className="text-lg font-bold text-[var(--ink)]">Top supporters</h2>
                <ol className="mt-4 space-y-3">
                  {topSupporters.map((s) => (
                    <li
                      key={s.rank}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg)] text-xs font-bold text-[var(--brand)]">
                          {s.rank}
                        </span>
                        <span className="font-medium text-[var(--ink)]">{s.name}</span>
                      </span>
                      <span className="font-semibold text-[var(--brand)]">{s.amount}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {publicList.length ? (
              <section className="card p-5 md:p-6">
                <h2 className="text-lg font-bold text-[var(--ink)]">Recent contributors</h2>
                <ul className="mt-4 divide-y divide-[var(--line)]">
                  {publicList.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--brand)]">
                          {initials(c.name)}
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-[var(--ink)]">
                            {c.name}
                          </span>
                          {c.status ? (
                            <span className="text-xs text-[var(--ink-soft)]">{c.status}</span>
                          ) : null}
                        </span>
                      </span>
                      {c.amount ? (
                        <span className="text-sm font-semibold text-[var(--brand)]">
                          {c.amount}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <p className="text-center text-xs text-[var(--ink-soft)] lg:text-left">
              Individual amounts stay private unless a contributor chooses to share them.{" "}
              <Link href="/" className="font-semibold text-[var(--brand)]">
                Powered by Korvio
              </Link>
            </p>
          </div>

          <aside className="lg:pt-2">
            {!isComplete ? (
              <CampaignContributePanel
                campaignCode={campaign.campaignCode}
                currency={campaign.currency}
                allowPledges={campaign.allowPledges}
                minimumPledgeAmount={campaign.minimumPledgeAmount}
                organiserName={campaign.organiserName}
                organiserPhone={campaign.organiserPhone}
              />
            ) : (
              <div className="card p-6 lg:sticky lg:top-24">
                <p className="text-lg font-bold text-[var(--ink)]">Thank you</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                  This campaign has reached its goal. Share the page to celebrate everyone who
                  contributed.
                </p>
                <p className="mt-4 text-2xl font-bold text-[var(--brand)]">
                  {formatMoney(campaign.totalReceived, campaign.currency)} raised
                </p>
                <div className="mt-4">
                  <ShareButtons
                    campaignName={campaign.name}
                    campaignCode={campaign.campaignCode}
                    url={publicUrl}
                  />
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
