import { NextResponse } from "next/server";
import { completePaymentFromWebhook } from "@/lib/payments/service";
import { prisma } from "@/lib/db";
import { sendText } from "@/lib/whatsapp/client";
import { paymentReceipt } from "@/lib/whatsapp/messages";
import { PawapayPaymentProvider } from "@/lib/payments/pawapay/provider";

export async function handlePawapayPaymentCallback(request: Request) {
  const body = await request.json();
  const provider = new PawapayPaymentProvider();
  const result = await provider.processWebhook(request.headers, body);

  const outcome = await completePaymentFromWebhook({
    provider: provider.name,
    eventId: result.eventId,
    providerReference: result.providerReference,
    status: result.status,
    providerFee: result.providerFee,
    raw: result.raw,
  });

  if (!outcome.duplicate && outcome.payment?.paymentStatus === "SUCCESSFUL") {
    const payment = outcome.payment;
    const [campaign, contributor] = await Promise.all([
      prisma.campaign.findUniqueOrThrow({ where: { id: payment.campaignId } }),
      prisma.contributor.findUniqueOrThrow({ where: { id: payment.contributorId } }),
    ]);
    await sendText(contributor.phoneNumber, {
      body: paymentReceipt(
        campaign,
        contributor,
        payment.amount,
        payment.transactionReference,
      ),
    });
  }

  return NextResponse.json({ ok: true, duplicate: outcome.duplicate });
}

export async function POST(request: Request) {
  try {
    return await handlePawapayPaymentCallback(request);
  } catch (error) {
    console.error("[pawapay payment webhook]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      { status: 400 },
    );
  }
}
