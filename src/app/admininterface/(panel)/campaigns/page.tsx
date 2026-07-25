import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { isOpenFundraising } from "@/lib/campaigns/fundraising";
import { CampaignVerifyToggle } from "@/components/admin/campaign-verify-toggle";
import { formatMoney } from "@/lib/utils/money";

export default async function AdminCampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    where: { status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { fullName: true, email: true, phoneNumber: true } },
      _count: { select: { contributors: true, payments: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--dash-ink)]">All campaigns</h1>
        <p className="mt-1 text-sm text-[var(--dash-muted)]">
          {campaigns.length} active campaigns on the platform.
        </p>
      </div>

      <section className="dash-card overflow-x-auto p-5">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--dash-border)] text-[var(--dash-muted)]">
              <th className="pb-3 pr-4 font-medium">Campaign</th>
              <th className="pb-3 pr-4 font-medium">Organiser</th>
              <th className="pb-3 pr-4 font-medium">Raised</th>
              <th className="pb-3 pr-4 font-medium">Wallet</th>
              <th className="pb-3 pr-4 font-medium">Contributors</th>
              <th className="pb-3 pr-4 font-medium">Verified</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b border-[var(--dash-border)] last:border-0">
                <td className="py-3 pr-4">
                  <Link
                    href={`/c/${c.campaignCode}`}
                    target="_blank"
                    className="font-medium text-[var(--dash-ink)] hover:text-teal-400"
                  >
                    {c.name}
                  </Link>
                  <p className="text-xs text-[var(--dash-muted)]">
                    {c.campaignCode} · {c.category.replaceAll("_", " ")}
                    {isOpenFundraising(c) ? " · Open" : ""}
                  </p>
                  <p className="text-xs text-[var(--dash-muted)]">
                    Created {format(c.createdAt, "MMM d, yyyy")}
                  </p>
                </td>
                <td className="py-3 pr-4 text-[var(--dash-muted)]">
                  <span className="block font-medium text-[var(--dash-ink)]">{c.organiserName}</span>
                  {c.owner.email ?? c.organiserPhone}
                </td>
                <td className="py-3 pr-4 font-semibold text-emerald-400">
                  {formatMoney(c.totalReceived, c.currency)}
                  {!isOpenFundraising(c) ? (
                    <span className="block text-xs font-normal text-[var(--dash-muted)]">
                      / {formatMoney(c.targetAmount, c.currency)}
                    </span>
                  ) : null}
                </td>
                <td className="py-3 pr-4 text-[var(--dash-ink)]">
                  {formatMoney(c.availableBalance, c.currency)}
                </td>
                <td className="py-3 pr-4 text-[var(--dash-muted)]">{c._count.contributors}</td>
                <td className="py-3 pr-4">
                  <CampaignVerifyToggle campaignId={c.id} isVerified={c.isVerified} />
                </td>
                <td className="py-3">
                  <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400">
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
