import { notFound, redirect } from "next/navigation";
import { PublicPageSettings } from "@/components/dashboard/public-page-settings";
import { DashCard, DashPageHeader } from "@/components/dashboard/dash-page";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { campaignId } = await params;
  const access = await getCampaignAccess(campaignId, user);
  if (!access) notFound();
  const c = access.campaign;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";
  const publicUrl = `${appUrl.replace(/\/$/, "")}/c/${c.campaignCode}`;

  const isLive = c.status === "ACTIVE";

  return (
    <div className="space-y-6">
      <DashPageHeader
        title="Public page"
        description="Customise your campaign page, post updates, and manage trust badges."
      />

      {!isLive ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-[var(--dash-ink)]">
          <span className="font-semibold text-amber-400">Pending approval</span>
          {" — "}
          Your public page is not live yet. You can prepare settings below, but do not share any
          link until Korvio approves the campaign.
        </div>
      ) : null}

      {access.role === "OWNER" ? (
        <PublicPageSettings
          campaignId={c.id}
          initialImageUrl={c.imageUrl}
          initialVerified={c.isVerified}
          initialAllowSupport={c.allowSupportMessages}
          publicUrl={publicUrl}
          organiserName={c.organiserName}
          isLive={isLive}
        />
      ) : (
        <DashCard>
          <p className="text-sm text-[var(--dash-muted)]">
            Only the campaign owner can edit public page settings.
          </p>
        </DashCard>
      )}
    </div>
  );
}
