import type { CampaignCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { campaignProgressPct } from "@/lib/campaigns/fundraising";
import { categoryLabel } from "@/lib/campaigns/labels";

export type PublicCampaignCard = {
  code: string;
  name: string;
  category: CampaignCategory;
  categoryLabel: string;
  currency: string;
  totalReceived: number;
  targetAmount: number;
  progressPct: number | null;
  contributorCount: number;
  imageUrl: string | null;
};

export type SuccessStoryCard = {
  code: string;
  name: string;
  categoryLabel: string;
  currency: string;
  totalReceived: number;
  contributorCount: number;
  quote: string | null;
  goalReached: boolean;
};

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getLiveCampaignsForDirectory(limit = 6): Promise<PublicCampaignCard[]> {
  return safeQuery(async () => {
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: "ACTIVE",
        deletionRequestedAt: null,
      },
      orderBy: [{ totalReceived: "desc" }, { updatedAt: "desc" }],
      take: limit,
      select: {
        campaignCode: true,
        name: true,
        category: true,
        currency: true,
        totalReceived: true,
        targetAmount: true,
        fundraisingMode: true,
        imageUrl: true,
        _count: { select: { contributors: true } },
      },
    });

    return campaigns.map((c) => ({
      code: c.campaignCode,
      name: c.name,
      category: c.category,
      categoryLabel: categoryLabel(c.category),
      currency: c.currency,
      totalReceived: c.totalReceived,
      targetAmount: c.targetAmount,
      progressPct: campaignProgressPct(c),
      contributorCount: c._count.contributors,
      imageUrl: c.imageUrl,
    }));
  }, []);
}

export async function getFeaturedSuccessStories(limit = 3): Promise<SuccessStoryCard[]> {
  return safeQuery(async () => {
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: { in: ["COMPLETED", "CLOSED", "ACTIVE"] },
        totalReceived: { gt: 0 },
        deletionRequestedAt: null,
      },
      orderBy: [{ totalReceived: "desc" }, { updatedAt: "desc" }],
      take: limit,
      select: {
        campaignCode: true,
        name: true,
        category: true,
        currency: true,
        totalReceived: true,
        targetAmount: true,
        fundraisingMode: true,
        status: true,
        publicUpdates: {
          orderBy: { publishedAt: "desc" },
          take: 1,
          select: { body: true },
        },
        _count: { select: { contributors: true } },
      },
    });

    return campaigns.map((c) => {
      const progress = campaignProgressPct(c);
      const goalReached =
        c.status === "COMPLETED" ||
        c.status === "CLOSED" ||
        (progress !== null && progress >= 100);

      const rawQuote = c.publicUpdates[0]?.body?.trim();
      const quote =
        rawQuote && rawQuote.length <= 220
          ? rawQuote
          : rawQuote
            ? `${rawQuote.slice(0, 217)}…`
            : null;

      return {
        code: c.campaignCode,
        name: c.name,
        categoryLabel: categoryLabel(c.category),
        currency: c.currency,
        totalReceived: c.totalReceived,
        contributorCount: c._count.contributors,
        quote,
        goalReached,
      };
    });
  }, []);
}
