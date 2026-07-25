import { cn } from "@/lib/utils/cn";

export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-[var(--line)]", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--brand-soft)] transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
