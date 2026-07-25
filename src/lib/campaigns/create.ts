import type { CampaignCategory, FundraisingMode, PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { generateCampaignCode, whatsappJoinLink } from "@/lib/utils/codes";

export type CreateCampaignInput = {
  ownerId: string;
  name: string;
  category: CampaignCategory;
  description: string;
  currency: string;
  fundraisingMode?: FundraisingMode;
  targetAmount: number;
  startDate: Date;
  deadline: Date;
  imageUrl?: string;
  organiserName: string;
  organiserPhone: string;
  beneficiaryName?: string;
  contactPerson?: string;
  contributorListVisibility?: Prisma.CampaignCreateInput["contributorListVisibility"];
  contributionAmountVisibility?: Prisma.CampaignCreateInput["contributionAmountVisibility"];
  allowPledges?: boolean;
  allowPartialPayments?: boolean;
  allowAnonymous?: boolean;
  allowInKind?: boolean;
  paymentMethods?: PaymentMethod[];
  reminderFrequencyDays?: number;
  campaignCode?: string;
};

export async function createCampaign(input: CreateCampaignInput) {
  let code = input.campaignCode || generateCampaignCode(input.name);
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.campaign.findUnique({ where: { campaignCode: code } });
    if (!exists) break;
    code = generateCampaignCode(input.name);
  }

  const campaign = await prisma.campaign.create({
    data: {
      campaignCode: code,
      ownerId: input.ownerId,
      name: input.name,
      category: input.category,
      description: input.description,
      currency: input.currency,
      fundraisingMode: input.fundraisingMode ?? "GOAL",
      targetAmount: input.fundraisingMode === "OPEN" ? 0 : input.targetAmount,
      startDate: input.startDate,
      deadline: input.deadline,
      imageUrl: input.imageUrl,
      organiserName: input.organiserName,
      organiserPhone: input.organiserPhone,
      beneficiaryName: input.beneficiaryName,
      contactPerson: input.contactPerson || input.organiserName,
      contributorListVisibility: input.contributorListVisibility || "NAMES_AND_STATUSES",
      contributionAmountVisibility: input.contributionAmountVisibility || "PRIVATE",
      allowPledges: input.allowPledges ?? true,
      allowPartialPayments: input.allowPartialPayments ?? true,
      allowAnonymous: input.allowAnonymous ?? false,
      allowInKind: input.allowInKind ?? false,
      paymentMethods: input.paymentMethods?.length
        ? input.paymentMethods
        : ["MTN_MOMO", "AIRTEL_MONEY", "CASH", "DIRECT_TO_TREASURER"],
      reminderFrequencyDays: input.reminderFrequencyDays ?? 7,
      status: "DRAFT",
      administrators: {
        create: {
          userId: input.ownerId,
          role: "OWNER",
          permissions: [],
          status: "ACTIVE",
          acceptedAt: new Date(),
        },
      },
    },
  });

  await writeAuditLog({
    campaignId: campaign.id,
    userId: input.ownerId,
    action: "campaign_created",
    entityType: "campaign",
    entityId: campaign.id,
    newData: { name: campaign.name, code: campaign.campaignCode },
  });

  const businessNumber = process.env.WHATSAPP_BUSINESS_NUMBER || "256700000000";
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  return {
    campaign,
    links: {
      publicUrl: `${appUrl}/c/${campaign.campaignCode}`,
      whatsappUrl: whatsappJoinLink(businessNumber, campaign.campaignCode),
      adminUrl: `${appUrl}/dashboard/campaigns/${campaign.id}/overview`,
    },
  };
}
