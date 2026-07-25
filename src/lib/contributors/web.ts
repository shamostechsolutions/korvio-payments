import type { Campaign, Contributor } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { recalculateContributorAndCampaign } from "@/lib/campaigns/totals";
import { initiateContributorPayment } from "@/lib/payments/service";
import { defaultPaymentMethod } from "@/lib/whatsapp/replies";
import { formatMoney, parseMoneyInput } from "@/lib/utils/money";

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function getPublicCampaign(code: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { campaignCode: code.toUpperCase() },
  });
  if (!campaign || ["CANCELLED", "DRAFT"].includes(campaign.status)) {
    return null;
  }
  return campaign;
}

export async function joinCampaign(input: {
  campaignId: string;
  phoneNumber: string;
  displayName: string;
}) {
  const phone = normalizePhone(input.phoneNumber);
  if (phone.length < 10) {
    throw new Error("Enter a valid phone number");
  }

  const existing = await prisma.contributor.findUnique({
    where: {
      campaignId_phoneNumber: { campaignId: input.campaignId, phoneNumber: phone },
    },
  });

  if (existing) {
    if (input.displayName.trim() && existing.displayName !== input.displayName.trim()) {
      return prisma.contributor.update({
        where: { id: existing.id },
        data: { displayName: input.displayName.trim(), lastActivityAt: new Date() },
      });
    }
    return existing;
  }

  const contributor = await prisma.contributor.create({
    data: {
      campaignId: input.campaignId,
      phoneNumber: phone,
      displayName: input.displayName.trim() || `Contributor ${phone.slice(-4)}`,
      status: "JOINED",
    },
  });

  await writeAuditLog({
    campaignId: input.campaignId,
    action: "contributor_added",
    entityType: "contributor",
    entityId: contributor.id,
    newData: { phoneNumber: phone, source: "web" },
  });

  return contributor;
}

export async function createPledge(input: {
  campaign: Campaign;
  contributor: Contributor;
  amount: number;
}) {
  const { campaign, contributor, amount } = input;

  if (!campaign.allowPledges) {
    throw new Error("Pledges are not enabled for this campaign");
  }
  if (campaign.minimumPledgeAmount && amount < campaign.minimumPledgeAmount) {
    throw new Error(
      `Minimum pledge is ${formatMoney(campaign.minimumPledgeAmount, campaign.currency)}`,
    );
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
    newData: { amount, source: "web" },
  });

  return prisma.contributor.findUniqueOrThrow({ where: { id: contributor.id } });
}

export async function initiateWebPayment(input: {
  campaign: Campaign;
  contributor: Contributor;
  amount: number;
}) {
  const { campaign, contributor, amount } = input;
  const parsed = parseMoneyInput(String(amount));
  if (!parsed || parsed <= 0) {
    throw new Error("Enter a valid amount");
  }

  const method = defaultPaymentMethod(campaign);

  if (method === "CASH" || method === "DIRECT_TO_TREASURER") {
    return {
      type: "direct" as const,
      method,
      amount: parsed,
      treasurerName: campaign.organiserName,
      treasurerPhone: campaign.organiserPhone,
    };
  }

  const result = await initiateContributorPayment({
    campaignId: campaign.id,
    contributorId: contributor.id,
    amount: parsed,
    paymentMethod: method,
    phoneNumber: contributor.phoneNumber,
  });

  const checkoutUrl = result.initiation?.checkoutUrl;
  if (!checkoutUrl) {
    throw new Error("Unable to start online payment");
  }

  return {
    type: "checkout" as const,
    checkoutUrl,
    transactionReference: result.payment.transactionReference,
    amount: parsed,
  };
}

export function contributorSummary(campaign: Campaign, contributor: Contributor) {
  return {
    id: contributor.id,
    displayName: contributor.displayName,
    phoneNumber: contributor.phoneNumber,
    status: contributor.status,
    pledgedAmount: contributor.pledgedAmount,
    paidAmount: contributor.paidAmount,
    outstandingAmount: contributor.outstandingAmount,
    pledged: formatMoney(contributor.pledgedAmount, campaign.currency),
    paid: formatMoney(contributor.paidAmount, campaign.currency),
    outstanding: formatMoney(contributor.outstandingAmount, campaign.currency),
  };
}
