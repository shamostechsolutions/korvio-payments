import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { getCampaignWallet } from "@/lib/campaigns/cashout";
import { CampaignWalletPanel } from "@/components/dashboard/campaign-wallet-panel";
import { KorvioDisclaimer } from "@/components/legal/disclaimer";

export default async function CampaignWalletPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { campaignId } = await params;
  const access = await getCampaignAccess(campaignId, user);
  if (!access || !access.canViewAmounts) notFound();

  const wallet = await getCampaignWallet(access.campaign.id);

  return (
    <div className="space-y-6">
      <CampaignWalletPanel
        campaignId={access.campaign.id}
        currency={wallet.campaign.currency}
        organiserPhone={wallet.campaign.organiserPhone}
        campaignStatus={wallet.campaign.status}
        availableBalance={wallet.availableBalance}
        canRequestCashout={wallet.canRequestCashout}
        initialCashouts={wallet.cashouts.map((c) => ({
          id: c.id,
          amount: c.amount,
          platformFee: c.platformFee,
          netAmount: c.netAmount,
          payoutPhone: c.payoutPhone,
          status: c.status,
          requestedAt: c.requestedAt.toISOString(),
          processedAt: c.processedAt?.toISOString() ?? null,
        }))}
      />
      <KorvioDisclaimer className="max-w-3xl" />
    </div>
  );
}
