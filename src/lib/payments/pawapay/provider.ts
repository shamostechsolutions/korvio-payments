import { randomUUID } from "crypto";
import type { PaymentMethod, PaymentStatus } from "@prisma/client";
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
  WebhookResult,
} from "../types";
import { pawapayRequest } from "./client";
import {
  formatPawapayAmount,
  normalizeUgandaPhone,
  pawapayAppUrl,
  pawapayDefaultCountry,
  pawapayDefaultCurrency,
  pawapayProviderForMethod,
  sanitizePawapayCustomerMessage,
} from "./config";
import { mapPawapayCheckoutStatus, mapPawapayDepositStatus } from "./status";

type PawapayInitResponse = {
  checkoutId?: string;
  depositId?: string;
  status: string;
  redirectUrl?: string;
  failureReason?: { failureCode?: string; failureMessage?: string };
};

type PawapayCheckoutStatusResponse = {
  status: string;
  data?: {
    checkoutId: string;
    status: string;
    deposit?: {
      depositId: string;
      status: string;
      amount?: string;
    };
  };
};

type PawapayDepositCallback = {
  depositId: string;
  status: string;
  amount?: string;
  providerTransactionId?: string;
};

type PawapayCheckoutCallback = {
  checkoutId: string;
  status: string;
  deposit?: PawapayDepositCallback;
};

function parseAmount(value?: string) {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : undefined;
}

export class PawapayPaymentProvider implements PaymentProvider {
  name = "pawapay";

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const useDeposit = process.env.PAWAPAY_USE_DEPOSIT === "true";

    if (useDeposit) {
      return this.initiateDeposit(input);
    }

    return this.initiateCheckout(input);
  }

  private async initiateCheckout(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const checkoutId = randomUUID();
    const phone = normalizeUgandaPhone(input.phoneNumber);
    const provider = pawapayProviderForMethod(input.paymentMethod);
    const currency = input.currency || pawapayDefaultCurrency();
    const country = pawapayDefaultCountry();

    const payload = await pawapayRequest<PawapayInitResponse>("/v2/checkouts", {
      method: "POST",
      body: JSON.stringify({
        checkoutId,
        returnUrl: `${pawapayAppUrl()}/pay/complete?checkout_id=${encodeURIComponent(checkoutId)}`,
        returnMethod: "INSTANT",
        defaultLanguage: "en",
        countries: [country],
        expiresAfter: 30,
        amounts: [
          {
            country,
            currency,
            amount: formatPawapayAmount(input.amount, currency),
          },
        ],
        payer: {
          type: "MMO",
          accountDetails: {
            phoneNumber: phone,
            provider,
            allowCustomerToOverride: true,
          },
        },
        clientReferenceId: input.reference,
        reason: {
          en: (input.campaignName || "Korvio contribution").slice(0, 22).toUpperCase(),
        },
        metadata: [
          { campaignId: input.campaignId },
          { contributorId: input.contributorId },
          { reference: input.reference },
        ],
      }),
    });

    if (payload.status !== "ACCEPTED" || !payload.redirectUrl) {
      throw new Error(
        payload.failureReason?.failureMessage ||
          "PawaPay did not accept this checkout request",
      );
    }

    return {
      providerReference: checkoutId,
      status: "PENDING",
      checkoutUrl: payload.redirectUrl,
    };
  }

  private async initiateDeposit(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const depositId = randomUUID();
    const phone = normalizeUgandaPhone(input.phoneNumber);
    const provider = pawapayProviderForMethod(input.paymentMethod);
    const currency = input.currency || pawapayDefaultCurrency();

    const payload = await pawapayRequest<PawapayInitResponse>("/v2/deposits", {
      method: "POST",
      body: JSON.stringify({
        depositId,
        amount: formatPawapayAmount(input.amount, currency),
        currency,
        payer: {
          type: "MMO",
          accountDetails: {
            phoneNumber: phone,
            provider,
          },
        },
        clientReferenceId: input.reference,
        customerMessage: sanitizePawapayCustomerMessage(
          input.campaignName,
          "Korvio contribution",
        ),
      }),
    });

    if (payload.status !== "ACCEPTED") {
      throw new Error(
        payload.failureReason?.failureMessage ||
          "PawaPay did not accept this deposit request",
      );
    }

    return {
      providerReference: depositId,
      status: "PENDING",
      message: "Approve the payment on your phone when prompted.",
    };
  }

  async checkPaymentStatus(providerReference: string): Promise<PaymentStatus> {
    const verified = await this.verifyPaymentByReference(providerReference);
    return verified?.status ?? "PENDING";
  }

  async verifyPaymentByReference(reference: string): Promise<WebhookResult | null> {
    try {
      const payload = await pawapayRequest<PawapayCheckoutStatusResponse>(
        `/v2/checkouts/${encodeURIComponent(reference)}`,
      );

      if (payload.status !== "FOUND" || !payload.data) {
        return null;
      }

      const checkout = payload.data;

      return {
        eventId: checkout.deposit?.depositId ?? checkout.checkoutId,
        providerReference: checkout.checkoutId,
        status: mapPawapayCheckoutStatus(checkout.status),
        amount: parseAmount(checkout.deposit?.amount),
        raw: payload,
      };
    } catch {
      try {
        const deposit = await pawapayRequest<PawapayDepositCallback>(
          `/v2/deposits/${encodeURIComponent(reference)}`,
        );
        if (!deposit?.depositId) return null;
        return {
          eventId: deposit.providerTransactionId ?? deposit.depositId,
          providerReference: deposit.depositId,
          status: mapPawapayDepositStatus(deposit.status),
          amount: parseAmount(deposit.amount),
          raw: deposit,
        };
      } catch {
        return null;
      }
    }
  }

  async processWebhook(_headers: Headers, body: unknown): Promise<WebhookResult> {
    const payload = body as PawapayCheckoutCallback | PawapayDepositCallback;

    if ("checkoutId" in payload && payload.checkoutId) {
      const deposit = payload.deposit;
      return {
        eventId: deposit?.providerTransactionId ?? deposit?.depositId ?? payload.checkoutId,
        providerReference: payload.checkoutId,
        status: mapPawapayCheckoutStatus(payload.status),
        amount: parseAmount(deposit?.amount),
        raw: body,
      };
    }

    if ("depositId" in payload && payload.depositId) {
      return {
        eventId: payload.providerTransactionId ?? payload.depositId,
        providerReference: payload.depositId,
        status: mapPawapayDepositStatus(payload.status),
        amount: parseAmount(payload.amount),
        raw: body,
      };
    }

    throw new Error("Unrecognised PawaPay webhook payload");
  }

  async initiateRefund() {
    return { status: "REFUNDED" as PaymentStatus };
  }

  calculateFees(amount: number, _method: PaymentMethod) {
    return { providerFee: 0, platformFee: 0 };
  }

  async verifyPhoneNumber(phoneNumber: string) {
    const digits = normalizeUgandaPhone(phoneNumber);
    return /^256\d{9}$/.test(digits);
  }
}
