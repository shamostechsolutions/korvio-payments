import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { completePaymentFromWebhook } from "@/lib/payments/service";
import { prisma } from "@/lib/db";
import { sendText } from "@/lib/whatsapp/client";
import { paymentReceipt } from "@/lib/whatsapp/messages";

export async function POST(request: Request) {
  try {
    const provider = getPaymentProvider();
    const body = await request.json();
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
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      { status: 400 },
    );
  }
}
