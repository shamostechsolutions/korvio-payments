import { notFound, redirect } from "next/navigation";
import { PublicPageSettings } from "@/components/dashboard/public-page-settings";
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

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-[var(--ink)]">Public page & settings</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Customise your campaign page, post updates, and manage trust badges.
        </p>
      </div>

      {access.role === "OWNER" ? (
        <PublicPageSettings
          campaignId={c.id}
          initialImageUrl={c.imageUrl}
          initialVerified={c.isVerified}
          initialAllowSupport={c.allowSupportMessages}
          publicUrl={publicUrl}
          organiserName={c.organiserName}
        />
      ) : (
        <p className="text-sm text-[var(--ink-soft)]">
          Only the campaign owner can edit public page settings.
        </p>
      )}
    </div>
  );
}
