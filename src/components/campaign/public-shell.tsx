import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
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
    <footer className="border-t border-[var(--line)] bg-white py-10">
      <div className="mx-auto max-w-6xl px-4 text-center md:px-8">
        <Logo className="justify-center" />
        <p className="mt-3 text-sm text-[var(--ink-soft)]">
          Collect pledges and payments for your group — privately and transparently.
        </p>
        <p className="mt-6 text-xs text-[var(--ink-soft)]/70">
          © {new Date().getFullYear()} Korvio · Powered by licensed payment rails
        </p>
      </div>
    </footer>
  );
}
