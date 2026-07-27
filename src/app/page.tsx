import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/campaign/public-shell";
import { LandingHeroMockup } from "@/components/landing/hero-mockup";
import { LandingStickyCta } from "@/components/landing/sticky-cta";
import { KorvioDisclaimer } from "@/components/legal/disclaimer";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/lib/campaigns/labels";
import {
  PLATFORM_FEE_PERCENT_LABEL,
  calculateCashoutNet,
} from "@/lib/payments/fees";
import { formatMoney } from "@/lib/utils/money";

const PRICING_EXAMPLES = [500_000, 1_000_000, 5_000_000];

const STEPS = [
  {
    step: "1",
    title: "Set up your campaign",
    body: "Goal, story, organiser details. Korvio reviews it, then your link goes live.",
  },
  {
    step: "2",
    title: "Drop the link in the group",
    body: "Share the link anywhere — group chat, SMS, email. Contributors pay via MoMo or card. No app download.",
  },
  {
    step: "3",
    title: "Withdraw from your wallet",
    body: "Money sits in your campaign wallet. When you cash out, Korvio deducts the service fee upfront — you see the exact amount before you confirm.",
  },
];

const FEATURES = [
  {
    icon: "📋",
    title: "Treasurer dashboard",
    body: "See pledges, payments, and who still owes — without scrolling 400 chat messages.",
  },
  {
    icon: "🔔",
    title: "Pledge reminders",
    body: "Nudge people who said yes but haven't paid. You approve what goes out.",
  },
  {
    icon: "🔗",
    title: "One public page",
    body: "Shareable link with live totals. Diaspora and strangers can contribute too.",
  },
  {
    icon: "💳",
    title: "Campaign wallet",
    body: "Every shilling tracked. Cash out when ready — fee shown before you confirm.",
  },
];

const FAQ = [
  {
    q: "Who is Korvio for?",
    a: "Anyone running the list — burial committees, school reunions, wedding planners, church projects, office send-offs, medical appeals. If the group is pooling money, Korvio fits.",
  },
  {
    q: "Do contributors need an account?",
    a: "No. They open your link, enter name and phone, and pay.",
  },
  {
    q: "Who pays the withdrawal fee?",
    a: `The organiser, once, when you cash out. One ${PLATFORM_FEE_PERCENT_LABEL} fee includes sending money to your MTN or Airtel — e.g. ${formatMoney(1_000_000, "UGX")} in your wallet → ${formatMoney(calculateCashoutNet(1_000_000).netAmount, "UGX")} on your phone. Contributors pay what they choose; their network may charge them separately.`,
  },
  {
    q: "Why is there a fee at all?",
    a: "Running the campaign page, payment handling, and the MoMo transfer to you costs money. One fee at withdrawal covers it — we do not charge again when the money hits your phone.",
  },
  {
    q: "How do I get the money?",
    a: "Contributions land in your campaign wallet. Request a cash-out to MTN MoMo or Airtel Money when you're done collecting.",
  },
];

const USE_CASES = [
  "Burials",
  "School reunions",
  "Weddings",
  "Medical bills",
  "Church projects",
  "Office collections",
];

