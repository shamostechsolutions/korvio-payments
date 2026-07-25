import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { prisma } from "@/lib/db";
import { permissionsForRole } from "@/lib/permissions";

export default async function AdminsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { campaignId } = await params;
  const access = await getCampaignAccess(campaignId, user);
  if (!access) notFound();

  const admins = await prisma.campaignAdministrator.findMany({
    where: { campaignId: access.campaign.id },
    include: { user: true },
    orderBy: { invitedAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="surface rounded-3xl p-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-700 text-[var(--brand)]">
          Administrators
        </h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Roles control who can see amounts, record payments, send reminders and approve expenses.
        </p>
      </div>

      <div className="space-y-3">
        {admins.map((admin) => (
          <article key={admin.id} className="surface rounded-3xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-[var(--brand)]">{admin.user.fullName}</h2>
                <p className="text-sm text-[var(--ink-soft)]">
                  {admin.user.phoneNumber}
                  {admin.user.email ? ` · ${admin.user.email}` : ""}
                </p>
              </div>
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                {admin.role} · {admin.status}
              </span>
            </div>
            <p className="mt-3 text-xs text-[var(--ink-soft)]">
              Permissions: {permissionsForRole(admin.role, admin.permissions).join(", ")}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
