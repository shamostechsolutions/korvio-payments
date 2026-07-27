import Link from "next/link";
import { ProgressBar } from "@/components/campaign/progress-bar";
import { Button } from "@/components/ui/button";
import type { PublicCampaignCard } from "@/lib/campaigns/public-directory";
import { formatMoney } from "@/lib/utils/money";

type Props = {
  campaigns: PublicCampaignCard[];
};

function CampaignCard({ campaign }: { campaign: PublicCampaignCard }) {
  const progress = campaign.progressPct ?? 0;
  const openMode = campaign.progressPct === null;

  return (
    <Link
      href={`/c/${campaign.code}`}
      className="landing-campaign-card card group flex flex-col overflow-hidden transition hover:border-[var(--brand)] hover:shadow-md"
    >
      <div className="landing-campaign-card-header">
        {campaign.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={campaign.imageUrl} alt="" className="landing-campaign-image" />
        ) : (
          <div className="landing-campaign-image landing-campaign-image-fallback">
            <span>{campaign.categoryLabel.slice(0, 1)}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[var(--brand)]">{campaign.categoryLabel}</p>
          <h3 className="mt-0.5 truncate font-bold text-[var(--ink)] group-hover:text-[var(--brand)]">
            {campaign.name}
          </h3>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 pt-3">
        <p className="text-lg font-bold text-[var(--ink)]">
          {formatMoney(campaign.totalReceived, campaign.currency)}
          {!openMode && campaign.targetAmount > 0 ? (
            <span className="ml-1 text-sm font-normal text-[var(--ink-soft)]">
              of {formatMoney(campaign.targetAmount, campaign.currency)}
            </span>
          ) : null}
        </p>
        {!openMode && campaign.targetAmount > 0 ? (
          <div className="mt-3">
            <ProgressBar value={progress} />
            <div className="mt-1.5 flex justify-between text-xs text-[var(--ink-soft)]">
              <span>{campaign.contributorCount} contributors</span>
              <span className="font-semibold text-[var(--brand)]">{progress}%</span>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-[var(--ink-soft)]">
            {campaign.contributorCount} contributors · Open contributions
          </p>
        )}
        <span className="mt-auto pt-4 text-xs font-semibold text-[var(--brand)]">Contribute →</span>
      </div>
    </Link>
  );
}

export function LandingLiveCampaigns({ campaigns }: Props) {
  if (campaigns.length === 0) {
    return (
      <section id="campaigns" className="landing-section-alt landing-section scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
            Live campaigns
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
            Be the first to go live
          </h2>
          <p className="mt-3 max-w-lg text-[var(--ink-soft)]">
            No public campaigns yet. Start one and it will show up here once approved.
          </p>
          <Link href="/register" className="mt-6 inline-block">
            <Button size="lg">Start a campaign</Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section id="campaigns" className="landing-section-alt landing-section scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              Live campaigns
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
              Browse and contribute
            </h2>
          </div>
          <Link href="/register" className="text-sm font-semibold text-[var(--brand)] hover:underline">
            Start your own →
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.code} campaign={campaign} />
          ))}
        </div>
      </div>
    </section>
  );
}
