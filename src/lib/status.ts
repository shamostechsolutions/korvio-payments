import type { ContributorStatus } from "@prisma/client";

export const PUBLIC_STATUS_LABELS: Record<string, string> = {
  NOT_JOINED: "⚪ Not yet paid",
  JOINED: "⚪ Not yet paid",
  NOT_YET_PLEDGED: "⚪ Not yet paid",
  PLEDGED: "🤝 Pledged",
  PAYMENT_PENDING: "⏳ Payment pending",
  PARTIALLY_PAID: "🟡 Partially paid",
  FULLY_PAID: "✅ Fully paid",
  PAID_WITHOUT_PLEDGE: "✅ Fully paid",
  OVERPAID: "✅ Fully paid",
  PAYMENT_FAILED: "⚪ Not yet paid",
  WAIVED: "✅ Fully paid",
  ANONYMOUS: "✅ Fully paid",
  IN_KIND: "🎁 In-kind contribution",
  REFUNDED: "⚪ Not yet paid",
  CANCELLED: "⚪ Not yet paid",
};

export function publicStatusLabel(status: ContributorStatus): string {
  return PUBLIC_STATUS_LABELS[status] ?? "⚪ Not yet paid";
}

export function deriveContributorStatus(input: {
  pledgedAmount: number;
  paidAmount: number;
  hasPendingPayment?: boolean;
  isInKind?: boolean;
  anonymous?: boolean;
}): ContributorStatus {
  const { pledgedAmount, paidAmount, hasPendingPayment, isInKind, anonymous } = input;

  if (isInKind) return "IN_KIND";
  if (anonymous && paidAmount > 0) return "ANONYMOUS";
  if (hasPendingPayment) return "PAYMENT_PENDING";

  if (pledgedAmount <= 0 && paidAmount <= 0) return "NOT_YET_PLEDGED";
  if (pledgedAmount <= 0 && paidAmount > 0) return "PAID_WITHOUT_PLEDGE";
  if (paidAmount <= 0 && pledgedAmount > 0) return "PLEDGED";
  if (paidAmount > 0 && paidAmount < pledgedAmount) return "PARTIALLY_PAID";
  if (paidAmount === pledgedAmount) return "FULLY_PAID";
  if (paidAmount > pledgedAmount) return "OVERPAID";

  return "JOINED";
}
