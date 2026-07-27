import { FlutterwavePaymentProvider } from "./flutterwave-provider";
import { MockPaymentProvider } from "./mock-provider";
import { PawapayPaymentProvider } from "./pawapay/provider";
import type { PaymentProvider } from "./types";

let provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;

  const name = process.env.PAYMENT_PROVIDER || "mock";
  switch (name) {
    case "flutterwave":
      provider = new FlutterwavePaymentProvider();
      break;
    case "pawapay":
      provider = new PawapayPaymentProvider();
      break;
    case "mock":
    default:
      provider = new MockPaymentProvider();
      break;
  }

  return provider;
}

export type { PaymentProvider, InitiatePaymentInput, WebhookResult } from "./types";
