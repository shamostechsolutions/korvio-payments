import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { canCloseCampaign } from "@/lib/campaigns/cashout-rules";
import { getCampaignWallet } from "@/lib/campaigns/cashout";
import { CampaignWalletPanel } from "@/components/dashboard/campaign-wallet-panel";
import { DashPageHeader } from "@/components/dashboard/dash-page";
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
      <DashPageHeader
        title="Wallet & cash-out"
        description="Withdraw to mobile money in parts or all at once. Completed payouts appear on your public page."
      />

      <CampaignWalletPanel
        campaignId={access.campaign.id}
        currency={wallet.campaign.currency}
        organiserPhone={wallet.campaign.organiserPhone}
        campaignStatus={wallet.campaign.status}
        fundraisingMode={wallet.campaign.fundraisingMode ?? "GOAL"}
        availableBalance={wallet.availableBalance}
        minCashoutAmount={wallet.minCashoutAmount}
        effectiveMinCashout={wallet.effectiveMinCashout}
        canRequestCashout={wallet.canRequestCashout}
        canCloseCampaign={access.has("campaign.close") && canCloseCampaign(wallet.campaign.status)}
        initialCashouts={wallet.cashouts.map((c) => ({
          id: c.id,
          amount: c.amount,
          platformFee: c.platformFee,
          netAmount: c.netAmount,
          payoutPhone: c.payoutPhone,
          payoutRecipientName: c.payoutRecipientName,
          status: c.status,
          requestedAt: c.requestedAt.toISOString(),
          processedAt: c.processedAt?.toISOString() ?? null,
        }))}
      />
      <KorvioDisclaimer className="max-w-3xl text-[var(--dash-muted)]" />
    </div>
  );
}
