import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { requireCampaignPermission } from "@/lib/campaigns/access";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { sendText } from "@/lib/whatsapp/client";
import { daysRemaining } from "@/lib/utils/money";

const schema = z.object({
  audience: z.enum([
    "outstanding",
    "unpaid",
    "partial",
    "overdue",
    "selected",
  ]),
  contributorIds: z.array(z.string()).optional(),
  confirm: z.literal(true),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { campaignId } = await params;

  try {
    const access = await requireCampaignPermission(campaignId, user, "reminders.send");
    const body = schema.parse(await request.json());

    const where =
      body.audience === "selected"
        ? { id: { in: body.contributorIds || [] }, campaignId: access.campaign.id }
        : body.audience === "outstanding"
          ? { campaignId: access.campaign.id, outstandingAmount: { gt: 0 }, allowReminders: true }
          : body.audience === "unpaid"
            ? {
                campaignId: access.campaign.id,
                paidAmount: 0,
                pledgedAmount: { gt: 0 },
                allowReminders: true,
              }
            : body.audience === "partial"
              ? {
                  campaignId: access.campaign.id,
                  status: "PARTIALLY_PAID" as const,
                  allowReminders: true,
                }
              : {
                  campaignId: access.campaign.id,
                  expectedPaymentDate: { lt: new Date() },
                  outstandingAmount: { gt: 0 },
                  allowReminders: true,
                };

    const contributors = await prisma.contributor.findMany({ where });
    let sent = 0;

    for (const c of contributors) {
      const message = [
        `Hello ${c.displayName} 👋`,
        "",
        `You made a pledge towards the ${access.campaign.name}.`,
        "",
        `Your contribution is still incomplete, and the event is now ${daysRemaining(access.campaign.deadline)} days away.`,
        "",
        "Reply with JOIN " + access.campaign.campaignCode + " to pay or check your balance.",
      ].join("\n");

      await prisma.reminder.create({
        data: {
          campaignId: access.campaign.id,
          contributorId: c.id,
          reminderType: "PLEDGE_UNPAID",
          message,
          status: "SENT",
          scheduledAt: new Date(),
          sentAt: new Date(),
          createdById: user.id,
        },
      });

      await sendText(c.phoneNumber, { body: message });
      await prisma.contributor.update({
        where: { id: c.id },
        data: { lastReminderAt: new Date(), reminderCount: { increment: 1 } },
      });
      sent += 1;
    }

    await writeAuditLog({
      campaignId: access.campaign.id,
      userId: user.id,
      action: "reminder_sent",
      entityType: "reminder",
      newData: { audience: body.audience, sent },
    });

    return NextResponse.json({ sent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Confirmation required" }, { status: 400 });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