const FEATURED_CATEGORIES: { key: keyof typeof CATEGORY_LABELS; title: string; blurb: string }[] = [
  { key: "FUNERAL", title: "Burial", blurb: "Funeral arrangements & family support" },
  { key: "ALUMNI", title: "School reunion", blurb: "Class levies, reunions & group projects" },
  { key: "WEDDING", title: "Wedding", blurb: "Committee collections & introductions" },
  { key: "MEDICAL", title: "Medical", blurb: "Hospital bills & treatment costs" },
  { key: "EDUCATION", title: "Education", blurb: "School fees & tuition drives" },
  { key: "CHURCH", title: "Church", blurb: "Building funds & parish projects" },
  { key: "OFFICE", title: "Office", blurb: "Send-offs, gifts & staff collections" },
  { key: "COMMUNITY", title: "Community", blurb: "Neighbourhood & local causes" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PublicHeader showLandingNav />
      <LandingStickyCta />

      <main className="landing-page-mobile-pad">
        {/* Hero */}
        <section id="landing-hero" className="brand-pattern landing-section pb-8 pt-10 md:pt-16">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div className="animate-rise">
                <span className="landing-kicker">For group collections in Uganda</span>
                <h1 className="landing-headline mt-5">
                  Your group collection,{" "}
                  <span className="text-[var(--brand)]">organised</span>
                </h1>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--ink-soft)]">
                  Burials, school reunions, weddings, medical bills — one link, live totals, and
                  MoMo checkout for everyone in the group.
                </p>
                <div className="mt-8">
                  <Link href="/register">
                    <Button size="lg">Start a campaign</Button>
                  </Link>
                </div>
                <a
                  href="#how-it-works"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)]"
                >
                  How it works ↓
                </a>
                <div className="landing-pill-row mt-6">
                  {USE_CASES.map((pill) => (
                    <span key={pill} className="landing-pill">
                      {pill}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm text-[var(--ink-soft)]">
                  MTN MoMo · Airtel Money · Card · Free to start
                </p>
              </div>

              <div className="animate-rise-delay">
                <LandingHeroMockup />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="landing-section-alt landing-section scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Three steps</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((item) => (
                <article key={item.step} className="card p-6">
                  <span className="landing-step-num">{item.step}</span>
                  <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Organiser features — Korvio-specific, not generic pooling copy */}
        <section id="features" className="landing-section scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              For organisers
            </p>
            <h2 className="mt-2 max-w-lg text-3xl font-bold tracking-tight md:text-4xl">
              Tools a shared list can&apos;t give you
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {FEATURES.map((item) => (
                <article key={item.title} className="card flex gap-4 p-6">
                  <span className="landing-feature-icon shrink-0" aria-hidden>
                    {item.icon}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section id="trust" className="landing-section-alt landing-section scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              Trust
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Money handled properly
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  label: "Licensed rails",
                  title: "PawaPay checkout",
                  body: "Contributions via licensed mobile money and card processing.",
                },
                {
                  label: "Transparency",
                  title: "Public ledger",
                  body: "Contributors see the running total. You get a full audit trail.",
                },
                {
                  label: "Privacy",
                  title: "Your rules",
                  body: "Hide amounts, allow anonymous giving, or show names — you choose.",
                },
              ].map((item) => (
                <article key={item.title} className="card p-6">
                  <span className="badge">{item.label}</span>
                  <h3 className="mt-3 text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="landing-section scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              Pricing
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              No surprises at cash-out
            </h2>
            <p className="mt-3 max-w-xl text-[var(--ink-soft)]">
              Contributors send exactly what they choose. When you withdraw, one{" "}
              <strong className="text-[var(--ink)]">{PLATFORM_FEE_PERCENT_LABEL}</strong> fee
              covers Korvio and the transfer to your MTN or Airtel — no second charge at payout.
            </p>

            <article className="card mt-8 p-6">
              <p className="text-sm font-semibold text-[var(--ink-soft)]">Example withdrawal</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--ink-soft)]">Collected in your wallet</span>
                  <span className="font-semibold">{formatMoney(1_000_000, "UGX")}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--ink-soft)]">
                    Withdrawal fee ({PLATFORM_FEE_PERCENT_LABEL}, incl. transfer)
                  </span>
                  <span className="font-semibold text-[var(--danger)]">
                    − {formatMoney(calculateCashoutNet(1_000_000).platformFee, "UGX")}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-t border-[var(--line)] pt-3">
                  <span className="font-semibold">You receive on MoMo</span>
                  <span className="text-lg font-bold text-[var(--success)]">
                    {formatMoney(calculateCashoutNet(1_000_000).netAmount, "UGX")}
                  </span>
                </div>
              </div>
            </article>

            <article className="card mt-6 p-6">
              <h3 className="font-bold">More examples</h3>
              <ul className="mt-4 space-y-3">
                {PRICING_EXAMPLES.map((amount) => {
                  const { platformFee, netAmount } = calculateCashoutNet(amount);
                  return (
                    <li key={amount} className="rounded-xl bg-[var(--bg)] px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{formatMoney(amount, "UGX")}</span>
                        <span className="text-[var(--ink-soft)]">
                          − {formatMoney(platformFee, "UGX")}
                        </span>
                        <span className="font-bold text-[var(--success)]">
                          {formatMoney(netAmount, "UGX")}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>

            <div className="mt-8">
              <KorvioDisclaimer />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="landing-section-alt landing-section scroll-mt-20">
          <div className="mx-auto max-w-2xl px-4 md:px-8">
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              FAQ
            </p>
            <h2 className="mt-2 text-center text-3xl font-bold tracking-tight md:text-4xl">
              Quick answers
            </h2>
            <dl className="mt-8">
              {FAQ.map((item) => (
                <div key={item.q} className="landing-faq-item">
                  <dt className="font-semibold">{item.q}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-[var(--ink-soft)]">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Categories */}
        <section className="landing-section">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              Categories
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Burials, reunions, and more
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED_CATEGORIES.map(({ key, title, blurb }) => (
                <Link
                  key={key}
                  href="/register"
                  className="card group p-4 transition hover:border-[var(--brand)]"
                >
                  <h3 className="font-semibold group-hover:text-[var(--brand)]">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--ink-soft)]">{blurb}</p>
                  <p className="mt-2 text-xs text-[var(--brand)]">Start →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="landing-final-cta" className="hero-gradient py-16 md:py-20">
          <div className="mx-auto max-w-xl px-4 text-center md:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Start your collection
            </h2>
            <p className="mt-3 text-white/80">
              Set up in minutes. No payment details needed to begin.
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
