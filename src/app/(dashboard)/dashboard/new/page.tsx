"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DashShell } from "@/components/dashboard/dash-shell";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashPageHeader } from "@/components/dashboard/dash-page";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { OPEN_FUNDRAISING_DEFAULT_CATEGORIES } from "@/lib/campaigns/fundraising";
import {
  PLATFORM_FEE_PERCENT_LABEL,
  calculateCashoutNet,
} from "@/lib/payments/fees";
import { formatMoney } from "@/lib/utils/money";

const categories = [
  "WEDDING",
  "INTRODUCTION",
  "FUNERAL",
  "MEDICAL",
  "EDUCATION",
  "CHURCH",
  "ALUMNI",
  "COMMUNITY",
  "OFFICE",
  "BIRTHDAY",
  "FAMILY_EMERGENCY",
  "ASSOCIATION",
  "MEMBERSHIP",
  "FUNDRAISING",
  "OTHER",
];

type FundraisingMode = "GOAL" | "OPEN";

export default function NewCampaignPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("WEDDING");
  const [fundraisingMode, setFundraisingMode] = useState<FundraisingMode>("GOAL");

  useEffect(() => {
    if (OPEN_FUNDRAISING_DEFAULT_CATEGORIES.has(category)) {
      setFundraisingMode("OPEN");
    }
  }, [category]);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    const mode = (formData.get("fundraisingMode") as FundraisingMode) || "GOAL";
    const payload = {
      name: formData.get("name"),
      category: formData.get("category"),
      description: formData.get("description"),
      currency: formData.get("currency") || "UGX",
      fundraisingMode: mode,
      targetAmount: mode === "GOAL" ? formData.get("targetAmount") : undefined,
      startDate: formData.get("startDate"),
      deadline: formData.get("deadline"),
      organiserName: formData.get("organiserName"),
      organiserPhone: formData.get("organiserPhone"),
      beneficiaryName: formData.get("beneficiaryName") || undefined,
      contactPerson: formData.get("contactPerson") || undefined,
      campaignCode: formData.get("campaignCode") || undefined,
      imageUrl: formData.get("imageUrl") || undefined,
      allowPledges: mode === "OPEN" ? false : formData.get("allowPledges") === "on",
      allowPartialPayments: formData.get("allowPartialPayments") === "on",
      allowAnonymous: formData.get("allowAnonymous") === "on",
      allowInKind: formData.get("allowInKind") === "on",
      contributorListVisibility: formData.get("contributorListVisibility"),
      contributionAmountVisibility: formData.get("contributionAmountVisibility"),
    };

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Unable to create campaign");
      return;
    }
    router.push(`/dashboard/campaigns/${data.campaign.id}/overview`);
  }

  return (
    <DashShell sidebar={<DashboardSidebar />}>
      <div className="dash-card p-6 md:p-8">
        <DashPageHeader
          title="Create a campaign"
          description="Choose a fundraising goal or open contributions. After Korvio reviews and approves your campaign, you will get a public link to share."
        />

        <form action={onSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 space-y-3 rounded-xl border border-[var(--line)] p-4">
            <Label>Fundraising type</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer gap-3 rounded-xl border border-[var(--line)] p-4 has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--brand)]/5">
                <input
                  type="radio"
                  name="fundraisingMode"
                  value="GOAL"
                  checked={fundraisingMode === "GOAL"}
                  onChange={() => setFundraisingMode("GOAL")}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold text-[var(--ink)]">
                    Fundraising goal
                  </span>
                  <span className="mt-1 block text-xs text-[var(--ink-soft)]">
                    Set a target amount — weddings, introductions, medical bills.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer gap-3 rounded-xl border border-[var(--line)] p-4 has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--brand)]/5">
                <input
                  type="radio"
                  name="fundraisingMode"
                  value="OPEN"
                  checked={fundraisingMode === "OPEN"}
                  onChange={() => setFundraisingMode("OPEN")}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold text-[var(--ink)]">
                    Open contributions
                  </span>
                  <span className="mt-1 block text-xs text-[var(--ink-soft)]">
                    No fixed target — funerals, emergencies, community support.
                  </span>
                </span>
              </label>
            </div>
          </div>

          {fundraisingMode === "GOAL" ? (
            <div className="md:col-span-2">
              <Label>Target amount</Label>
              <Input name="targetAmount" required placeholder="20000000" />
            </div>
          ) : (
            <div className="md:col-span-2">
              <p className="text-sm text-[var(--ink-soft)]">
                Contributors can give any amount. The campaign stays open until you close it or the
                deadline passes.
              </p>
            </div>
          )}

          <div className="md:col-span-2">
            <Label>Campaign name</Label>
            <Input name="name" required placeholder="Moses & Sharon Wedding Contribution" />
          </div>
          <div>
            <Label>Category</Label>
            <Select
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Custom code (optional)</Label>
            <Input name="campaignCode" placeholder="MSW-2026" />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              name="description"
              required
              rows={3}
              placeholder="Help us celebrate and cover wedding costs with dignity and accountability."
            />
          </div>
          <div className="md:col-span-2">
            <Label>Cover image URL (optional)</Label>
            <Input name="imageUrl" placeholder="https://example.com/photo.jpg" />
          </div>

          <div>
            <Label>Currency</Label>
            <Select name="currency" defaultValue="UGX">
              <option value="UGX">UGX</option>
              <option value="KES">KES</option>
              <option value="TZS">TZS</option>
              <option value="RWF">RWF</option>
              <option value="USD">USD</option>
            </Select>
          </div>
          <div>
            <Label>Start date</Label>
            <Input name="startDate" type="date" required />
          </div>
          <div>
            <Label>Deadline / event date</Label>
            <Input name="deadline" type="date" required />
          </div>
          <div>
            <Label>Organiser name</Label>
            <Input name="organiserName" required />
          </div>
          <div>
            <Label>Organiser phone</Label>
            <Input name="organiserPhone" required placeholder="256700000000" />
          </div>
          <div>
            <Label>Beneficiary (optional)</Label>
            <Input name="beneficiaryName" />
          </div>
          <div>
            <Label>Contact person</Label>
            <Input name="contactPerson" />
          </div>
          <div>
            <Label>Contributor list visibility</Label>
            <Select name="contributorListVisibility" defaultValue="NAMES_AND_STATUSES">
              <option value="NAMES_AND_STATUSES">Names and statuses</option>
              <option value="NAMES_ONLY">Names only</option>
              <option value="STATUSES_WITHOUT_NAMES">Statuses without names</option>
              <option value="HIDDEN">Hide list</option>
              <option value="OPT_IN_ONLY">Opt-in only</option>
              <option value="AMOUNTS_WHEN_PERMITTED">Amounts when permitted</option>
            </Select>
          </div>
          <div>
            <Label>Individual amount visibility</Label>
            <Select name="contributionAmountVisibility" defaultValue="PRIVATE">
              <option value="PRIVATE">Private</option>
              <option value="PUBLIC_OPT_IN">Public opt-in</option>
              <option value="PUBLIC">Public</option>
            </Select>
          </div>

          <div className="md:col-span-2 grid gap-2 sm:grid-cols-2">
            {[
              ["allowPledges", "Allow pledges"],
              ["allowPartialPayments", "Allow partial payments"],
              ["allowAnonymous", "Allow anonymous contributions"],
              ["allowInKind", "Allow in-kind contributions"],
            ].map(([name, label]) => (
              <label key={name} className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                <input
                  type="checkbox"
                  name={name}
                  defaultChecked={
                    name === "allowPartialPayments" ||
                    (name === "allowPledges" && fundraisingMode === "GOAL")
                  }
                  disabled={name === "allowPledges" && fundraisingMode === "OPEN"}
                  className="h-4 w-4 disabled:opacity-40"
                />
                {label}
                {name === "allowPledges" && fundraisingMode === "OPEN" ? (
                  <span className="text-xs text-[var(--ink-soft)]">(off for open campaigns)</span>
                ) : null}
              </label>
            ))}
          </div>

          {error ? (
            <p className="md:col-span-2 text-sm text-[var(--danger)]">{error}</p>
          ) : null}

          <p className="md:col-span-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink-soft)]">
            <strong className="text-[var(--ink)]">Pricing:</strong> free to create. Contributors
            pay exactly what they enter. When you cash out, Korvio deducts a{" "}
            {PLATFORM_FEE_PERCENT_LABEL} withdrawal fee (includes transfer to your MoMo). Contributors
            pay what they enter — their network may charge separately. Example:{" "}
            {formatMoney(1_000_000, "UGX")} collected →{" "}
            {formatMoney(calculateCashoutNet(1_000_000).netAmount, "UGX")} to your phone.
          </p>

          <div className="md:col-span-2">
            <button type="submit" className="dash-btn-primary inline-flex items-center gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {loading ? "Creating..." : "Create campaign"}
            </button>
          </div>
        </form>
      </div>
    </DashShell>
  );
}
