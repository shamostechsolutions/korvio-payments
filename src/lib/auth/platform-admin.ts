import type { User } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";

export function getPlatformAdminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdmin(user: Pick<User, "email"> | null | undefined): boolean {
  if (!user?.email) return false;
  const allowed = getPlatformAdminEmails();
  if (!allowed.length) return false;
  return allowed.includes(user.email.toLowerCase());
}

export async function requirePlatformAdmin(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (!isPlatformAdmin(user)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
