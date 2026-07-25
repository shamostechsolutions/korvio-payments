import type { PaymentMethod, PaymentStatus } from "@prisma/client";

export type InitiatePaymentInput = {
  amount: number;
  currency: string;
  phoneNumber: string;
  paymentMethod: PaymentMethod;
  reference: string;
  campaignId: string;
  contributorId: string;
  customerName?: string;
  customerEmail?: string;
  campaignName?: string;
  metadata?: Record<string, string>;
};

export type InitiatePaymentResult = {
  providerReference: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  message?: string;
};

export type WebhookResult = {
  eventId: string;
  providerReference: string;
  status: PaymentStatus;
  amount?: number;
  providerFee?: number;
  raw: unknown;
};

export interface PaymentProvider {
  name: string;
  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  checkPaymentStatus(providerReference: string): Promise<PaymentStatus>;
  processWebhook(headers: Headers, body: unknown): Promise<WebhookResult>;
  initiateRefund(providerReference: string, amount: number): Promise<{ status: PaymentStatus }>;
  calculateFees(amount: number, method: PaymentMethod): { providerFee: number; platformFee: number };
  verifyPhoneNumber(phoneNumber: string): Promise<boolean>;
}
