import { cn } from "@/lib/utils/cn";

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("surface rounded-2xl p-4", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--brand)]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-[var(--ink-soft)]">{hint}</p> : null}
    </div>
  );
}
