import Link from "next/link";
import { ProgressBar } from "@/components/campaign/progress-bar";
import { Button } from "@/components/ui/button";
import type { SuccessStoryCard } from "@/lib/campaigns/public-directory";
import { formatMoney } from "@/lib/utils/money";

const PLACEHOLDER_STORIES: SuccessStoryCard[] = [
  {
    code: "",
    name: "Medical support for a neighbour",
    categoryLabel: "Medical",
    currency: "UGX",
    totalReceived: 3_200_000,
    contributorCount: 84,
    quote: "Everyone could see the total update live. No more chasing people in the group.",
    goalReached: true,
  },
  {
    code: "",
    name: "Office send-off collection",
    categoryLabel: "Office",
    currency: "UGX",
    totalReceived: 850_000,
    contributorCount: 23,
    quote: "One link in the WhatsApp group and we were done in two days.",
    goalReached: true,
  },
];

type Props = {
  stories: SuccessStoryCard[];
};

export function LandingTestimonials({ stories }: Props) {
  const items =
    stories.length >= 2
      ? stories.slice(0, 3)
      : [...stories, ...PLACEHOLDER_STORIES].slice(0, 3);

  return (
    <section className="landing-section scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
          Testimonials
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
          Campaigns that worked
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((story, index) => (
            <article key={`${story.code}-${index}`} className="landing-story-card card flex flex-col p-5">
              {story.goalReached ? (
                <span className="landing-story-badge">Goal reached</span>
              ) : (
                <span className="landing-story-badge landing-story-badge-live">Live</span>
              )}
              {story.quote ? (
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
                  &ldquo;{story.quote}&rdquo;
                </p>
              ) : null}
              <h3 className="mt-4 text-base font-bold text-[var(--ink)]">{story.name}</h3>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">{story.categoryLabel}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="font-bold text-[var(--brand)]">
                  {formatMoney(story.totalReceived, story.currency)}
                </span>
                <span className="text-[var(--ink-soft)]">
                  {story.contributorCount} contributor{story.contributorCount === 1 ? "" : "s"}
                </span>
              </div>
              {story.code ? (
                <Link
                  href={`/c/${story.code}`}
                  className="mt-4 text-sm font-semibold text-[var(--brand)] hover:underline"
                >
                  View campaign →
                </Link>
              ) : null}
            </article>
          ))}
        </div>

        <article className="landing-story-cta card mt-4 p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-bold text-[var(--ink)]">Your campaign could be next</h3>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                Start today — we&apos;ll feature real success stories as they happen.
              </p>
            </div>
            <Link href="/register" className="shrink-0">
              <Button>Start a campaign</Button>
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
