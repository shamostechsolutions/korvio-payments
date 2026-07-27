import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/campaign/public-shell";
import { LandingHeroMockup } from "@/components/landing/hero-mockup";
import { LandingLiveCampaigns } from "@/components/landing/live-campaigns";
import { LandingStickyCta } from "@/components/landing/sticky-cta";
import { LandingTestimonials } from "@/components/landing/testimonials";
import { KorvioDisclaimer } from "@/components/legal/disclaimer";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/lib/campaigns/labels";
import {
  getFeaturedSuccessStories,
  getLiveCampaignsForDirectory,
} from "@/lib/campaigns/public-directory";
import {
  PLATFORM_FEE_PERCENT_LABEL,
  calculateCashoutNet,
} from "@/lib/payments/fees";
import { formatMoney } from "@/lib/utils/money";

const PRICING_EXAMPLES = [500_000, 1_000_000, 5_000_000];

const STEPS = [
  {
    step: "1",
    title: "Create a campaign",
    body: "Add your goal and story. Once approved, you get a shareable link.",
  },
  {
    step: "2",
    title: "Share the link",
    body: "Post on WhatsApp or anywhere. Contributors pay online — no app needed.",
  },
  {
    step: "3",
    title: "Cash out",
    body: "Close the campaign and withdraw to MTN or Airtel. Fee shown upfront.",
  },
];

const WHY = [
  {
    title: "Stop chasing pledges",
    body: "Automatic reminders for people who promised but haven't paid.",
  },
  {
    title: "One ledger everyone trusts",
    body: "Every payment shows live. No spreadsheets, no \"did Auntie pay?\"",
  },
  {
    title: "Pay online, instantly",
    body: "MTN MoMo, Airtel Money, and card — from any phone.",
  },
];

const FAQ = [
  {
    q: "Korvio or my mobile money number?",
    a: "Your number works for a small trusted circle. Korvio when you need a public page, running total, and record — weddings, medical, office collections, diaspora.",
  },
  {
    q: "Do contributors need an account?",
    a: "No. They open your link, enter name and phone, and pay.",
  },
  {
    q: "What does Korvio charge?",
    a: `${PLATFORM_FEE_PERCENT_LABEL} at cash-out only. Contributors pay nothing extra.`,
  },
  {
    q: "How do I receive the money?",
    a: "Contributions sit in your campaign wallet. Request a cash-out to MTN or Airtel when you're done.",
  },
];

const CATEGORIES = Object.entries(CATEGORY_LABELS).slice(0, 8);

export const revalidate = 60;

