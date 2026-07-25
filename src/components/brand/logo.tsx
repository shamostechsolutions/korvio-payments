import { cn } from "@/lib/utils/cn";

export function Logo({
  className,
  compact = false,
  dark = false,
}: {
  className?: string;
  compact?: boolean;
  dark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-bold text-[var(--accent)]">
        K
      </span>
      {!compact ? (
        <span
          className={cn(
            "font-[family-name:var(--font-display)] text-xl font-800 tracking-tight",
            dark ? "text-[var(--dash-ink)]" : "text-[var(--brand)]",
          )}
        >
          Korvio
        </span>
      ) : null}
    </div>
  );
}
