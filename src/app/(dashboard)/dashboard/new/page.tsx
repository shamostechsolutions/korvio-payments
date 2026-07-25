"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

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

export default function NewCampaignPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    const payload = {
      name: formData.get("name"),
      category: formData.get("category"),
      description: formData.get("description"),
      currency: formData.get("currency") || "UGX",
      targetAmount: formData.get("targetAmount"),
      startDate: formData.get("startDate"),
      deadline: formData.get("deadline"),
      organiserName: formData.get("organiserName"),
      organiserPhone: formData.get("organiserPhone"),
      beneficiaryName: formData.get("beneficiaryName") || undefined,
      contactPerson: formData.get("contactPerson") || undefined,
      campaignCode: formData.get("campaignCode") || undefined,
      imageUrl: formData.get("imageUrl") || undefined,
      allowPledges: formData.get("allowPledges") === "on",
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
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="min-w-0 flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="dash-card p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--dash-ink)] md:text-3xl">
          Create a campaign
        </h1>
        <p className="mt-2 text-sm text-[var(--dash-muted)]">
          Set the target, privacy rules and payment options. Korvio will generate a public page
          link you can share with your group.
        </p>

        <form action={onSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Campaign name</Label>
            <Input name="name" required placeholder="Moses & Sharon Wedding Contribution" />
          </div>
          <div>
            <Label>Category</Label>
            <Select name="category" defaultValue="WEDDING">
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
            <Label>Target amount</Label>
            <Input name="targetAmount" required placeholder="20000000" />
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
                  defaultChecked={name === "allowPledges" || name === "allowPartialPayments"}
                  className="h-4 w-4"
                />
                {label}
              </label>
            ))}
          </div>

          {error ? (
            <p className="md:col-span-2 text-sm text-[var(--danger)]">{error}</p>
          ) : null}

          <div className="md:col-span-2">
            <Button disabled={loading}>{loading ? "Creating..." : "Create campaign"}</Button>
          </div>
        </form>
        </div>
      </main>
    </div>
  );
}