export default async function HomePage() {
  const [liveCampaigns, successStories] = await Promise.all([
    getLiveCampaignsForDirectory(6),
    getFeaturedSuccessStories(3),
  ]);

  return (
    <div className="landing-page min-h-screen">
      <PublicHeader showLandingNav />
      <LandingStickyCta />

      <main className="landing-page-mobile-pad">
        {/* Hero */}
        <section id="landing-hero" className="brand-pattern landing-section pb-8 pt-10 md:pt-16">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div className="animate-rise">
                <span className="landing-kicker">Built for group giving in Uganda</span>
                <h1 className="landing-headline mt-5 text-[var(--ink)]">
                  The easiest way to{" "}
                  <span className="text-[var(--brand)]">pool money together</span>
                </h1>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--ink-soft)]">
                  One shareable link. Live totals. Online payments — while your WhatsApp group
                  stays in the loop.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/register">
                    <Button size="lg">Start a campaign</Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="secondary">
                      Open dashboard
                    </Button>
                  </Link>
                </div>
                <a
                  href="#how-it-works"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)]"
                >
                  See how it works ↓
                </a>
                <div className="landing-pill-row mt-6">
                  {["MTN MoMo", "Airtel Money", "Card", "Free to start"].map((pill) => (
                    <span key={pill} className="landing-pill">
                      {pill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="animate-rise-delay lg:pl-4">
                <LandingHeroMockup />
              </div>
            </div>
          </div>
        </section>

        <LandingTestimonials stories={successStories} />

        <LandingLiveCampaigns campaigns={liveCampaigns} />

        {/* How it works */}
        <section id="how-it-works" className="landing-section-alt landing-section scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
              Three simple steps
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((item) => (
                <article key={item.step} className="card p-6">
                  <span className="landing-step-num">{item.step}</span>
                  <h3 className="mt-4 text-lg font-bold text-[var(--ink)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Why Korvio */}
        <section id="why-korvio" className="landing-section scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              Why Korvio
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
              Less chasing. More contributing.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {WHY.map((item) => (
                <article key={item.title} className="card p-6">
                  <h3 className="text-lg font-bold text-[var(--ink)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* WhatsApp vs Korvio */}
        <section className="landing-section-alt landing-section">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              Cultural fit
            </p>
            <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
              Built for how you already pool money
            </h2>
            <p className="mt-3 max-w-lg text-[var(--ink-soft)]">
              Korvio does not replace the WhatsApp group. It fixes what always falls apart.
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <article className="card p-6">
                <h3 className="text-lg font-bold text-[var(--ink)]">Today, on WhatsApp</h3>
                <ul className="mt-4 space-y-2.5 text-sm landing-compare-bad">
                  <li>· Numbered lists — ticks, circles, questions</li>
                  <li>· Cash and MoMo tracked by hand</li>
                  <li>· Coordinator reposts the total every few hours</li>
                </ul>
              </article>
              <article className="card border-[color-mix(in_srgb,var(--brand)_25%,white)] p-6">
                <h3 className="text-lg font-bold text-[var(--brand)]">With Korvio</h3>
                <ul className="mt-4 space-y-2.5 text-sm text-[var(--ink-soft)]">
                  <li>
                    · <span className="landing-compare-good">Live updates</span> when someone pays
                  </li>
                  <li>
                    · <span className="landing-compare-good">One ledger</span> for money and pledges
                  </li>
                  <li>
                    · <span className="landing-compare-good">One link</span> everywhere, always current
                  </li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section id="trust" className="landing-section scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              Trust
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
              How your money is protected
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  label: "Licensed rails",
                  title: "PawaPay checkout",
                  body: "Contributions run through licensed mobile money and card rails.",
                },
                {
                  label: "Transparency",
                  title: "Every flow visible",
                  body: "Payments on the campaign page. Full audit trail in your dashboard.",
                },
                {
                  label: "Privacy",
                  title: "You choose what's public",
                  body: "Hide amounts, allow anonymous giving, or show supporter names.",
                },
              ].map((item) => (
                <article key={item.title} className="card p-6">
                  <span className="badge">{item.label}</span>
                  <h3 className="mt-3 text-lg font-bold text-[var(--ink)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="landing-section-alt landing-section scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              Pricing
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
              Simple and transparent
            </h2>
            <p className="mt-3 max-w-xl text-[var(--ink-soft)]">
              Free to start. Contributors pay nothing extra.{" "}
              <strong className="text-[var(--ink)]">{PLATFORM_FEE_PERCENT_LABEL}</strong> when you
              cash out.
            </p>

            <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
              <div className="grid gap-4 sm:grid-cols-3">
                <article className="card p-5 text-center sm:col-span-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-soft)]">
                    Create
                  </p>
                  <p className="landing-stat-value mt-2">UGX 0</p>
                </article>
                <article className="card p-5 text-center sm:col-span-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-soft)]">
                    Contribute
                  </p>
                  <p className="landing-stat-value mt-2">UGX 0</p>
                </article>
                <article className="card border-[color-mix(in_srgb,var(--brand)_25%,white)] p-5 text-center sm:col-span-3 sm:col-start-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-soft)]">
                    Cash-out fee
                  </p>
                  <p className="mt-2 text-4xl font-extrabold tracking-tight text-[var(--brand)]">
                    {PLATFORM_FEE_PERCENT_LABEL}
                  </p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    Shown before you confirm withdrawal. Network costs included.
                  </p>
                </article>
              </div>

              <article className="card p-6">
                <h3 className="font-bold text-[var(--ink)]">Cash-out preview</h3>
                <ul className="mt-4 space-y-3">
                  {PRICING_EXAMPLES.map((amount) => {
                    const { platformFee, netAmount } = calculateCashoutNet(amount);
                    return (
                      <li key={amount} className="rounded-xl bg-[var(--bg)] px-4 py-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-[var(--ink)]">
                            {formatMoney(amount, "UGX")}
                          </span>
                          <span className="text-[var(--ink-soft)]">− {formatMoney(platformFee, "UGX")}</span>
                          <span className="font-bold text-[var(--success)]">
                            {formatMoney(netAmount, "UGX")}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </article>
            </div>

            <div className="mt-8">
              <KorvioDisclaimer />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="landing-section scroll-mt-20">
          <div className="mx-auto max-w-2xl px-4 md:px-8">
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              FAQ
            </p>
            <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
              Questions, answered
            </h2>
            <dl className="mt-8">
              {FAQ.map((item) => (
                <div key={item.q} className="landing-faq-item">
                  <dt className="font-semibold text-[var(--ink)]">{item.q}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-[var(--ink-soft)]">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Categories */}
        <section className="landing-section-alt landing-section">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              Categories
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
              Pool money for any cause
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CATEGORIES.map(([key, label]) => (
                <Link
                  key={key}
                  href="/register"
                  className="card group p-4 transition hover:border-[var(--brand)] hover:shadow-md"
                >
                  <h3 className="font-semibold text-[var(--ink)] group-hover:text-[var(--brand)]">
                    {label}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--brand)]">Start →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="landing-final-cta" className="hero-gradient py-16 text-white md:py-20">
          <div className="mx-auto max-w-xl px-4 text-center md:px-8">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready when you are</h2>
            <p className="mt-3 text-white/85">
              Start in minutes. Free to set up — no payment details to begin.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="bg-[var(--ink)] text-[var(--brand)] hover:opacity-90">
                  Start a campaign
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary" className="border-white/30 bg-white/10 text-white">
                  Log in
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
