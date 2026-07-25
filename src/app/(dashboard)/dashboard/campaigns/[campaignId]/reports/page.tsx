import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { Button } from "@/components/ui/button";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { campaignId } = await params;
  const access = await getCampaignAccess(campaignId, user);
  if (!access) notFound();

  return (
    <div className="space-y-6">
      <div className="surface rounded-3xl p-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-700 text-[var(--brand)]">
          Reports
        </h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Download campaign accountability reports. Financial detail depends on your role.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Summary (JSON)",
            href: `/api/campaigns/${access.campaign.id}/reports?format=json`,
          },
          {
            title: "Contributors CSV",
            href: `/api/campaigns/${access.campaign.id}/reports?format=csv`,
          },
          {
            title: "Full Excel report",
            href: `/api/campaigns/${access.campaign.id}/reports?format=xlsx`,
          },
        ].map((item) => (
          <a key={item.title} href={item.href} className="surface rounded-3xl p-5">
            <h2 className="font-semibold text-[var(--brand)]">{item.title}</h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Includes only the fields your role is allowed to see.
            </p>
            <div className="mt-4">
              <Button size="sm">Download</Button>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
