import { prisma } from "@/lib/db";
import { canViewAmounts, hasPermission, type Permission } from "@/lib/permissions";
import type { AdminRole, Campaign, CampaignAdministrator, User } from "@prisma/client";

export type CampaignAccess = {
  campaign: Campaign;
  membership: CampaignAdministrator | null;
  role: AdminRole | null;
  canViewAmounts: boolean;
  has: (permission: Permission) => boolean;
};

export async function getCampaignAccess(
  campaignIdOrCode: string,
  user: User,
): Promise<CampaignAccess | null> {
  const campaign = await prisma.campaign.findFirst({
    where: {
      OR: [{ id: campaignIdOrCode }, { campaignCode: campaignIdOrCode }],
    },
  });

  if (!campaign) return null;

  const membership = await prisma.campaignAdministrator.findUnique({
    where: {
      campaignId_userId: {
        campaignId: campaign.id,
        userId: user.id,
      },
    },
  });

  const isOwner = campaign.ownerId === user.id;
  const role = isOwner ? "OWNER" : membership?.status === "ACTIVE" ? membership.role : null;
  const custom = membership?.permissions ?? [];

  return {
    campaign,
    membership,
    role,
    canViewAmounts: canViewAmounts(role, custom),
    has: (permission) => hasPermission(role, permission, custom),
  };
}

export async function requireCampaignPermission(
  campaignIdOrCode: string,
  user: User,
  permission: Permission,
) {
  const access = await getCampaignAccess(campaignIdOrCode, user);
  if (!access || !access.has(permission)) {
    throw new Error("FORBIDDEN");
  }
  return access;
}
