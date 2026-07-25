import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { PublicFooter, PublicHeader } from "@/components/campaign/public-shell";
import { ProgressBar } from "@/components/campaign/progress-bar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PublicHeader />

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 md:px-8 md:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="animate-rise">
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
                Group contributions, simplified
              </p>
              <h1 className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-[var(--ink)] md:text-5xl lg:text-6xl">
                Pool money for anything.
                <span className="text-[var(--brand)]"> Track everything.</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--ink-soft)]">
                Weddings, medical bills, office collections, family support — share one link,
                collect pledges and payments online. Like{" "}
                <a href="https://senteme.com/en" className="font-medium text-[var(--brand)]">
                  SenteMe
                </a>
                , built for Uganda.
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
              <p className="mt-6 text-sm text-[var(--ink-soft)]">
                MTN MoMo · Airtel Money · Card · No WhatsApp required
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

        <section className="border-t border-[var(--line)] bg-white py-16">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Share a link",
                  body: "Create a campaign, share the public page with your group on WhatsApp, email, or anywhere.",
                },
                {
                  title: "Collect privately",
                  body: "Contributors pay online. The group sees names and progress — not individual amounts unless shared.",
                },
                {
                  title: "Stay accountable",
                  body: "Treasurer dashboard, expenses, reports, and full audit trail for every payment.",
                },
              ].map((item) => (
                <article key={item.title} className="card p-6">
                  <h2 className="text-lg font-bold text-[var(--ink)]">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
