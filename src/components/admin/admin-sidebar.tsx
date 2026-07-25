"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeftRight,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Shield,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useDashNavigate } from "@/components/dashboard/dash-shell";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/admininterface", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admininterface/campaigns", label: "Campaigns", icon: FolderKanban },
  { href: "/admininterface/cashouts", label: "Cash-outs", icon: ArrowLeftRight },
];

export function AdminSidebar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const onNavigate = useDashNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function confirmLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      onNavigate?.();
      router.push("/admininterface/login");
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
          <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-teal-400">
            <Shield className="h-3 w-3" />
            Platform admin
          </p>
        </div>
        <div className="border-b border-[var(--dash-border)] px-4 py-4 md:hidden">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-teal-400">
            <Shield className="h-3 w-3" />
            Platform admin
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn("dash-nav-item", active && "active")}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--dash-border)] px-3 py-4">
          {userName ? (
            <p className="mb-2 truncate px-3 text-xs text-[var(--dash-muted)]">{userName}</p>
          ) : null}
          <Link href="/dashboard" onClick={onNavigate} className="dash-nav-item mb-1">
            Organiser dashboard
          </Link>
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
        description="You'll need to sign in again to access the platform admin dashboard."
        confirmLabel="Log out"
        variant="danger"
        loading={loggingOut}
        onConfirm={confirmLogout}
      />
    </>
  );
}
