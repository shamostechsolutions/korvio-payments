import { formatMoney } from "@/lib/utils/money";

type Point = { label: string; amount: number };

export function ContributionBars({
  points,
  currency,
  maxAmount,
}: {
  points: Point[];
  currency: string;
  maxAmount: number;
}) {
  const peak = maxAmount || Math.max(...points.map((p) => p.amount), 1);

  return (
    <div className="flex h-48 items-end gap-2 pt-4">
      {points.map((point) => {
        const height = peak > 0 ? Math.max(4, (point.amount / peak) * 100) : 4;
        return (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative flex w-full flex-1 items-end justify-center">
              <div
                className="w-full max-w-[2.5rem] rounded-t-md bg-gradient-to-t from-teal-600 to-teal-400 transition-all"
                style={{ height: `${height}%` }}
                title={
                  point.amount > 0 ? formatMoney(point.amount, currency) : "No payments"
                }
              />
            </div>
            <span className="text-[10px] font-medium text-[var(--dash-muted)]">
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
