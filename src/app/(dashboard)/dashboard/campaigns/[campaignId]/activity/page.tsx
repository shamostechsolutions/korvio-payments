import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { prisma } from "@/lib/db";

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
      <div className="surface rounded-3xl p-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-700 text-[var(--brand)]">
          Activity log
        </h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Every important financial and administrative action is recorded.
        </p>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <article key={log.id} className="surface rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-[var(--brand)]">{log.action.replaceAll("_", " ")}</p>
              <p className="text-xs text-[var(--ink-soft)]">
                {log.createdAt.toLocaleString()}
              </p>
            </div>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {log.user?.fullName || "System"} · {log.entityType}
              {log.entityId ? ` · ${log.entityId}` : ""}
            </p>
          </article>
        ))}
        {logs.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">No activity yet.</p>
        ) : null}
      </div>
    </div>
  );
}
