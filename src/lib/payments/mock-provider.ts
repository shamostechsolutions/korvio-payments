import type { PaymentMethod, PaymentStatus } from "@prisma/client";
import { customAlphabet } from "nanoid";
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
  WebhookResult,
} from "./types";

const ref = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ0123456789", 12);

export class MockPaymentProvider implements PaymentProvider {
  name = "mock";

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return {
      providerReference: `MOCK-${ref()}`,
      status: "PENDING",
      message: `Payment request of ${input.currency} ${input.amount} sent to ${input.phoneNumber}. Approve on your phone (mock).`,
    };
  }

  async checkPaymentStatus(): Promise<PaymentStatus> {
    return "PENDING";
  }

  async processWebhook(headers: Headers, body: unknown): Promise<WebhookResult> {
    const payload = body as {
      eventId?: string;
      providerReference?: string;
      status?: PaymentStatus;
      amount?: number;
      providerFee?: number;
    };

    const secret = headers.get("x-korvio-signature");
    if (secret !== process.env.PAYMENT_WEBHOOK_SECRET) {
      throw new Error("Invalid webhook signature");
    }

    if (!payload.providerReference || !payload.eventId || !payload.status) {
      throw new Error("Invalid webhook payload");
    }

    return {
      eventId: payload.eventId,
      providerReference: payload.providerReference,
      status: payload.status,
      amount: payload.amount,
      providerFee: payload.providerFee ?? 0,
      raw: body,
    };
  }

  async initiateRefund() {
    return { status: "REFUNDED" as PaymentStatus };
  }

  calculateFees(amount: number, method: PaymentMethod) {
    const providerRate =
      method === "CARD" ? 0.029 : method === "BANK" ? 0.01 : 0.015;
    const providerFee = Math.round(amount * providerRate);
    const platformFee = Math.round(amount * 0.01);
    return { providerFee, platformFee };
  }

  async verifyPhoneNumber(phoneNumber: string) {
    return /^\d{10,15}$/.test(phoneNumber.replace(/\D/g, ""));
  }
}
