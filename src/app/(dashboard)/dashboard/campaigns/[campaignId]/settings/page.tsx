import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getCampaignAccess } from "@/lib/campaigns/access";
import { formatMoney } from "@/lib/utils/money";

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

  const rows = [
    ["Campaign code", c.campaignCode],
    ["Status", c.status],
    ["Category", c.category],
    ["Currency", c.currency],
    ["Target", formatMoney(c.targetAmount, c.currency)],
    ["Start date", c.startDate.toISOString().slice(0, 10)],
    ["Deadline", c.deadline.toISOString().slice(0, 10)],
    ["Organiser", `${c.organiserName} (${c.organiserPhone})`],
    ["Beneficiary", c.beneficiaryName || "—"],
    ["Contributor list", c.contributorListVisibility],
    ["Amount visibility", c.contributionAmountVisibility],
    ["Allow pledges", c.allowPledges ? "Yes" : "No"],
    ["Allow partial payments", c.allowPartialPayments ? "Yes" : "No"],
    ["Allow anonymous", c.allowAnonymous ? "Yes" : "No"],
    ["Allow in-kind", c.allowInKind ? "Yes" : "No"],
    ["Payment methods", c.paymentMethods.join(", ")],
    ["Reminder frequency (days)", String(c.reminderFrequencyDays)],
  ];

  return (
    <div className="space-y-6">
      <div className="surface rounded-3xl p-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-700 text-[var(--brand)]">
          Campaign settings
        </h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Privacy and payment rules for this campaign.
        </p>
      </div>
      <div className="surface rounded-3xl p-5">
        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                {label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-[var(--ink)]">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
