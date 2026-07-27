import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { isOpenFundraising } from "@/lib/campaigns/fundraising";
import { CampaignAdminActions } from "@/components/admin/campaign-admin-actions";
import { CampaignVerifyToggle } from "@/components/admin/campaign-verify-toggle";
import { formatMoney } from "@/lib/utils/money";

function statusBadge(status: string) {
  if (status === "DRAFT") {
    return "rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400";
  }
  if (status === "ACTIVE") {
    return "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400";
  }
  return "rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400";
}

function statusLabel(status: string) {
  if (status === "DRAFT") return "Pending approval";
  return status;
}

export default async function AdminCampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    where: { status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { fullName: true, email: true, phoneNumber: true } },
      _count: { select: { contributors: true, payments: true } },
    },
  });

  const pending = campaigns.filter((c) => c.status === "DRAFT");
  const deletionRequests = campaigns.filter((c) => c.deletionRequestedAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--dash-ink)]">All campaigns</h1>
        <p className="mt-1 text-sm text-[var(--dash-muted)]">
          {campaigns.length} on platform · {pending.length} awaiting your approval
          {deletionRequests.length ? ` · ${deletionRequests.length} deletion request${deletionRequests.length === 1 ? "" : "s"}` : ""}
        </p>
      </div>

      {deletionRequests.length ? (
        <section className="dash-card border-red-500/20 p-5">
          <h2 className="text-base font-semibold text-red-400">Deletion requests</h2>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">
            Organisers asked to remove these live campaigns. Review and delete when appropriate.
          </p>
          <ul className="mt-4 space-y-3">
            {deletionRequests.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-[var(--dash-ink)]">{c.name}</p>
                  <p className="text-xs text-[var(--dash-muted)]">
                    {c.campaignCode} · requested {format(c.deletionRequestedAt!, "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
                <CampaignAdminActions
                  campaignId={c.id}
                  status={c.status}
                  deletionRequestedAt={c.deletionRequestedAt}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {pending.length ? (
        <section className="dash-card border-amber-500/20 p-5">
          <h2 className="text-base font-semibold text-amber-400">Pending approval</h2>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">
            These campaigns are not public yet. Review and approve before they can accept
            contributions.
          </p>
          <ul className="mt-4 space-y-3">
            {pending.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-[var(--dash-ink)]">{c.name}</p>
                  <p className="text-xs text-[var(--dash-muted)]">
                    {c.campaignCode} · {c.organiserName} · {format(c.createdAt, "MMM d, yyyy")}
                  </p>
                </div>
                <CampaignAdminActions campaignId={c.id} status={c.status} deletionRequestedAt={c.deletionRequestedAt} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="dash-card hidden overflow-x-auto p-5 md:block">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--dash-border)] text-[var(--dash-muted)]">
              <th className="pb-3 pr-4 font-medium">Campaign</th>
              <th className="pb-3 pr-4 font-medium">Organiser</th>
              <th className="pb-3 pr-4 font-medium">Raised</th>
              <th className="pb-3 pr-4 font-medium">Wallet</th>
              <th className="pb-3 pr-4 font-medium">Contributors</th>
              <th className="pb-3 pr-4 font-medium">Verified</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b border-[var(--dash-border)] last:border-0">
                <td className="py-3 pr-4">
                  {c.status === "ACTIVE" ? (
                    <Link
                      href={`/c/${c.campaignCode}`}
                      target="_blank"
                      className="font-medium text-[var(--dash-ink)] hover:text-teal-400"
                    >
                      {c.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-[var(--dash-ink)]">{c.name}</span>
                  )}
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
                <td className="py-3 pr-4">
                  <span className={statusBadge(c.status)}>{statusLabel(c.status)}</span>
                  {c.deletionRequestedAt ? (
                    <p className="mt-1 text-xs font-medium text-red-400">Deletion requested</p>
                  ) : null}
                </td>
                <td className="py-3">
                  <CampaignAdminActions
                    campaignId={c.id}
                    status={c.status}
                    deletionRequestedAt={c.deletionRequestedAt}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-3 md:hidden">
        {campaigns.map((c) => (
          <article key={c.id} className="dash-card space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                {c.status === "ACTIVE" ? (
                  <Link
                    href={`/c/${c.campaignCode}`}
                    target="_blank"
                    className="font-medium text-[var(--dash-ink)] hover:text-teal-400"
                  >
                    {c.name}
                  </Link>
                ) : (
                  <p className="font-medium text-[var(--dash-ink)]">{c.name}</p>
                )}
                <p className="mt-1 text-xs text-[var(--dash-muted)]">
                  {c.campaignCode} · {c.category.replaceAll("_", " ")}
                  {isOpenFundraising(c) ? " · Open" : ""}
                </p>
                <p className="text-xs text-[var(--dash-muted)]">
                  Created {format(c.createdAt, "MMM d, yyyy")}
                </p>
              </div>
              <span className={statusBadge(c.status)}>{statusLabel(c.status)}</span>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-[var(--dash-muted)]">Organiser</dt>
                <dd className="mt-0.5 font-medium text-[var(--dash-ink)]">{c.organiserName}</dd>
                <dd className="text-xs text-[var(--dash-muted)]">{c.owner.email ?? c.organiserPhone}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--dash-muted)]">Contributors</dt>
                <dd className="mt-0.5 font-medium text-[var(--dash-ink)]">{c._count.contributors}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--dash-muted)]">Raised</dt>
                <dd className="mt-0.5 font-semibold text-emerald-400">
                  {formatMoney(c.totalReceived, c.currency)}
                  {!isOpenFundraising(c) ? (
                    <span className="block text-xs font-normal text-[var(--dash-muted)]">
                      / {formatMoney(c.targetAmount, c.currency)}
                    </span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--dash-muted)]">Wallet</dt>
                <dd className="mt-0.5 font-medium text-[var(--dash-ink)]">
                  {formatMoney(c.availableBalance, c.currency)}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--dash-border)] pt-3">
              <CampaignVerifyToggle campaignId={c.id} isVerified={c.isVerified} />
              <CampaignAdminActions campaignId={c.id} status={c.status} deletionRequestedAt={c.deletionRequestedAt} />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
