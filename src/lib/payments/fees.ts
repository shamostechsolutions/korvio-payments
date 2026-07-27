import type { PaymentMethod } from "@prisma/client";
import { estimateUgandaPayoutFee } from "@/lib/payments/provider-fees";

/** All-in withdrawal fee — includes Korvio service + MoMo transfer to organiser. */
export const PLATFORM_FEE_RATE = Number(process.env.PLATFORM_FEE_RATE ?? "0.05");

export const PLATFORM_FEE_PERCENT_LABEL = `${(PLATFORM_FEE_RATE * 100).toFixed(1).replace(/\.0$/, "")}%`;

export function calculatePlatformFee(grossAmount: number) {
  return Math.round(grossAmount * PLATFORM_FEE_RATE);
}

export function calculateCashoutNet(grossAmount: number) {
  const platformFee = calculatePlatformFee(grossAmount);
  return { platformFee, netAmount: grossAmount - platformFee };
}

/** Preview for organisers — netAmount is what lands on their MoMo; rail fee is absorbed from the platform fee. */
export function calculateCashoutPreview(
  grossAmount: number,
  payoutMethod: PaymentMethod = "MTN_MOMO",
) {
  const { platformFee, netAmount } = calculateCashoutNet(grossAmount);
  const estimatedPayoutRailFee = estimateUgandaPayoutFee(netAmount, payoutMethod);
  return {
    platformFee,
    netAmount,
    estimatedPayoutRailFee,
    estimatedKorvioMargin: platformFee - estimatedPayoutRailFee,
  };
}
