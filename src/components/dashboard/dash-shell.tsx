"use client";

import { createContext, useContext, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils/cn";

const DashNavContext = createContext<(() => void) | null>(null);

export function useDashNavigate() {
  return useContext(DashNavContext);
}

export function DashShell({
  sidebar,
  children,
  className,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <DashNavContext.Provider value={close}>
      <div className={cn("dashboard-theme flex min-h-screen flex-col md:flex-row", className)}>
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-[var(--dash-border)] bg-[var(--dash-sidebar)] px-4 py-3 md:hidden">
          <Logo />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg p-2 text-[var(--dash-muted)] transition hover:bg-[var(--dash-card-hover)] hover:text-[var(--dash-ink)]"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {open ? (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={close}
          />
        ) : null}

        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[min(280px,85vw)] transform transition-transform duration-200 ease-out md:static md:z-auto md:w-[240px] md:shrink-0 md:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          {sidebar}
        </div>

        <main className="min-w-0 flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </DashNavContext.Provider>
  );
}
