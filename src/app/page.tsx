import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="brand-pattern relative min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-16 pt-6 md:px-8">
        <header className="flex items-center justify-between animate-rise">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Start free</Button>
            </Link>
          </div>
        </header>

        <section className="relative mt-10 flex flex-1 flex-col justify-center md:mt-0">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_40%,rgba(11,61,50,0.12),transparent_45%)]" />
          <p className="animate-rise font-[family-name:var(--font-display)] text-5xl font-800 leading-[0.95] tracking-tight text-[var(--brand)] sm:text-6xl md:text-7xl lg:text-8xl">
            Korvio
          </p>
          <h1 className="animate-rise-delay mt-5 max-w-2xl text-2xl font-semibold leading-snug text-[var(--ink)] md:text-3xl">
            Your group talks on WhatsApp.
            <br />
            Korvio handles the contributions.
          </h1>
          <p className="mt-4 max-w-xl text-base text-[var(--ink-soft)] md:text-lg animate-rise-delay">
            Collect pledges, record payments, send private reminders and share
            clear progress updates — without exposing individual amounts in the
            group chat.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 animate-rise-delay">
            <Link href="/register">
              <Button size="lg">Create a campaign</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Open dashboard
              </Button>
            </Link>
            <Link href="/demo/chat">
              <Button size="lg" variant="ghost">
                Try WhatsApp buttons
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "WhatsApp-first",
              body: "Members join from a campaign link, pledge privately, and check balances without leaving WhatsApp.",
            },
            {
              title: "Private by default",
              body: "The group sees names and statuses. Individual amounts stay with contributors and authorised treasurers.",
            },
            {
              title: "Built for accountability",
              body: "Manual payments, expenses, reminders, group updates and downloadable reports in one place.",
            },
          ].map((item) => (
            <article key={item.title} className="surface rounded-2xl p-5">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-700 text-[var(--brand)]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                {item.body}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
