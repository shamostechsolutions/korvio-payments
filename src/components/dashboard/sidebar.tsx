"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  CreditCard,
  Globe,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Plus,
  Receipt,
  Settings,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils/cn";

const campaignLinks = [
  { href: "overview", label: "Overview", icon: LayoutDashboard },
  { href: "contributors", label: "Contributors", icon: Users },
  { href: "payments", label: "Payments", icon: CreditCard },
  { href: "wallet", label: "Wallet & cash-out", icon: Wallet },
  { href: "expenses", label: "Expenses", icon: Receipt },
  { href: "budget", label: "Budget", icon: BarChart3 },
  { href: "updates", label: "Group updates", icon: Megaphone },
  { href: "reminders", label: "Reminders", icon: Bell },
  { href: "reports", label: "Reports", icon: BarChart3 },
  { href: "admins", label: "Administrators", icon: Shield },
  { href: "settings", label: "Public page", icon: Globe },
  { href: "activity", label: "Activity log", icon: Activity },
];

export function DashboardSidebar({
  campaignId,
  campaignName,
  userName,
}: {
  campaignId?: string;
  campaignName?: string;
  userName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="dash-sidebar flex h-screen w-full shrink-0 flex-col md:w-[240px]">
      <div className="border-b border-[var(--dash-border)] px-4 py-5">
        <Logo dark />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--dash-muted)]">
          Menu
        </p>
        <nav className="space-y-0.5">
          <Link
            href="/dashboard"
            className={cn(
              "dash-nav-item",
              pathname === "/dashboard" && "active",
            )}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            All campaigns
          </Link>
          <Link
            href="/dashboard/new"
            className={cn(
              "dash-nav-item",
              pathname === "/dashboard/new" && "active",
            )}
          >
            <Plus className="h-4 w-4 shrink-0" />
            New campaign
          </Link>
        </nav>

        {campaignId ? (
          <>
            <p className="mb-2 mt-6 truncate px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--dash-muted)]">
              {campaignName || "Campaign"}
            </p>
            <nav className="space-y-0.5">
              {campaignLinks.map((link) => {
                const href = `/dashboard/campaigns/${campaignId}/${link.href}`;
                const active = pathname.startsWith(href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={href}
                    className={cn("dash-nav-item", active && "active")}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </>
        ) : null}
      </div>

      <div className="border-t border-[var(--dash-border)] p-3">
        {userName ? (
          <p className="mb-2 truncate px-3 text-xs text-[var(--dash-muted)]">{userName}</p>
        ) : null}
        <button
          type="button"
          onClick={() => void logout()}
          className="dash-nav-item w-full"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  );
}
