import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

export function DashStatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "brand",
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  accent?: "brand" | "success" | "warning";
  className?: string;
}) {
  const accentBg =
    accent === "success"
      ? "bg-emerald-500/10 text-emerald-400"
      : accent === "warning"
        ? "bg-amber-500/10 text-amber-400"
        : "bg-teal-500/10 text-teal-400";

  return (
    <div className={cn("dash-card p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="dash-stat-label">{label}</p>
          <p className="dash-stat-value mt-1 truncate">{value}</p>
          {hint ? (
            <p className="mt-2 text-xs leading-relaxed text-[var(--dash-muted)]">{hint}</p>
          ) : null}
        </div>
        {Icon ? (
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              accentBg,
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
