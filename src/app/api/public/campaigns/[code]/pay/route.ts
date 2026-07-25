import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getPublicCampaign,
  initiateWebPayment,
  normalizePhone,
} from "@/lib/contributors/web";
import { prisma } from "@/lib/db";
import { parseMoneyInput } from "@/lib/utils/money";

const bodySchema = z.object({
  phoneNumber: z.string().min(10).max(20),
  amount: z.union([z.number(), z.string()]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const campaign = await getPublicCampaign(code);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const body = bodySchema.parse(await request.json());
    const amount =
      typeof body.amount === "number" ? body.amount : parseMoneyInput(body.amount);
    if (!amount) {
      return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
    }

    const contributor = await prisma.contributor.findUnique({
      where: {
        campaignId_phoneNumber: {
          campaignId: campaign.id,
          phoneNumber: normalizePhone(body.phoneNumber),
        },
      },
    });
    if (!contributor) {
      return NextResponse.json({ error: "Join the campaign first" }, { status: 400 });
    }

    const result = await initiateWebPayment({ campaign, contributor, amount });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start payment" },
      { status: 400 },
    );
  }
}
