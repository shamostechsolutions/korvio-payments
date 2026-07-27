import Link from "next/link";
import type { SuccessStoryCard } from "@/lib/campaigns/public-directory";
import { formatMoney } from "@/lib/utils/money";

type Props = {
  stories: SuccessStoryCard[];
};

export function LandingTestimonials({ stories }: Props) {
  if (stories.length === 0) return null;

  return (
    <section className="landing-section scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
          Raised on Korvio
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          Real campaigns, real totals
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {stories.slice(0, 3).map((story) => (
            <Link
              key={story.code}
              href={`/c/${story.code}`}
              className="landing-story-card card group flex flex-col p-5 transition hover:border-[var(--brand)]"
            >
              {story.goalReached ? (
                <span className="landing-story-badge">Goal reached</span>
              ) : (
                <span className="landing-story-badge landing-story-badge-live">Active</span>
              )}
              <h3 className="mt-3 text-base font-bold group-hover:text-[var(--brand)]">
                {story.name}
              </h3>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">{story.categoryLabel}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="font-bold text-[var(--brand)]">
                  {formatMoney(story.totalReceived, story.currency)}
                </span>
                <span className="text-[var(--ink-soft)]">
                  {story.contributorCount} people
                </span>
              </div>
              {story.quote ? (
                <p className="mt-3 line-clamp-2 text-sm text-[var(--ink-soft)]">{story.quote}</p>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
