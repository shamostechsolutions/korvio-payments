import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { prisma } from "@/lib/db";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { daysRemaining, formatMoney } from "@/lib/utils/money";
import { whatsappJoinLink } from "@/lib/utils/codes";
import { publicStatusLabel } from "@/lib/status";

export default async function CampaignOverviewPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { campaignId } = await params;
  const access = await getCampaignAccess(campaignId, user);
  if (!access) notFound();

  const campaign = access.campaign;
  const [contributors, recentPayments] = await Promise.all([
    prisma.contributor.findMany({
      where: { campaignId: campaign.id },
      orderBy: { lastActivityAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { campaignId: campaign.id, paymentStatus: "SUCCESSFUL" },
      include: { contributor: true },
      orderBy: { completedAt: "desc" },
      take: 6,
    }),
  ]);

  const wa = whatsappJoinLink(
    process.env.WHATSAPP_BUSINESS_NUMBER || "256700000000",
    campaign.campaignCode,
  );
  const qr = await QRCode.toDataURL(wa, { margin: 1, width: 180 });
  const counts = {
    fullyPaid: contributors.filter((c) =>
      ["FULLY_PAID", "PAID_WITHOUT_PLEDGE", "OVERPAID"].includes(c.status),
    ).length,
    partiallyPaid: contributors.filter((c) => c.status === "PARTIALLY_PAID").length,
    pledged: contributors.filter((c) => c.status === "PLEDGED").length,
    unpaid: contributors.filter((c) =>
      ["JOINED", "NOT_YET_PLEDGED", "NOT_JOINED"].includes(c.status),
    ).length,
  };

  return (
    <div className="space-y-6">
      <div className="surface rounded-3xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
              {campaign.campaignCode}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-700 text-[var(--brand)]">
              {campaign.name}
            </h1>
            <p className="mt-2 max-w-2xl text-[var(--ink-soft)]">{campaign.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/c/${campaign.campaignCode}`} target="_blank">
              <Button variant="secondary">Public page</Button>
            </Link>
            <Link href={`/dashboard/campaigns/${campaign.id}/updates`}>
              <Button>Group update</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Target"
          value={formatMoney(campaign.targetAmount, campaign.currency)}
        />
        <StatCard
          label="Pledged"
          value={formatMoney(campaign.totalPledged, campaign.currency)}
        />
        <StatCard
          label="Received"
          value={formatMoney(campaign.totalReceived, campaign.currency)}
        />
        <StatCard
          label="Available balance"
          value={formatMoney(campaign.availableBalance, campaign.currency)}
          hint={`Expenses ${formatMoney(campaign.totalExpenses, campaign.currency)}`}
        />
        <StatCard label="Contributors" value={String(contributors.length)} />
        <StatCard label="Fully paid" value={String(counts.fullyPaid)} />
        <StatCard label="Partially paid" value={String(counts.partiallyPaid)} />
        <StatCard
          label="Days remaining"
          value={String(daysRemaining(campaign.deadline))}
          hint={`${counts.unpaid} unpaid · ${counts.pledged} pledged`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="surface rounded-3xl p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-700 text-[var(--brand)]">
            Recent payments
          </h2>
          <div className="mt-4 space-y-3">
            {recentPayments.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">No payments yet.</p>
            ) : (
              recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{p.contributor.displayName}</p>
                    <p className="text-xs text-[var(--ink-soft)]">
                      {publicStatusLabel(p.contributor.status)} · {p.paymentMethod}
                    </p>
                  </div>
                  <p className="font-semibold text-[var(--brand)]">
                    {access.canViewAmounts
                      ? formatMoney(p.amount, campaign.currency)
                      : "••••"}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="surface rounded-3xl p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-700 text-[var(--brand)]">
            WhatsApp join link
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Share this with your group. Members send{" "}
            <span className="font-semibold">JOIN {campaign.campaignCode}</span> to Korvio.
          </p>
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block break-all text-sm font-medium text-[var(--brand-soft)]"
          >
            {wa}
          </a>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Campaign QR code" className="mt-4 rounded-xl border border-[var(--line)]" />
        </section>
      </div>
    </div>
  );
}
