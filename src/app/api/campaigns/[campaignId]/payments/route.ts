import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { requireCampaignPermission } from "@/lib/campaigns/access";
import { prisma } from "@/lib/db";
import { parseMoneyInput } from "@/lib/utils/money";
import { initiateContributorPayment } from "@/lib/payments/service";
import { sendText } from "@/lib/whatsapp/client";
import { paymentReceipt } from "@/lib/whatsapp/messages";

const schema = z.object({
  contributorId: z.string(),
  amount: z.union([z.string(), z.number()]),
  paymentMethod: z.enum([
    "MTN_MOMO",
    "AIRTEL_MONEY",
    "BANK",
    "CARD",
    "CASH",
    "CHEQUE",
    "CARD_TERMINAL",
    "IN_PERSON",
    "DIRECT_TO_TREASURER",
    "OTHER",
  ]),
  paymentDate: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  proofUrl: z.string().optional(),
  notifyContributor: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { campaignId } = await params;

  try {
    const access = await requireCampaignPermission(campaignId, user, "reports.public");
    const payments = await prisma.payment.findMany({
      where: { campaignId: access.campaign.id },
      include: { contributor: true, recordedBy: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      payments: access.canViewAmounts
        ? payments
        : payments.map((p) => ({ ...p, amount: null, netAmount: null })),
      canViewAmounts: access.canViewAmounts,
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { campaignId } = await params;

  try {
    const access = await requireCampaignPermission(campaignId, user, "payments.record");
    const body = schema.parse(await request.json());
    const amount = parseMoneyInput(body.amount);
    if (!amount) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const contributor = await prisma.contributor.findFirst({
      where: { id: body.contributorId, campaignId: access.campaign.id },
    });
    if (!contributor) {
      return NextResponse.json({ error: "Contributor not found" }, { status: 404 });
    }

    const { payment } = await initiateContributorPayment({
      campaignId: access.campaign.id,
      contributorId: contributor.id,
      amount,
      paymentMethod: body.paymentMethod,
      phoneNumber: contributor.phoneNumber,
      recordedById: user.id,
      manual: true,
      notes: body.notes
        ? `${body.notes}\nRecorded manually by ${user.fullName}`
        : `Recorded manually by ${user.fullName}`,
      proofUrl: body.proofUrl,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
      reference: body.reference,
    });

    if (body.notifyContributor !== false && payment.paymentStatus === "SUCCESSFUL") {
      const updated = await prisma.contributor.findUniqueOrThrow({
        where: { id: contributor.id },
      });
      await sendText(contributor.phoneNumber, {
        body: paymentReceipt(
          access.campaign,
          updated,
          amount,
          payment.transactionReference,
        ),
      });
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record payment" },
      { status: 400 },
    );
  }
}
