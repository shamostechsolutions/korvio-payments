import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils/money";
import { StatCard } from "@/components/ui/stat-card";

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
      <div className="surface rounded-3xl p-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-700 text-[var(--brand)]">
          Budget
        </h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Track planned spend against available campaign funds.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Planned"
          value={formatMoney(planned, access.campaign.currency)}
        />
        <StatCard
          label="Spent"
          value={formatMoney(spent, access.campaign.currency)}
        />
        <StatCard
          label="Remaining budget"
          value={formatMoney(remaining, access.campaign.currency)}
        />
        <StatCard
          label="Funding gap"
          value={formatMoney(fundingGap, access.campaign.currency)}
          hint={`Available ${formatMoney(access.campaign.availableBalance, access.campaign.currency)}`}
        />
      </div>

      <div className="surface overflow-x-auto rounded-3xl">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] text-[var(--ink-soft)]">
            <tr>
              <th className="px-4 py-3">Budget item</th>
              <th className="px-4 py-3">Planned</th>
              <th className="px-4 py-3">Spent</th>
              <th className="px-4 py-3">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">
                  {formatMoney(item.planned, access.campaign.currency)}
                </td>
                <td className="px-4 py-3">
                  {formatMoney(item.spent, access.campaign.currency)}
                </td>
                <td className="px-4 py-3">
                  {formatMoney(item.planned - item.spent, access.campaign.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
