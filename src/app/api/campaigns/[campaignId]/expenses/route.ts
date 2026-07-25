import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { requireCampaignPermission } from "@/lib/campaigns/access";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { parseMoneyInput } from "@/lib/utils/money";
import { recalculateContributorAndCampaign } from "@/lib/campaigns/totals";

const schema = z.object({
  category: z.string().min(1),
  description: z.string().min(2),
  supplier: z.string().optional(),
  amount: z.union([z.string(), z.number()]),
  paymentMethod: z
    .enum([
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
    ])
    .optional(),
  expenseDate: z.string(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
  autoApprove: z.boolean().optional(),
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
    if (!access.canViewAmounts && !access.has("expenses.record")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const expenses = await prisma.expense.findMany({
      where: { campaignId: access.campaign.id },
      include: { recordedBy: true, approvedBy: true },
      orderBy: { expenseDate: "desc" },
    });
    return NextResponse.json({ expenses });
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
    const access = await requireCampaignPermission(campaignId, user, "expenses.record");
    const body = schema.parse(await request.json());
    const amount = parseMoneyInput(body.amount);
    if (!amount) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const autoApprove = body.autoApprove ?? access.role === "OWNER";
    const expense = await prisma.expense.create({
      data: {
        campaignId: access.campaign.id,
        category: body.category,
        description: body.description,
        supplier: body.supplier,
        amount,
        paymentMethod: body.paymentMethod,
        expenseDate: new Date(body.expenseDate),
        receiptUrl: body.receiptUrl,
        notes: body.notes,
        approvalStatus: autoApprove ? "APPROVED" : "PENDING",
        recordedById: user.id,
        approvedById: autoApprove ? user.id : null,
      },
    });

    // Refresh campaign expense totals using any contributor (or direct campaign update)
    const anyContributor = await prisma.contributor.findFirst({
      where: { campaignId: access.campaign.id },
    });
    if (anyContributor) {
      await recalculateContributorAndCampaign(anyContributor.id);
    } else {
      const approved = await prisma.expense.aggregate({
        where: { campaignId: access.campaign.id, approvalStatus: "APPROVED" },
        _sum: { amount: true },
      });
      await prisma.campaign.update({
        where: { id: access.campaign.id },
        data: {
          totalExpenses: approved._sum.amount ?? 0,
          availableBalance:
            access.campaign.totalReceived -
            access.campaign.totalFees -
            (approved._sum.amount ?? 0),
        },
      });
    }

    await writeAuditLog({
      campaignId: access.campaign.id,
      userId: user.id,
      action: "expense_recorded",
      entityType: "expense",
      entityId: expense.id,
      newData: expense,
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to record expense" }, { status: 400 });
  }
}
