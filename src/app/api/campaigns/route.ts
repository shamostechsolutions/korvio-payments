import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createCampaign } from "@/lib/campaigns/create";
import { parseMoneyInput } from "@/lib/utils/money";

const createSchema = z.object({
  name: z.string().min(3),
  category: z.enum([
    "WEDDING",
    "INTRODUCTION",
    "FUNERAL",
    "MEDICAL",
    "EDUCATION",
    "CHURCH",
    "ALUMNI",
    "COMMUNITY",
    "OFFICE",
    "BIRTHDAY",
    "FAMILY_EMERGENCY",
    "ASSOCIATION",
    "MEMBERSHIP",
    "FUNDRAISING",
    "OTHER",
  ]),
  description: z.string().min(10),
  currency: z.string().default("UGX"),
  targetAmount: z.union([z.string(), z.number()]),
  startDate: z.string(),
  deadline: z.string(),
  organiserName: z.string().min(2),
  organiserPhone: z.string().min(10),
  beneficiaryName: z.string().optional(),
  contactPerson: z.string().optional(),
  allowPledges: z.boolean().optional(),
  allowPartialPayments: z.boolean().optional(),
  allowAnonymous: z.boolean().optional(),
  allowInKind: z.boolean().optional(),
  contributorListVisibility: z
    .enum([
      "NAMES_AND_STATUSES",
      "NAMES_ONLY",
      "STATUSES_WITHOUT_NAMES",
      "HIDDEN",
      "OPT_IN_ONLY",
      "AMOUNTS_WHEN_PERMITTED",
    ])
    .optional(),
  contributionAmountVisibility: z.enum(["PRIVATE", "PUBLIC_OPT_IN", "PUBLIC"]).optional(),
  campaignCode: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await prisma.campaign.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { administrators: { some: { userId: user.id, status: "ACTIVE" } } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = createSchema.parse(await request.json());
    const targetAmount = parseMoneyInput(body.targetAmount);
    if (!targetAmount) {
      return NextResponse.json({ error: "Invalid target amount" }, { status: 400 });
    }

    const result = await createCampaign({
      ownerId: user.id,
      name: body.name,
      category: body.category,
      description: body.description,
      currency: body.currency,
      targetAmount,
      startDate: new Date(body.startDate),
      deadline: new Date(body.deadline),
      organiserName: body.organiserName,
      organiserPhone: body.organiserPhone.replace(/\D/g, ""),
      beneficiaryName: body.beneficiaryName,
      contactPerson: body.contactPerson,
      imageUrl: body.imageUrl,
      allowPledges: body.allowPledges,
      allowPartialPayments: body.allowPartialPayments,
      allowAnonymous: body.allowAnonymous,
      allowInKind: body.allowInKind,
      contributorListVisibility: body.contributorListVisibility,
      contributionAmountVisibility: body.contributionAmountVisibility,
      campaignCode: body.campaignCode,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Unable to create campaign" }, { status: 500 });
  }
}
