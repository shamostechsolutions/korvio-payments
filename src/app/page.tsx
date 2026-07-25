import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/campaign/public-shell";
import { ProgressBar } from "@/components/campaign/progress-bar";
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
    title: "Create a campaign",
    body: "Add your goal, story, and organiser details. You get a public page and shareable link instantly.",
  },
  {
    step: "2",
    title: "Share with your people",
    body: "Post the link on WhatsApp, email, or social media. Contributors pay online — no app download required.",
  },
  {
    step: "3",
    title: "Cash out when you are done",
    body: "Contributions sit in your campaign wallet. Close the campaign, request a cash-out, and receive the balance minus a small Korvio service fee.",
  },
];

const WHY = [
  {
    title: "Stop chasing pledges",
    body: "Automatic reminders go to people who promised but have not paid yet. Spend less time on follow-ups.",
  },
  {
    title: "One ledger everyone trusts",
    body: "Every payment shows up live for the group. No spreadsheets and no “did Auntie pay?” debates.",
  },
  {
    title: "Pay online, instantly",
    body: "MTN MoMo, Airtel Money, and card payments through licensed checkout. Contributors pay from any phone.",
  },
];

const FAQ = [
  {
    q: "When should I use Korvio versus just my mobile money number?",
    a: "Use your mobile money number for a small trusted circle. Use Korvio when you need a shareable page, a running total, and a record everyone can see — weddings, medical bills, office collections, and diaspora giving.",
  },
  {
    q: "Do contributors need an account?",
    a: "No. Contributors open your public link, enter their name and phone, and pay. Their details are saved on their device for next time.",
  },
  {
    q: "What does Korvio charge?",
    a: `Korvio takes a ${PLATFORM_FEE_PERCENT_LABEL} service fee when you cash out. Contributors pay nothing extra — they send exactly the amount they choose. The fee is shown clearly before you confirm a cash-out.`,
  },
  {
    q: "How do I receive the money?",
    a: "Every contribution goes into your campaign wallet on the dashboard. When the campaign is closed, request a cash-out to MTN MoMo or Airtel Money. We send you the wallet balance minus the Korvio service fee.",
  },
  {
    q: "Do contributors pay anything to Korvio?",
    a: "No. Contributors pay exactly what they choose at checkout. The service fee is deducted from the organizer at cash-out, not from the contributor.",
  },
  {
    q: "Can people see how much others gave?",
    a: "You control visibility. By default individual amounts stay private. Contributors can opt in to show their name or amount on the public page.",
  },
];

