import { notFound, redirect } from "next/navigation";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { DashPageHeader } from "@/components/dashboard/dash-page";

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

  const reports = [
    {
      title: "Summary (JSON)",
      description: "Machine-readable campaign summary.",
      href: `/api/campaigns/${access.campaign.id}/reports?format=json`,
      icon: FileText,
    },
    {
      title: "Contributors CSV",
      description: "Spreadsheet of contributors and statuses.",
      href: `/api/campaigns/${access.campaign.id}/reports?format=csv`,
      icon: Download,
    },
    {
      title: "Full Excel report",
      description: "Complete financial and contributor report.",
      href: `/api/campaigns/${access.campaign.id}/reports?format=xlsx`,
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="space-y-6">
      <DashPageHeader
        title="Reports"
        description="Download campaign accountability reports. Financial detail depends on your role."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {reports.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.title}
              href={item.href}
              className="dash-card block p-5 transition hover:border-teal-500/30 hover:bg-[var(--dash-card-hover)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-semibold text-[var(--dash-ink)]">{item.title}</h2>
              <p className="mt-2 text-sm text-[var(--dash-muted)]">{item.description}</p>
              <span className="mt-4 inline-flex dash-btn-secondary text-sm">Download</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
