import type { PaymentMethod } from "@prisma/client";

/**
 * PawaPay Uganda disbursement fees (merchant / platform pays when sending payout).
 * @see https://www.pawapay.io/fees — Uganda MTN & Airtel disbursement tiers
 */
export function estimateUgandaPayoutFee(
  payoutAmount: number,
  method: PaymentMethod = "MTN_MOMO",
): number {
  if (payoutAmount <= 0) return 0;

  let fixed = 0;
  if (method === "AIRTEL_MONEY") {
    if (payoutAmount < 499) fixed = 0;
    else if (payoutAmount < 60_000) fixed = 300;
    else if (payoutAmount < 500_000) fixed = 600;
    else fixed = 1_000;
  } else {
    if (payoutAmount < 500) fixed = 0;
    else if (payoutAmount < 60_000) fixed = 300;
    else if (payoutAmount < 500_000) fixed = 600;
    else if (payoutAmount < 1_000_000) fixed = 1_000;
    else fixed = 1_200;
  }

  return fixed + Math.round(payoutAmount * 0.01);
}

export const MIN_ONLINE_CONTRIBUTION = Number(
  process.env.MIN_ONLINE_CONTRIBUTION ?? "5000",
);

export function validateOnlineContributionAmount(amount: number) {
  if (amount < MIN_ONLINE_CONTRIBUTION) {
    return `Minimum online contribution is UGX ${MIN_ONLINE_CONTRIBUTION.toLocaleString()}. Smaller amounts lose too much to MoMo network fees on the contributor side.`;
  }
  return null;
}
