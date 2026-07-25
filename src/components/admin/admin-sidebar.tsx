"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Shield,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/admininterface", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admininterface/campaigns", label: "Campaigns", icon: FolderKanban },
  { href: "/admininterface/cashouts", label: "Cash-outs", icon: ArrowLeftRight },
];

export function AdminSidebar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login?redirect=/admininterface");
    router.refresh();
  }

  return (
    <aside className="dash-sidebar flex h-screen w-full shrink-0 flex-col md:w-[240px]">
      <div className="border-b border-[var(--dash-border)] px-4 py-5">
        <Logo />
        <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-teal-400">
          <Shield className="h-3 w-3" />
          Platform admin
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
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
        <Link href="/dashboard" className="dash-nav-item mb-1">
          Organiser dashboard
        </Link>
        <button type="button" onClick={() => void logout()} className="dash-nav-item w-full">
          <LogOut className="h-4 w-4 shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  );
}