const CATEGORIES = Object.entries(CATEGORY_LABELS).slice(0, 8);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PublicHeader showLandingNav />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 md:px-8 md:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="animate-rise">
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
                Built for group giving in Uganda
              </p>
              <h1 className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-[var(--ink)] md:text-5xl lg:text-6xl">
                The easiest way to
                <span className="text-[var(--brand)]"> pool money together</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--ink-soft)]">
                When your cause needs help from more than your immediate circle, Korvio gives you a
                real page with one shareable link. Collect pledges and payments online while keeping
                the group informed.
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
              <p className="mt-4 text-sm text-[var(--ink-soft)]">
                MTN MoMo · Airtel Money · Card · Free to start
              </p>
            </div>

            <div className="animate-rise-delay">
              <div className="card mx-auto max-w-sm overflow-hidden p-0 lg:ml-auto">
                <div className="hero-gradient px-6 py-8 text-white">
                  <p className="text-sm opacity-90">Weekend in Jinja 🏖️</p>
                  <p className="mt-2 text-3xl font-bold">UGX 487,500</p>
                  <p className="mt-1 text-sm opacity-80">collected of 600,000 goal</p>
                </div>
                <div className="space-y-4 p-6">
                  <ProgressBar value={81} />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--ink-soft)]">12 contributors</span>
                    <span className="font-semibold text-[var(--brand)]">81% funded</span>
                  </div>
                  <div className="space-y-2 border-t border-[var(--line)] pt-4">
                    {[
                      { name: "Grace N.", amount: "+120K" },
                      { name: "Brian K.", amount: "+80K" },
                      { name: "Diana M.", amount: "+50K" },
                    ].map((row) => (
                      <div key={row.name} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-[var(--ink)]">{row.name}</span>
                        <span className="font-semibold text-[var(--success)]">{row.amount}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" size="lg">
                    Contribute now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 border-t border-[var(--line)] bg-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--ink)] md:text-4xl">
              Three simple steps
            </h2>
            <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
              Korvio helps you collect contributions, track every payment, and keep your group aligned.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((item) => (
                <article key={item.step} className="card p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-[var(--ink)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Why Korvio */}
        <section id="why-korvio" className="scroll-mt-20 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              Why Korvio
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--ink)] md:text-4xl">
              Less chasing. More contributing.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
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
        <section className="border-t border-[var(--line)] bg-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              Cultural fit
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--ink)] md:text-4xl">
              Built for the way you already pool money
            </h2>
            <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
              Korvio does not replace the WhatsApp group. It carries the pieces that always fall apart.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <article className="card p-6">
                <h3 className="text-lg font-bold text-[var(--ink)]">Today, on WhatsApp</h3>
                <ul className="mt-4 space-y-3 text-sm text-[var(--ink-soft)]">
                  <li>· Numbered lists in the group chat — names, amounts, ticks and circles</li>
                  <li>· Mixed cash and mobile money tracked by hand</li>
                  <li>· The coordinator reposts the running total every few hours</li>
                </ul>
              </article>
              <article className="card border-[color-mix(in_srgb,var(--brand)_20%,white)] p-6">
                <h3 className="text-lg font-bold text-[var(--brand)]">With Korvio</h3>
                <ul className="mt-4 space-y-3 text-sm text-[var(--ink-soft)]">
                  <li>· Live updates whenever someone contributes</li>
                  <li>· Track money and pledges in one shared view</li>
                  <li>· One link to share everywhere, always up to date</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section id="trust" className="scroll-mt-20 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              Trust
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--ink)] md:text-4xl">
              How your money is protected
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  label: "Licensed checkout",
                  title: "Flutterwave payments",
                  body: "Contributors pay through a licensed payment gateway. Card and mobile money supported.",
                },
                {
                  label: "Transparency",
                  title: "Every flow visible to the group",
                  body: "Contributions appear on the campaign page. Treasurers see a full audit trail in the dashboard.",
                },
                {
                  label: "Privacy",
                  title: "You control what is public",
                  body: "Hide individual amounts, allow anonymous giving, or let supporters share words of encouragement.",
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
        <section id="pricing" className="scroll-mt-20 border-t border-[var(--line)] bg-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              Pricing
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--ink)] md:text-4xl">
              Simple pricing, transparent every step
            </h2>
            <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
              Free to start. Contributors never pay extra. Korvio takes{" "}
              <strong className="text-[var(--ink)]">{PLATFORM_FEE_PERCENT_LABEL}</strong> when you
              cash out to mobile money.
            </p>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="grid gap-4 sm:grid-cols-2">
                <article className="card p-6">
                  <p className="text-sm font-medium text-[var(--ink-soft)]">Create a campaign</p>
                  <p className="mt-2 text-4xl font-bold text-[var(--brand)]">UGX 0</p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    Nothing to pay to start or manage your campaign.
                  </p>
                </article>
                <article className="card p-6">
                  <p className="text-sm font-medium text-[var(--ink-soft)]">For contributors</p>
                  <p className="mt-2 text-4xl font-bold text-[var(--brand)]">UGX 0</p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    They send exactly what they choose. No platform fee at checkout.
                  </p>
                </article>
                <article className="card border-[color-mix(in_srgb,var(--brand)_25%,white)] p-6 sm:col-span-2">
                  <p className="text-sm font-medium text-[var(--ink-soft)]">
                    Korvio service fee at cash-out
                  </p>
                  <p className="mt-2 text-5xl font-bold text-[var(--brand)]">
                    {PLATFORM_FEE_PERCENT_LABEL}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
                    Taken once when you withdraw from your campaign wallet to mobile money. Mobile
                    money network costs are included — the amount shown below is what lands on your
                    phone.
                  </p>
                </article>
              </div>

              <article className="card p-6">
                <h3 className="text-lg font-bold text-[var(--ink)]">Cash-out calculator</h3>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  If your campaign wallet holds:
                </p>
                <ul className="mt-4 space-y-3">
                  {PRICING_EXAMPLES.map((amount) => {
                    const { platformFee, netAmount } = calculateCashoutNet(amount);
                    return (
                      <li
                        key={amount}
                        className="rounded-xl bg-[var(--bg)] px-4 py-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-[var(--ink)]">
                            {formatMoney(amount, "UGX")}
                          </span>
                          <span className="text-[var(--ink-soft)]">collected</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3 text-[var(--ink-soft)]">
                          <span>− {formatMoney(platformFee, "UGX")} fee</span>
                          <span className="font-bold text-[var(--success)]">
                            → {formatMoney(netAmount, "UGX")} to you
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
        <section id="faq" className="scroll-mt-20 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-4 md:px-8">
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              FAQ
            </p>
            <h2 className="mt-2 text-center text-3xl font-bold text-[var(--ink)] md:text-4xl">
              Questions, answered
            </h2>
            <dl className="mt-10 space-y-4">
              {FAQ.map((item) => (
                <div key={item.q} className="card p-5">
                  <dt className="font-semibold text-[var(--ink)]">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Categories */}
        <section className="border-t border-[var(--line)] bg-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              Categories
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--ink)] md:text-4xl">
              Pool money for any cause
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CATEGORIES.map(([key, label]) => (
                <Link
                  key={key}
                  href="/register"
                  className="card p-5 transition hover:border-[var(--brand)] hover:shadow-md"
                >
                  <h3 className="font-semibold text-[var(--ink)]">{label}</h3>
                  <p className="mt-1 text-xs text-[var(--brand)]">Start a campaign →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="hero-gradient py-16 text-white md:py-20">
          <div className="mx-auto max-w-2xl px-4 text-center md:px-8">
            <h2 className="text-3xl font-bold md:text-4xl">Ready when you are</h2>
            <p className="mt-3 text-white/85">
              Start a campaign in minutes. Free to set up, no payment details required to begin.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="bg-white text-[var(--brand)] hover:bg-white/90">
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
