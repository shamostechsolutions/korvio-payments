"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { DashCard, DashMessage, DashPageHeader, DashTableWrap } from "@/components/dashboard/dash-page";
import { Input, Label, Textarea } from "@/components/ui/input";
import { publicStatusLabel } from "@/lib/status";

type Contributor = {
  id: string;
  displayName: string;
  phoneNumber: string;
  status: string;
  pledgedAmount: number | null;
  paidAmount: number | null;
  outstandingAmount: number | null;
  lastPaymentAt: string | null;
  reminderCount: number;
};

export default function ContributorsPage() {
  const params = useParams<{ campaignId: string }>();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [canViewAmounts, setCanViewAmounts] = useState(false);
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  async function load(search = q) {
    const res = await fetch(
      `/api/campaigns/${params.campaignId}/contributors?q=${encodeURIComponent(search)}`,
    );
    const data = await res.json();
    if (res.ok) {
      setContributors(data.contributors);
      setCanViewAmounts(data.canViewAmounts);
    }
  }

  useEffect(() => {
    startTransition(() => {
      void load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.campaignId]);

  async function addContributor(formData: FormData) {
    setMessage("");
    const res = await fetch(`/api/campaigns/${params.campaignId}/contributors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: formData.get("displayName"),
        phoneNumber: formData.get("phoneNumber"),
        email: formData.get("email") || undefined,
        notes: formData.get("notes") || undefined,
      }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Contributor added." : data.error || "Failed");
    if (res.ok) void load();
  }

  async function importList(formData: FormData) {
    const raw = String(formData.get("importText") || "");
    const rows = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [displayName, phoneNumber] = line.split(/[,\t]/).map((s) => s.trim());
        return { displayName, phoneNumber };
      });

    const res = await fetch(`/api/campaigns/${params.campaignId}/contributors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const data = await res.json();
    setMessage(res.ok ? `Imported ${data.imported} contributors.` : data.error || "Import failed");
    if (res.ok) void load();
  }

  return (
    <div className="space-y-6">
      <DashPageHeader
        title="Contributors"
        description="Add names now. Amounts stay private until people pledge or pay."
      />

      <DashCard>
        <div className="flex flex-wrap gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or phone"
            className="max-w-sm"
          />
          <button type="button" className="dash-btn-secondary" onClick={() => void load(q)}>
            Search
          </button>
        </div>
      </DashCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={addContributor} className="dash-card space-y-3 p-5">
          <h2 className="font-semibold text-[var(--dash-ink)]">Add contributor</h2>
          <div>
            <Label>Full name</Label>
            <Input name="displayName" required />
          </div>
          <div>
            <Label>Phone</Label>
            <Input name="phoneNumber" required placeholder="2567..." />
          </div>
          <div>
            <Label>Email (optional)</Label>
            <Input name="email" type="email" />
          </div>
          <div>
            <Label>Notes</Label>
            <Input name="notes" />
          </div>
          <button type="submit" className="dash-btn-primary" disabled={pending}>
            Add
          </button>
        </form>

        <form action={importList} className="dash-card space-y-3 p-5">
          <h2 className="font-semibold text-[var(--dash-ink)]">Import list</h2>
          <p className="text-sm text-[var(--dash-muted)]">One name per line, or `Name, Phone`.</p>
          <Textarea
            name="importText"
            rows={8}
            placeholder={"Moses\nEmma, 256700000001\nPeter, 256700000002"}
          />
          <button type="submit" className="dash-btn-secondary">
            Import
          </button>
        </form>
      </div>

      {message ? <DashMessage type="success">{message}</DashMessage> : null}

      <DashTableWrap>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Status</th>
            {canViewAmounts ? (
              <>
                <th>Pledged</th>
                <th>Paid</th>
                <th>Outstanding</th>
              </>
            ) : null}
            <th>Reminders</th>
          </tr>
        </thead>
        <tbody>
          {contributors.map((c) => (
            <tr key={c.id}>
              <td className="font-medium">{c.displayName}</td>
              <td>{c.phoneNumber}</td>
              <td>{publicStatusLabel(c.status as never)}</td>
              {canViewAmounts ? (
                <>
                  <td>{c.pledgedAmount ?? 0}</td>
                  <td>{c.paidAmount ?? 0}</td>
                  <td>{c.outstandingAmount ?? 0}</td>
                </>
              ) : null}
              <td>{c.reminderCount}</td>
            </tr>
          ))}
        </tbody>
      </DashTableWrap>
    </div>
  );
}
