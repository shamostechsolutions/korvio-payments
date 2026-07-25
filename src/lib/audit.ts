import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function writeAuditLog(input: {
  campaignId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  previousData?: Prisma.InputJsonValue;
  newData?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.auditLog.create({
    data: {
      campaignId: input.campaignId ?? undefined,
      userId: input.userId ?? undefined,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? undefined,
      previousData: input.previousData,
      newData: input.newData,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}
