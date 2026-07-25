import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { DashShell } from "@/components/dashboard/dash-shell";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ campaignId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { campaignId } = await params;
  const access = await getCampaignAccess(campaignId, user);
  if (!access) notFound();

  return (
    <DashShell
      sidebar={
        <DashboardSidebar
          campaignId={access.campaign.id}
          campaignName={access.campaign.name}
          userName={user.fullName}
        />
      }
    >
      {children}
    </DashShell>
  );
}
