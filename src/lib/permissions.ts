import type { AdminRole } from "@prisma/client";

export type Permission =
  | "campaign.edit"
  | "campaign.close"
  | "admins.manage"
  | "contributors.manage"
  | "amounts.view"
  | "payments.record"
  | "payments.verify"
  | "expenses.record"
  | "expenses.approve"
  | "reminders.send"
  | "updates.generate"
  | "reports.financial"
  | "reports.public"
  | "budget.manage"
  | "audit.view";

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  OWNER: [
    "campaign.edit",
    "campaign.close",
    "admins.manage",
    "contributors.manage",
    "amounts.view",
    "payments.record",
    "payments.verify",
    "expenses.record",
    "expenses.approve",
    "reminders.send",
    "updates.generate",
    "reports.financial",
    "reports.public",
    "budget.manage",
    "audit.view",
  ],
  TREASURER: [
    "contributors.manage",
    "amounts.view",
    "payments.record",
    "payments.verify",
    "expenses.record",
    "reminders.send",
    "updates.generate",
    "reports.financial",
    "reports.public",
    "budget.manage",
    "audit.view",
  ],
  SECRETARY: [
    "contributors.manage",
    "reminders.send",
    "updates.generate",
    "reports.public",
  ],
  AUDITOR: ["amounts.view", "reports.financial", "reports.public", "audit.view"],
  VIEWER: ["reports.public"],
};

export function permissionsForRole(role: AdminRole, custom: string[] = []): Permission[] {
  const base = ROLE_PERMISSIONS[role] ?? [];
  const extras = custom.filter((p): p is Permission =>
    (Object.values(ROLE_PERMISSIONS).flat() as string[]).includes(p),
  );
  return Array.from(new Set([...base, ...extras]));
}

export function hasPermission(
  role: AdminRole | null | undefined,
  permission: Permission,
  custom: string[] = [],
): boolean {
  if (!role) return false;
  return permissionsForRole(role, custom).includes(permission);
}

export function canViewAmounts(role: AdminRole | null | undefined, custom: string[] = []) {
  return hasPermission(role, "amounts.view", custom);
}
