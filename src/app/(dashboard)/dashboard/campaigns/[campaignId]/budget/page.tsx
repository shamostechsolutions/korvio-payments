import { notFound, redirect } from "next/navigation";
import { PiggyBank, Target, TrendingDown, Wallet } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { prisma } from "@/lib/db";
import { DashPageHeader, DashTableWrap } from "@/components/dashboard/dash-page";
import { DashStatCard } from "@/components/dashboard/dash-stat-card";
import { formatMoney } from "@/lib/utils/money";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { campaignId } = await params;
  const access = await getCampaignAccess(campaignId, user);
  if (!access) notFound();

  let items = await prisma.budgetItem.findMany({
    where: { campaignId: access.campaign.id },
    orderBy: { name: "asc" },
  });

  if (items.length === 0) {
    items = await prisma.$transaction([
      prisma.budgetItem.create({
        data: {
          campaignId: access.campaign.id,
          name: "Venue",
          planned: Math.round(access.campaign.targetAmount * 0.2),
        },
      }),
      prisma.budgetItem.create({
        data: {
          campaignId: access.campaign.id,
          name: "Food",
          planned: Math.round(access.campaign.targetAmount * 0.35),
        },
      }),
      prisma.budgetItem.create({
        data: {
          campaignId: access.campaign.id,
          name: "Decorations",
          planned: Math.round(access.campaign.targetAmount * 0.15),
        },
      }),
    ]);
  }

  const planned = items.reduce((s, i) => s + i.planned, 0);
  const spent = items.reduce((s, i) => s + i.spent, 0);
  const remaining = planned - spent;
  const fundingGap = Math.max(0, planned - access.campaign.totalReceived);

  return (
    <div className="space-y-6">
      <DashPageHeader
        title="Budget"
        description="Track planned spend against available campaign funds."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashStatCard
          label="Planned"
          value={formatMoney(planned, access.campaign.currency)}
          icon={Target}
        />
        <DashStatCard
          label="Spent"
          value={formatMoney(spent, access.campaign.currency)}
          icon={TrendingDown}
          accent="warning"
        />
        <DashStatCard
          label="Remaining budget"
          value={formatMoney(remaining, access.campaign.currency)}
          icon={PiggyBank}
        />
        <DashStatCard
          label="Funding gap"
          value={formatMoney(fundingGap, access.campaign.currency)}
          hint={`Available ${formatMoney(access.campaign.availableBalance, access.campaign.currency)}`}
          icon={Wallet}
          accent="success"
        />
      </div>

      <DashTableWrap>
        <thead>
          <tr>
            <th>Budget item</th>
            <th>Planned</th>
            <th>Spent</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="font-medium">{item.name}</td>
              <td>{formatMoney(item.planned, access.campaign.currency)}</td>
              <td>{formatMoney(item.spent, access.campaign.currency)}</td>
              <td className="text-emerald-400">
                {formatMoney(item.planned - item.spent, access.campaign.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </DashTableWrap>
    </div>
  );
}
