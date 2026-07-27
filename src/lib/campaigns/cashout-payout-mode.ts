import { isPawapayPayoutsEnabled } from "@/lib/payments/pawapay/config";

export type CashoutPayoutMode = "manual" | "automated" | "both";

export function getCashoutPayoutMode(): CashoutPayoutMode {
  const mode = (process.env.CASHOUT_PAYOUT_MODE ?? "both").toLowerCase();
  if (mode === "manual" || mode === "automated" || mode === "both") {
    return mode;
  }
  return "both";
}

export function canUseAutomatedCashoutPayouts() {
  const mode = getCashoutPayoutMode();
  return mode !== "manual" && isPawapayPayoutsEnabled();
}

export function canUseManualCashoutPayouts() {
  return getCashoutPayoutMode() !== "automated";
}

export function cashoutPayoutModeDescription() {
  const mode = getCashoutPayoutMode();
  const automated = canUseAutomatedCashoutPayouts();
  const manual = canUseManualCashoutPayouts();

  if (mode === "manual" || !automated) {
    return "Send MoMo yourself, then mark each cash-out paid manually.";
  }
  if (mode === "automated") {
    return "Approve each request to send automatically via PawaPay.";
  }
  return "Choose PawaPay or manual MoMo for each cash-out.";
}
