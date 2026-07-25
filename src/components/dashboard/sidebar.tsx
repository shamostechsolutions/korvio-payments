"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "overview", label: "Overview" },
  { href: "contributors", label: "Contributors" },
  { href: "payments", label: "Payments" },
  { href: "expenses", label: "Expenses" },
  { href: "budget", label: "Budget" },
  { href: "updates", label: "WhatsApp updates" },
  { href: "reminders", label: "Reminders" },
  { href: "reports", label: "Reports" },
  { href: "admins", label: "Administrators" },
  { href: "settings", label: "Settings" },
  { href: "activity", label: "Activity log" },
];

export function DashboardSidebar({
  campaignId,
  campaignName,
}: {
  campaignId?: string;
  campaignName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="surface flex h-full w-full flex-col rounded-3xl p-4 md:w-64">
      <Logo />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
        Dashboard
      </p>
      <nav className="mt-3 flex flex-col gap-1">
        <Link
          href="/dashboard"
          className={cn(
            "rounded-xl px-3 py-2 text-sm font-medium",
            pathname === "/dashboard"
              ? "bg-[var(--brand)] text-white"
              : "text-[var(--ink-soft)] hover:bg-white",
          )}
        >
          All campaigns
        </Link>
        <Link
          href="/dashboard/new"
          className={cn(
            "rounded-xl px-3 py-2 text-sm font-medium",
            pathname === "/dashboard/new"
              ? "bg-[var(--brand)] text-white"
              : "text-[var(--ink-soft)] hover:bg-white",
          )}
        >
          New campaign
        </Link>
      </nav>

      {campaignId ? (
        <>
          <p className="mt-6 truncate text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
            {campaignName || "Campaign"}
          </p>
          <nav className="mt-3 flex flex-1 flex-col gap-1 overflow-auto">
            {links.map((link) => {
              const href = `/dashboard/campaigns/${campaignId}/${link.href}`;
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={link.href}
                  href={href}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium",
                    active
                      ? "bg-[var(--brand)] text-white"
                      : "text-[var(--ink-soft)] hover:bg-white",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </>
      ) : (
        <div className="flex-1" />
      )}

      <Button variant="ghost" className="mt-4 justify-start" onClick={logout}>
        Log out
      </Button>
    </aside>
  );
}
