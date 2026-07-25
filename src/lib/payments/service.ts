import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { recalculateContributorAndCampaign } from "@/lib/campaigns/totals";
import { generateTransactionReference } from "@/lib/utils/codes";
import { getPaymentProvider } from "./index";
import type { PaymentMethod } from "@prisma/client";

export async function initiateContributorPayment(input: {
  campaignId: string;
  contributorId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  phoneNumber: string;
  recordedById?: string;
  manual?: boolean;
  notes?: string;
  proofUrl?: string;
  paymentDate?: Date;
  reference?: string;
}) {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: input.campaignId },
  });
  const contributor = await prisma.contributor.findUniqueOrThrow({
    where: { id: input.contributorId },
  });

  if (!campaign.allowPartialPayments && contributor.outstandingAmount > 0) {
    if (input.amount < contributor.outstandingAmount && contributor.pledgedAmount > 0) {
      throw new Error("Partial payments are disabled for this campaign");
    }
  }

  const provider = getPaymentProvider();

  const reference =
    input.reference || generateTransactionReference(campaign.campaignCode);

  if (input.manual) {
    const requiresVerification =
      campaign.manualPaymentVerifyThreshold != null &&
      input.amount >= campaign.manualPaymentVerifyThreshold;

    const payment = await prisma.payment.create({
      data: {
        campaignId: campaign.id,
        contributorId: contributor.id,
        transactionReference: reference,
        amount: input.amount,
        currency: campaign.currency,
        paymentMethod: input.paymentMethod,
        paymentProvider: "manual",
        paymentStatus: requiresVerification ? "PENDING" : "SUCCESSFUL",
        providerFee: 0,
        platformFee: 0,
        netAmount: input.amount,
        completedAt: requiresVerification ? null : input.paymentDate ?? new Date(),
        recordedById: input.recordedById,
        manualPayment: true,
        requiresVerification,
        proofUrl: input.proofUrl,
        notes: input.notes
          ? `${input.notes}\nRecorded manually`
          : "Recorded manually",
        payerPhone: input.phoneNumber,
      },
    });

    if (!requiresVerification) {
      await recalculateContributorAndCampaign(contributor.id);
    }

    await writeAuditLog({
      campaignId: campaign.id,
      userId: input.recordedById,
      action: "manual_payment_recorded",
      entityType: "payment",
      entityId: payment.id,
      newData: payment,
    });

    return { payment };
  }

  const initiation = await provider.initiatePayment({
    amount: input.amount,
    currency: campaign.currency,
    phoneNumber: input.phoneNumber,
    paymentMethod: input.paymentMethod,
    reference,
    campaignId: campaign.id,
    contributorId: contributor.id,
    customerName: contributor.displayName,
    customerEmail:
      contributor.email ??
      `${contributor.phoneNumber.replace(/\D/g, "")}@contributors.korvio.app`,
    campaignName: campaign.name,
  });

  const payment = await prisma.payment.create({
    data: {
      campaignId: campaign.id,
      contributorId: contributor.id,
      transactionReference: reference,
      providerReference: initiation.providerReference,
      amount: input.amount,
      currency: campaign.currency,
      paymentMethod: input.paymentMethod,
      paymentProvider: provider.name,
      paymentStatus: initiation.status,
      providerFee: 0,
      platformFee: 0,
      netAmount: input.amount,
      payerPhone: input.phoneNumber,
    },
  });

  await writeAuditLog({
    campaignId: campaign.id,
    action: "payment_initiated",
    entityType: "payment",
    entityId: payment.id,
    newData: payment,
  });

  return { payment, initiation };
}

export async function completePaymentFromWebhook(input: {
  provider: string;
  eventId: string;
  providerReference: string;
  status: string;
  providerFee?: number;
  raw: unknown;
}) {
  const existing = await prisma.webhookEvent.findUnique({
    where: {
      provider_eventId: {
        provider: input.provider,
        eventId: input.eventId,
      },
    },
  });

  if (existing?.processed) {
    return { duplicate: true as const };
  }

  await prisma.webhookEvent.upsert({
    where: {
      provider_eventId: {
        provider: input.provider,
        eventId: input.eventId,
      },
    },
    create: {
      provider: input.provider,
      eventId: input.eventId,
      eventType: String(input.status),
      payload: input.raw as object,
      processed: false,
    },
    update: {},
  });

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { providerReference: input.providerReference },
        { transactionReference: input.providerReference },
      ],
    },
  });

  if (!payment) {
    throw new Error("Payment not found for provider reference");
  }

  if (payment.paymentStatus === "SUCCESSFUL" || payment.paymentStatus === "FAILED") {
    await prisma.webhookEvent.update({
      where: {
        provider_eventId: {
          provider: input.provider,
          eventId: input.eventId,
        },
      },
      data: { processed: true, campaignId: payment.campaignId },
    });
    return { duplicate: true as const, payment };
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      paymentStatus: input.status as typeof payment.paymentStatus,
      providerFee: 0,
      completedAt: input.status === "SUCCESSFUL" ? new Date() : payment.completedAt,
      netAmount: payment.amount,
    },
  });

  if (input.status === "SUCCESSFUL") {
    await recalculateContributorAndCampaign(payment.contributorId);
  }

  await prisma.webhookEvent.update({
    where: {
      provider_eventId: {
        provider: input.provider,
        eventId: input.eventId,
      },
    },
    data: { processed: true, campaignId: payment.campaignId },
  });

  await writeAuditLog({
    campaignId: payment.campaignId,
    action: input.status === "SUCCESSFUL" ? "payment_completed" : "payment_failed",
    entityType: "payment",
    entityId: payment.id,
    previousData: payment,
    newData: updated,
  });

  return { duplicate: false as const, payment: updated };
}

export async function confirmPaymentOnReturn(txRef: string) {
  const provider = getPaymentProvider();
  if (provider.name !== "flutterwave" || !("verifyPaymentByReference" in provider)) {
    return null;
  }

  const verified = await (
    provider as { verifyPaymentByReference: (ref: string) => Promise<import("./types").WebhookResult | null> }
  ).verifyPaymentByReference(txRef);

  if (!verified) return null;

  await completePaymentFromWebhook({
    provider: provider.name,
    eventId: verified.eventId,
    providerReference: verified.providerReference,
    status: verified.status,
    providerFee: verified.providerFee,
    raw: verified.raw,
  });

  return verified;
}
