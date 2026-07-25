import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { prisma } from "@/lib/db";
import { DashCard, DashPageHeader } from "@/components/dashboard/dash-page";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { campaignId } = await params;
  const access = await getCampaignAccess(campaignId, user);
  if (!access || !access.has("audit.view")) {
    if (!access) notFound();
    redirect(`/dashboard/campaigns/${access.campaign.id}/overview`);
  }

  const logs = await prisma.auditLog.findMany({
    where: { campaignId: access.campaign.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <DashPageHeader
        title="Activity log"
        description="Every important financial and administrative action is recorded."
      />

      <div className="space-y-2">
        {logs.map((log) => (
          <DashCard key={log.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium capitalize text-teal-400">
                {log.action.replaceAll("_", " ")}
              </p>
              <p className="text-xs text-[var(--dash-muted)]">{log.createdAt.toLocaleString()}</p>
            </div>
            <p className="mt-1 text-sm text-[var(--dash-muted)]">
              {log.user?.fullName || "System"} · {log.entityType}
              {log.entityId ? ` · ${log.entityId}` : ""}
            </p>
          </DashCard>
        ))}
        {logs.length === 0 ? (
          <p className="text-sm text-[var(--dash-muted)]">No activity yet.</p>
        ) : null}
      </div>
    </div>
  );
}
