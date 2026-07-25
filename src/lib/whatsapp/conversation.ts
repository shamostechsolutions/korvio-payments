import { addDays } from "date-fns";
import type { Campaign, Contributor, ConversationState, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { recalculateContributorAndCampaign } from "@/lib/campaigns/totals";
import { generateGroupUpdate } from "@/lib/campaigns/updates";
import { parseMoneyInput, formatMoney, daysRemaining } from "@/lib/utils/money";
import { initiateContributorPayment } from "@/lib/payments/service";
import { sendText } from "./client";
import { paymentReceipt } from "./messages";
import {
  sendBalanceSummary,
  sendCampaignPicker,
  sendCreateCampaignInvite,
  sendMoreOptionsMenu,
  sendOnboardingMenu,
  sendPayAmountPrompt,
  sendPaymentCheckout,
  sendPledgeAmountPrompt,
  sendProgressSummary,
  sendCampaignJoinFlow,
  sendReminderAudienceMenu,
  sendReminderConfirmMenu,
  defaultPaymentMethod,
  paymentMethodLabel,
} from "./replies";

type IncomingMessage = {
  from: string;
  text: string;
  buttonId?: string;
};

type StateData = {
  amount?: number;
  expectedDateKey?: string;
  paymentAmount?: number;
  adminFlow?: string;
  reminderAudience?: string;
};

const STATE_TTL_HOURS = 24;

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function parseCommand(text: string) {
  const trimmed = text.trim();
  const upper = trimmed.toUpperCase();
  const join = upper.match(/^JOIN\s+([A-Z0-9-]+)$/);
  if (join) return { type: "JOIN" as const, code: join[1] };
  const pay = trimmed.match(/^PAY(?:\s+([A-Za-z0-9-]+))?(?:\s+(.+))?$/i);
  if (pay) {
    return {
      type: "PAY" as const,
      code: pay[1]?.toUpperCase(),
      amountText: pay[2]?.trim(),
    };
  }
  const summary = upper.match(/^SUMMARY\s+([A-Z0-9-]+)$/);
  if (summary) return { type: "SUMMARY" as const, code: summary[1] };
  const pending = upper.match(/^PENDING\s+([A-Z0-9-]+)$/);
  if (pending) return { type: "PENDING" as const, code: pending[1] };
  const update = upper.match(/^UPDATE\s+([A-Z0-9-]+)$/);
  if (update) return { type: "UPDATE" as const, code: update[1] };
  const remind = upper.match(/^REMIND\s+([A-Z0-9-]+)$/);
  if (remind) return { type: "REMIND" as const, code: remind[1] };
  if (upper === "RECORD PAYMENT") return { type: "RECORD_PAYMENT" as const };
  if (upper === "RECORD EXPENSE") return { type: "RECORD_EXPENSE" as const };
  if (upper === "MENU" || upper === "0" || upper === "HI" || upper === "HELLO") {
    return { type: "MENU" as const };
  }
  if (
    upper === "CREATE" ||
    upper === "CREATE CAMPAIGN" ||
    upper === "CREATE MY CAMPAIGN" ||
    upper === "CREATE_CAMPAIGN"
  ) {
    return { type: "CREATE_CAMPAIGN" as const };
  }
  return { type: "TEXT" as const, text: trimmed };
}

async function getOrCreateConversation(phoneNumber: string) {
  const expiresAt = addDays(new Date(), 0);
  expiresAt.setHours(expiresAt.getHours() + STATE_TTL_HOURS);

  return prisma.whatsAppConversation.upsert({
    where: { phoneNumber },
    create: {
      phoneNumber,
      currentState: "IDLE",
      stateData: {},
      expiresAt,
    },
    update: {
      lastMessageAt: new Date(),
      expiresAt,
    },
  });
}

async function setState(
  phoneNumber: string,
  currentState: ConversationState,
  stateData: StateData = {},
  extras?: { campaignId?: string | null; contributorId?: string | null },
) {
  return prisma.whatsAppConversation.update({
    where: { phoneNumber },
    data: {
      currentState,
      stateData: stateData as Prisma.InputJsonValue,
      campaignId: extras?.campaignId === undefined ? undefined : extras.campaignId,
      contributorId:
        extras?.contributorId === undefined ? undefined : extras.contributorId,
      lastMessageAt: new Date(),
    },
  });
}

async function ensureContributor(campaignId: string, phoneNumber: string, displayName?: string) {
  const existing = await prisma.contributor.findUnique({
    where: { campaignId_phoneNumber: { campaignId, phoneNumber } },
  });
  if (existing) return existing;

  const contributor = await prisma.contributor.create({
    data: {
      campaignId,
      phoneNumber,
      displayName: displayName || `Contributor ${phoneNumber.slice(-4)}`,
      status: "JOINED",
    },
  });

  await writeAuditLog({
    campaignId,
    action: "contributor_added",
    entityType: "contributor",
    entityId: contributor.id,
    newData: { phoneNumber, source: "whatsapp" },
  });

  return contributor;
}

async function isCampaignAdmin(campaignId: string, phoneNumber: string) {
  const user = await prisma.user.findUnique({ where: { phoneNumber } });
  if (!user) return null;

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return null;
  if (campaign.ownerId === user.id) return { user, role: "OWNER" as const };

  const membership = await prisma.campaignAdministrator.findUnique({
    where: { campaignId_userId: { campaignId, userId: user.id } },
  });

  if (membership?.status === "ACTIVE") {
    return { user, role: membership.role };
  }
  return null;
}

async function beginCampaignPay(
  phone: string,
  campaignId: string,
  contributorId: string,
  options?: { skipIntro?: boolean },
) {
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  await setState(phone, "AWAITING_PAYMENT_AMOUNT", {}, { campaignId, contributorId });
  if (options?.skipIntro) {
    await sendPayAmountPrompt(phone, campaign);
  } else {
    await sendCampaignJoinFlow(phone, campaign);
  }
}

async function processQuickPayment(
  phone: string,
  campaign: Campaign,
  contributor: Contributor,
  amount: number,
) {
  const method = defaultPaymentMethod(campaign);

  if (method === "CASH" || method === "DIRECT_TO_TREASURER") {
    await sendText(phone, {
      body: [
        "Please pay the treasurer directly.",
        "",
        `Amount: ${formatMoney(amount, campaign.currency)}`,
        `Treasurer: ${campaign.organiserName} · ${campaign.organiserPhone}`,
        "",
        "They will record it in Korvio and you will get a confirmation here.",
      ].join("\n"),
    });
    await beginCampaignPay(phone, campaign.id, contributor.id, { skipIntro: true });
    return;
  }

  try {
    const { payment, initiation } = await initiateContributorPayment({
      campaignId: campaign.id,
      contributorId: contributor.id,
      amount,
      paymentMethod: method,
      phoneNumber: phone,
    });

    if (initiation?.checkoutUrl) {
      await sendPaymentCheckout(phone, {
        campaign,
        amount,
        checkoutUrl: initiation.checkoutUrl,
        reference: payment.transactionReference,
      });
      await beginCampaignPay(phone, campaign.id, contributor.id, { skipIntro: true });
      return;
    }

    await sendText(phone, {
      body: [
        "⏳ Check your phone to approve the payment.",
        "",
        `Amount: ${formatMoney(amount, campaign.currency)}`,
        `Method: ${paymentMethodLabel(method)}`,
        `Reference: ${payment.transactionReference}`,
      ].join("\n"),
    });

    if (
      payment.paymentProvider === "mock" &&
      process.env.MOCK_AUTO_COMPLETE === "true" &&
      payment.providerReference
    ) {
      const { completePaymentFromWebhook } = await import("@/lib/payments/service");
      await completePaymentFromWebhook({
        provider: "mock",
        eventId: `auto-${payment.id}`,
        providerReference: payment.providerReference,
        status: "SUCCESSFUL",
        raw: { auto: true },
      });
      const updated = await prisma.contributor.findUniqueOrThrow({
        where: { id: contributor.id },
      });
      await sendText(phone, {
        body: paymentReceipt(campaign, updated, amount, payment.transactionReference),
      });
    }

    await beginCampaignPay(phone, campaign.id, contributor.id, { skipIntro: true });
  } catch (error) {
    await sendText(phone, {
      body: error instanceof Error ? error.message : "Unable to start payment. Please try again.",
    });
    await beginCampaignPay(phone, campaign.id, contributor.id, { skipIntro: true });
  }
}

async function showMainMenu(phone: string, campaignId: string) {
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  const contributor = await ensureContributor(campaignId, phone);
  await setState(phone, "AWAITING_MAIN_MENU", {}, {
    campaignId,
    contributorId: contributor.id,
  });
  await sendMoreOptionsMenu(phone, campaign);
}

async function showProgress(phone: string, campaignId: string) {
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  const contributors = await prisma.contributor.findMany({ where: { campaignId } });
  const counts = {
    fullyPaid: contributors.filter((c) =>
      ["FULLY_PAID", "PAID_WITHOUT_PLEDGE", "OVERPAID"].includes(c.status),
    ).length,
    partiallyPaid: contributors.filter((c) => c.status === "PARTIALLY_PAID").length,
    pledged: contributors.filter((c) => c.status === "PLEDGED").length,
  };
  await sendProgressSummary(phone, campaign, contributors.length, counts);
}

export async function handleIncomingWhatsAppMessage(message: IncomingMessage) {
  const phone = normalizePhone(message.from);
  const conversation = await getOrCreateConversation(phone);
  const command = parseCommand(message.buttonId || message.text);
  const stateData = (conversation.stateData || {}) as StateData;

  if (conversation.expiresAt < new Date() && conversation.currentState !== "IDLE") {
    await setState(phone, "IDLE", {});
  }

  const choice =
    command.type === "TEXT"
      ? command.text.trim()
      : message.buttonId || message.text.trim();

  if (
    command.type === "CREATE_CAMPAIGN" ||
    choice === "CREATE_CAMPAIGN"
  ) {
    await sendCreateCampaignInvite(phone);
    return;
  }

  if (choice === "JOIN_HELP") {
    await sendText(phone, {
      body: [
        "To join a campaign, tap the WhatsApp link shared by your group, or send:",
        "",
        "JOIN followed by the campaign code",
        "",
        "Example: JOIN MSW-2026",
      ].join("\n"),
    });
    await sendOnboardingMenu(phone);
    return;
  }

  if (command.type === "JOIN") {
    const campaign = await prisma.campaign.findUnique({
      where: { campaignCode: command.code },
    });
    if (!campaign || !["ACTIVE", "DRAFT"].includes(campaign.status)) {
      await sendText(phone, {
        body: "We could not find an active campaign with that code. Please check the link and try again.",
      });
      return;
    }

    const contributor = await ensureContributor(campaign.id, phone);
    await beginCampaignPay(phone, campaign.id, contributor.id);
    return;
  }

  if (command.type === "PAY") {
    let campaign =
      conversation.campaignId
        ? await prisma.campaign.findUnique({ where: { id: conversation.campaignId } })
        : null;

    if (command.code) {
      campaign = await prisma.campaign.findUnique({
        where: { campaignCode: command.code },
      });
    }

    if (!campaign || !["ACTIVE", "DRAFT"].includes(campaign.status)) {
      await sendText(phone, {
        body: "Campaign not found. Use JOIN followed by the campaign code first.",
      });
      return;
    }

    const contributor = await ensureContributor(campaign.id, phone);

    if (command.amountText) {
      const amount = parseMoneyInput(command.amountText);
      if (!amount) {
        await sendText(phone, {
          body: "Please send a valid amount — e.g. PAY MSW-2026 50000 or PAY MSW-2026 50k",
        });
        return;
      }
      await processQuickPayment(phone, campaign, contributor, amount);
      return;
    }

    await beginCampaignPay(phone, campaign.id, contributor.id);
    return;
  }

  if (command.type === "SUMMARY" || command.type === "PENDING" || command.type === "UPDATE" || command.type === "REMIND") {
    const campaign = await prisma.campaign.findUnique({
      where: { campaignCode: command.code },
    });
    if (!campaign) {
      await sendText(phone, { body: "Campaign not found." });
      return;
    }
    const admin = await isCampaignAdmin(campaign.id, phone);
    if (!admin) {
      await sendText(phone, { body: "You are not authorised to run admin commands for this campaign." });
      return;
    }

    if (command.type === "SUMMARY") {
      await sendText(phone, {
        body: [
          `📊 ${campaign.name}`,
          "",
          "Target:",
          formatMoney(campaign.targetAmount, campaign.currency),
          "",
          "Pledged:",
          formatMoney(campaign.totalPledged, campaign.currency),
          "",
          "Received:",
          formatMoney(campaign.totalReceived, campaign.currency),
          "",
          "Outstanding:",
          formatMoney(Math.max(0, campaign.totalPledged - campaign.totalReceived), campaign.currency),
          "",
          "Expenses:",
          formatMoney(campaign.totalExpenses, campaign.currency),
          "",
          "Available balance:",
          formatMoney(campaign.availableBalance, campaign.currency),
        ].join("\n"),
      });
      return;
    }

    if (command.type === "PENDING") {
      const contributors = await prisma.contributor.findMany({ where: { campaignId: campaign.id } });
      const outstanding = contributors.filter((c) => c.outstandingAmount > 0);
      const unpaid = outstanding.filter((c) => c.paidAmount === 0).length;
      const partial = outstanding.filter((c) => c.paidAmount > 0).length;
      await sendText(phone, {
        body: [
          `${outstanding.length} contributors have outstanding pledges.`,
          "",
          `${unpaid} have not made any payment.`,
          `${partial} have made partial payments.`,
        ].join("\n"),
      });
      return;
    }

    if (command.type === "UPDATE") {
      const contributors = await prisma.contributor.findMany({ where: { campaignId: campaign.id } });
      const update = generateGroupUpdate({ campaign, contributors, includeList: true });
      await sendText(phone, {
        body: `Copy and share this update with your WhatsApp group:\n\n${update}`,
      });
      return;
    }

    if (command.type === "REMIND") {
      await setState(phone, "AWAITING_REMINDER_CONFIRMATION", {}, { campaignId: campaign.id });
      await sendReminderAudienceMenu(phone);
      return;
    }
  }

  if (command.type === "MENU") {
    if (conversation.campaignId) {
      await showMainMenu(phone, conversation.campaignId);
    } else {
      const memberships = await prisma.contributor.findMany({
        where: { phoneNumber: phone },
        include: { campaign: true },
        take: 10,
      });
      if (!memberships.length) {
        await setState(phone, "IDLE", {});
        await sendOnboardingMenu(phone);
        return;
      }
      await setState(phone, "AWAITING_CAMPAIGN_SELECTION", {});
      await sendCampaignPicker(
        phone,
        memberships.map((m) => ({ id: m.campaign.id, name: m.campaign.name })),
      );
    }
    return;
  }

  // Campaign selection
  if (conversation.currentState === "AWAITING_CAMPAIGN_SELECTION") {
    const memberships = await prisma.contributor.findMany({
      where: { phoneNumber: phone },
      include: { campaign: true },
      take: 10,
    });
    const index = Number(command.type === "TEXT" ? command.text : "") - 1;
    const selected = memberships[index];
    if (!selected) {
      await sendText(phone, { body: "Please reply with a valid campaign number." });
      return;
    }
    await setState(phone, "AWAITING_MAIN_MENU", {}, {
      campaignId: selected.campaignId,
      contributorId: selected.id,
    });
    await beginCampaignPay(phone, selected.campaignId, selected.id);
    return;
  }

  if (conversation.campaignId && choice === "STATUS") {
    const campaign = await prisma.campaign.findUniqueOrThrow({
      where: { id: conversation.campaignId },
    });
    const contributor = await ensureContributor(campaign.id, phone);
    await sendBalanceSummary(phone, campaign, contributor);
    return;
  }

  if (conversation.campaignId && choice === "PAY") {
    const contributorId =
      conversation.contributorId ||
      (await ensureContributor(conversation.campaignId, phone)).id;
    await beginCampaignPay(phone, conversation.campaignId, contributorId, {
      skipIntro: true,
    });
    return;
  }

  if (!conversation.campaignId) {
    await sendOnboardingMenu(phone);
    return;
  }

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: conversation.campaignId },
  });
  let contributor = conversation.contributorId
    ? await prisma.contributor.findUnique({ where: { id: conversation.contributorId } })
    : await ensureContributor(campaign.id, phone);

  if (!contributor) {
    contributor = await ensureContributor(campaign.id, phone);
  }

  if (conversation.currentState === "AWAITING_MAIN_MENU") {
    switch (choice) {
      case "4":
        await showProgress(phone, campaign.id);
        return;
      case "PLEDGE":
        if (!campaign.allowPledges) {
          await sendText(phone, { body: "Pledges are not enabled for this campaign." });
          return;
        }
        await setState(phone, "AWAITING_PLEDGE_AMOUNT", {}, {
          campaignId: campaign.id,
          contributorId: contributor.id,
        });
        await sendPledgeAmountPrompt(phone);
        return;
      case "5":
        await sendText(phone, {
          body: `Contact the treasurer: ${campaign.organiserPhone} (${campaign.contactPerson || campaign.organiserName})`,
        });
        return;
      case "6":
        await sendCreateCampaignInvite(phone);
        return;
      default: {
        const typedAmount = parseMoneyInput(choice);
        if (typedAmount) {
          await processQuickPayment(phone, campaign, contributor, typedAmount);
          return;
        }
        await sendText(phone, {
          body: "Choose an option from the menu, or type an amount to pay.",
        });
        return;
      }
    }
  }

  if (conversation.currentState === "AWAITING_PLEDGE_AMOUNT") {
    const amount = parseMoneyInput(choice);
    if (!amount) {
      await sendText(phone, { body: "Please enter a valid amount — e.g. 300000 or 300k" });
      return;
    }
    if (campaign.minimumPledgeAmount && amount < campaign.minimumPledgeAmount) {
      await sendText(phone, {
        body: `Minimum pledge is ${formatMoney(campaign.minimumPledgeAmount, campaign.currency)}.`,
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.pledge.updateMany({
        where: { contributorId: contributor.id, status: "ACTIVE" },
        data: { status: "CHANGED" },
      });
      await tx.pledge.create({
        data: {
          campaignId: campaign.id,
          contributorId: contributor.id,
          amount,
          status: "ACTIVE",
        },
      });
    });

    await recalculateContributorAndCampaign(contributor.id);
    await writeAuditLog({
      campaignId: campaign.id,
      action: "pledge_created",
      entityType: "pledge",
      entityId: contributor.id,
      newData: { amount },
    });

    await sendText(phone, {
      body: [
        "🤝 Pledge recorded",
        "",
        `Amount: ${formatMoney(amount, campaign.currency)}`,
        "",
        "When you're ready to pay, reply with the amount — e.g. 50000 or 50k",
      ].join("\n"),
    });
    await beginCampaignPay(phone, campaign.id, contributor.id, { skipIntro: true });
    return;
  }

  if (conversation.currentState === "AWAITING_PAYMENT_AMOUNT") {
    const amount = parseMoneyInput(choice);
    if (!amount) {
      await sendText(phone, {
        body: "Please reply with the amount you want to pay — e.g. 50000 or 50k",
      });
      return;
    }
    await processQuickPayment(phone, campaign, contributor, amount);
    return;
  }

  // Typed amount while idle in a campaign → pay immediately
  if (conversation.campaignId) {
    const amount = parseMoneyInput(choice);
    if (amount) {
      await processQuickPayment(phone, campaign, contributor, amount);
      return;
    }
  }

  if (conversation.currentState === "AWAITING_REMINDER_CONFIRMATION") {
    if (!stateData.reminderAudience && ["1", "2", "3", "5"].includes(choice)) {
      await setState(phone, "AWAITING_REMINDER_CONFIRMATION", {
        reminderAudience: choice,
      }, { campaignId: campaign.id });
      await sendReminderConfirmMenu(phone);
      return;
    }

    if (choice.toUpperCase() === "YES" && stateData.reminderAudience) {
      const contributors = await prisma.contributor.findMany({
        where: {
          campaignId: campaign.id,
          allowReminders: true,
          ...(stateData.reminderAudience === "1"
            ? { outstandingAmount: { gt: 0 } }
            : stateData.reminderAudience === "2"
              ? { paidAmount: 0, pledgedAmount: { gt: 0 } }
              : stateData.reminderAudience === "3"
                ? { status: "PARTIALLY_PAID" }
                : {
                    expectedPaymentDate: { lt: new Date() },
                    outstandingAmount: { gt: 0 },
                  }),
        },
      });

      for (const c of contributors) {
        const body = [
          `Hello ${c.displayName} 👋`,
          "",
          `You made a pledge towards the ${campaign.name}.`,
          "",
          `Your contribution is still incomplete, and the event is now ${daysRemaining(campaign.deadline)} days away.`,
          "",
          "Tap below or reply PAY to make a payment:",
          `JOIN ${campaign.campaignCode}`,
        ].join("\n");

        await prisma.reminder.create({
          data: {
            campaignId: campaign.id,
            contributorId: c.id,
            reminderType: "PLEDGE_UNPAID",
            message: body,
            status: "SENT",
            scheduledAt: new Date(),
            sentAt: new Date(),
          },
        });
        await sendText(c.phoneNumber, { body });
        await prisma.contributor.update({
          where: { id: c.id },
          data: { lastReminderAt: new Date(), reminderCount: { increment: 1 } },
        });
      }

      await writeAuditLog({
        campaignId: campaign.id,
        action: "reminder_sent",
        entityType: "reminder",
        newData: { count: contributors.length, audience: stateData.reminderAudience },
      });

      await sendText(phone, {
        body: `Done. ${contributors.length} private reminder(s) sent.`,
      });
      await setState(phone, "IDLE", {}, { campaignId: campaign.id });
      return;
    }

    if (choice.toUpperCase() === "NO") {
      await sendText(phone, { body: "Reminder cancelled." });
      await setState(phone, "IDLE", {}, { campaignId: campaign.id });
      return;
    }
  }

  await sendText(phone, {
    body: "Send JOIN followed by your campaign code, or type an amount to pay if you already joined.",
  });
}
