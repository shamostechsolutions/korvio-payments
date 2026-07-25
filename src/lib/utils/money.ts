/** Money is stored as integer minor units (e.g. UGX has no minor unit → store as whole shillings). */

export function parseMoneyInput(value: string | number): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.round(value);
  }

  let cleaned = value.replace(/,/g, "").trim().toLowerCase();
  cleaned = cleaned.replace(/^(ugx|kes|tzs|usd|shs?)\s*/i, "").trim();

  const kMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*k$/);
  if (kMatch) {
    const amount = parseFloat(kMatch[1]) * 1000;
    return amount > 0 ? Math.round(amount) : null;
  }

  const mMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*m$/);
  if (mMatch) {
    const amount = parseFloat(mMatch[1]) * 1_000_000;
    return amount > 0 ? Math.round(amount) : null;
  }

  if (/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    const amount = Number(cleaned);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return Math.round(amount);
  }

  return null;
}

export function formatMoney(amount: number, currency = "UGX"): string {
  const formatted = new Intl.NumberFormat("en-UG", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${currency} ${formatted}`;
}

export function daysRemaining(deadline: Date, from = new Date()): number {
  const ms = deadline.getTime() - from.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
