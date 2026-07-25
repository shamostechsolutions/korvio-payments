import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { prisma } from "@/lib/db";
import { permissionsForRole } from "@/lib/permissions";
import { DashBadge, DashCard, DashPageHeader } from "@/components/dashboard/dash-page";

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
      <DashPageHeader
        title="Administrators"
        description="Roles control who can see amounts, record payments, send reminders and approve expenses."
      />

      <div className="space-y-3">
        {admins.map((admin) => (
          <DashCard key={admin.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-[var(--dash-ink)]">{admin.user.fullName}</h2>
                <p className="text-sm text-[var(--dash-muted)]">
                  {admin.user.phoneNumber}
                  {admin.user.email ? ` · ${admin.user.email}` : ""}
                </p>
              </div>
              <DashBadge>
                {admin.role} · {admin.status}
              </DashBadge>
            </div>
            <p className="mt-3 text-xs text-[var(--dash-muted)]">
              Permissions: {permissionsForRole(admin.role, admin.permissions).join(", ")}
            </p>
          </DashCard>
        ))}
      </div>
    </div>
  );
}
