import type { PaymentMethod } from "@prisma/client";

export function pawapayApiBaseUrl() {
  const env = process.env.PAWAPAY_ENV ?? "sandbox";
  return env === "production"
    ? "https://api.pawapay.io"
    : "https://api.sandbox.pawapay.io";
}

export function pawapayApiToken() {
  const token = process.env.PAWAPAY_API_TOKEN;
  if (!token) {
    throw new Error("PAWAPAY_API_TOKEN is not configured");
  }
  return token;
}

export function pawapayDefaultCountry() {
  return process.env.PAWAPAY_DEFAULT_COUNTRY ?? "UGA";
}

export function pawapayDefaultCurrency() {
  return process.env.PAWAPAY_DEFAULT_CURRENCY ?? "UGX";
}

export function pawapayProviderForMethod(method: PaymentMethod): string {
  switch (method) {
    case "AIRTEL_MONEY":
      return process.env.PAWAPAY_AIRTEL_PROVIDER ?? "AIRTEL_OAPI_UGA";
    case "MTN_MOMO":
    default:
      return process.env.PAWAPAY_MTN_PROVIDER ?? "MTN_MOMO_UGA";
  }
}

export function pawapayAppUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function pawapayCallbacksEnabled() {
  return process.env.PAWAPAY_CALLBACK_SIGNATURES === "true";
}

export function isPawapayPayoutsEnabled() {
  return process.env.PAYMENT_PROVIDER === "pawapay" && Boolean(process.env.PAWAPAY_API_TOKEN);
}

/** PawaPay expects whole-number amounts for UGX. */
export function formatPawapayAmount(amount: number, currency = pawapayDefaultCurrency()) {
  if (currency === "UGX") {
    return String(Math.round(amount));
  }
  return (amount / 100).toFixed(2);
}

export function normalizeUgandaPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("256")) return digits;
  if (digits.startsWith("0")) return `256${digits.slice(1)}`;
  if (digits.length === 9) return `256${digits}`;
  return digits;
}
