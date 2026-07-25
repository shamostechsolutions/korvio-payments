import type { PaymentMethod, PaymentStatus } from "@prisma/client";
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
  WebhookResult,
} from "./types";

const FLW_API = "https://api.flutterwave.com/v3";

type FlutterwavePaymentResponse = {
  status: string;
  message: string;
  data?: { link?: string; id?: number };
};

type FlutterwaveWebhookPayload = {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref?: string;
    status: string;
    amount: number;
    app_fee?: number;
    currency?: string;
  };
};

function appUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function secretKey() {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) {
    throw new Error("FLUTTERWAVE_SECRET_KEY is not configured");
  }
  return key;
}

function mapFlutterwaveStatus(status: string): PaymentStatus {
  switch (status.toLowerCase()) {
    case "successful":
      return "SUCCESSFUL";
    case "failed":
      return "FAILED";
    case "cancelled":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

export class FlutterwavePaymentProvider implements PaymentProvider {
  name = "flutterwave";

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const email =
      input.customerEmail ||
      `${input.phoneNumber.replace(/\D/g, "")}@contributors.korvio.app`;
    const name = input.customerName || "Contributor";

    const response = await fetch(`${FLW_API}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: input.reference,
        amount: input.amount,
        currency: input.currency,
        redirect_url: `${appUrl()}/pay/complete?tx_ref=${encodeURIComponent(input.reference)}`,
        payment_options: "mobilemoneyuganda,card,banktransfer",
        customer: {
          email,
          phonenumber: input.phoneNumber.replace(/\D/g, ""),
          name,
        },
        customizations: {
          title: input.campaignName || "Korvio contribution",
          description: "Campaign contribution",
        },
        meta: {
          campaign_id: input.campaignId,
          contributor_id: input.contributorId,
        },
      }),
    });

    const payload = (await response.json()) as FlutterwavePaymentResponse;

    if (!response.ok || payload.status !== "success" || !payload.data?.link) {
      throw new Error(
        payload.message || "Unable to create Flutterwave checkout link",
      );
    }

    return {
      providerReference: input.reference,
      status: "PENDING",
      checkoutUrl: payload.data.link,
    };
  }

  async checkPaymentStatus(providerReference: string): Promise<PaymentStatus> {
    const response = await fetch(
      `${FLW_API}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(providerReference)}`,
      {
        headers: { Authorization: `Bearer ${secretKey()}` },
      },
    );

    const payload = (await response.json()) as {
      status: string;
      data?: { status?: string };
    };

    if (!response.ok || payload.status !== "success" || !payload.data?.status) {
      return "PENDING";
    }

    return mapFlutterwaveStatus(payload.data.status);
  }

  async processWebhook(headers: Headers, body: unknown): Promise<WebhookResult> {
    const hash = headers.get("verif-hash");
    const expectedHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;

    if (expectedHash) {
      if (hash !== expectedHash) {
        throw new Error("Invalid Flutterwave webhook signature");
      }
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("FLUTTERWAVE_WEBHOOK_HASH is required in production");
    } else {
      console.warn(
        "[flutterwave] FLUTTERWAVE_WEBHOOK_HASH not set — skipping webhook verification (dev only)",
      );
    }

    const payload = body as FlutterwaveWebhookPayload;

    if (!payload.data?.tx_ref || !payload.data?.id) {
      throw new Error("Invalid Flutterwave webhook payload");
    }

    if (payload.event !== "charge.completed" && payload.event !== "charge.failed") {
      throw new Error(`Unsupported Flutterwave event: ${payload.event}`);
    }

    return {
      eventId: String(payload.data.id),
      providerReference: payload.data.tx_ref,
      status: mapFlutterwaveStatus(payload.data.status),
      amount: payload.data.amount,
      providerFee: payload.data.app_fee ?? 0,
      raw: body,
    };
  }

  async initiateRefund() {
    return { status: "REFUNDED" as PaymentStatus };
  }

  calculateFees(amount: number, method: PaymentMethod) {
    const providerRate =
      method === "CARD" ? 0.038 : method === "BANK" ? 0.01 : 0.014;
    const providerFee = Math.round(amount * providerRate);
    const platformFee = Math.round(amount * 0.01);
    return { providerFee, platformFee };
  }

  async verifyPhoneNumber(phoneNumber: string) {
    return /^\d{10,15}$/.test(phoneNumber.replace(/\D/g, ""));
  }
}
