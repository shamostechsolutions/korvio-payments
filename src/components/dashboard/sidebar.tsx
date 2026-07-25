"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CreditCard,
  Globe,
  LayoutDashboard,
  LogOut,
  Plus,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useDashNavigate, useDashNavigateClick } from "@/components/dashboard/dash-shell";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { cn } from "@/lib/utils/cn";

const campaignLinks = [
  { href: "overview", label: "Overview", icon: LayoutDashboard },
  { href: "contributors", label: "Contributors", icon: Users },
  { href: "payments", label: "Payments", icon: CreditCard },
  { href: "wallet", label: "Wallet & cash-out", icon: Wallet },
  { href: "settings", label: "Public page", icon: Globe },
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
  const onNavigate = useDashNavigate();
  const onNavigateClick = useDashNavigateClick();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.isPlatformAdmin) setIsPlatformAdmin(true);
      });
  }, []);

  async function confirmLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      onNavigate?.();
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
      setLogoutOpen(false);
    }
  }

  return (
    <>
      <aside className="dash-sidebar flex h-full min-h-screen w-full flex-col md:h-screen md:w-[240px]">
        <div className="hidden border-b border-[var(--dash-border)] px-4 py-5 md:block">
          <Logo />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--dash-muted)]">
            Menu
          </p>
          <nav className="space-y-0.5">
            <Link
              href="/dashboard"
              onClick={onNavigateClick}
              className={cn("dash-nav-item", pathname === "/dashboard" && "active")}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              All campaigns
            </Link>
            <Link
              href="/dashboard/new"
              onClick={onNavigateClick}
              className={cn("dash-nav-item", pathname === "/dashboard/new" && "active")}
            >
              <Plus className="h-4 w-4 shrink-0" />
              New campaign
            </Link>
            {isPlatformAdmin ? (
              <Link
                href="/admininterface"
                onClick={onNavigateClick}
                className={cn(
                  "dash-nav-item mt-2 border border-teal-500/20",
                  pathname.startsWith("/admininterface") && "active",
                )}
              >
                <Shield className="h-4 w-4 shrink-0" />
                Platform admin
              </Link>
            ) : null}
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
                      onClick={onNavigateClick}
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
            onClick={() => setLogoutOpen(true)}
            className="dash-nav-item w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      <ConfirmModal
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Log out?"
        description="You'll need to sign in again to access your campaigns."
        confirmLabel="Log out"
        variant="danger"
        loading={loggingOut}
        onConfirm={confirmLogout}
      />
    </>
  );
}
