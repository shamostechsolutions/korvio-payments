/** Korvio service fee — deducted from the organizer at cashout, not from contributors at checkout. */
export const PLATFORM_FEE_RATE = Number(process.env.PLATFORM_FEE_RATE ?? "0.065");

export const PLATFORM_FEE_PERCENT_LABEL = `${(PLATFORM_FEE_RATE * 100).toFixed(1).replace(/\.0$/, "")}%`;

export function calculatePlatformFee(grossAmount: number) {
  return Math.round(grossAmount * PLATFORM_FEE_RATE);
}

export function calculateCashoutNet(grossAmount: number) {
  const platformFee = calculatePlatformFee(grossAmount);
  return { platformFee, netAmount: grossAmount - platformFee };
}
