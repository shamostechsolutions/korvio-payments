import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { KorvioDisclaimer } from "@/components/legal/disclaimer";

const LANDING_NAV = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#why-korvio", label: "Why Korvio" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function PublicHeader({ showLandingNav = false }: { showLandingNav?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>
        {showLandingNav ? (
          <nav className="hidden items-center gap-6 md:flex">
            {LANDING_NAV.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--ink-soft)] transition hover:text-[var(--brand-soft)]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Start a campaign</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--bg-elevated)] py-10">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <Logo />
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[var(--ink-soft)]">
            {LANDING_NAV.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-[var(--brand-soft)]">
                {link.label}
              </a>
            ))}
            <Link href="/login" className="hover:text-[var(--brand-soft)]">
              Log in
            </Link>
            <Link href="/register" className="hover:text-[var(--brand-soft)]">
              Start a campaign
            </Link>
          </nav>
        </div>
        <p className="mt-6 text-center text-sm text-[var(--ink-soft)] md:text-left">
          Collect pledges and payments for your group — privately and transparently.
        </p>
        <div className="mt-6 max-w-3xl">
          <KorvioDisclaimer />
        </div>
        <p className="mt-4 text-center text-xs text-[var(--ink-soft)]/70 md:text-left">
          © {new Date().getFullYear()} Korvio · Powered by licensed payment rails
        </p>
      </div>
    </footer>
  );
}
