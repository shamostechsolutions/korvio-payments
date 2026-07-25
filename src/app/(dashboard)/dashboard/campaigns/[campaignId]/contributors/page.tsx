"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
      <div className="surface rounded-3xl p-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-700 text-[var(--brand)]">
          Contributors
        </h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Add names now. Amounts stay private until people pledge or pay.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or phone"
            className="max-w-sm"
          />
          <Button type="button" variant="secondary" onClick={() => void load(q)}>
            Search
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={addContributor} className="surface space-y-3 rounded-3xl p-5">
          <h2 className="font-semibold text-[var(--brand)]">Add contributor</h2>
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
          <Button disabled={pending}>Add</Button>
        </form>

        <form action={importList} className="surface space-y-3 rounded-3xl p-5">
          <h2 className="font-semibold text-[var(--brand)]">Import list</h2>
          <p className="text-sm text-[var(--ink-soft)]">
            One name per line, or `Name, Phone`.
          </p>
          <Textarea
            name="importText"
            rows={8}
            placeholder={"Moses\nEmma, 256700000001\nPeter, 256700000002"}
          />
          <Button variant="secondary">Import</Button>
        </form>
      </div>

      {message ? <p className="text-sm text-[var(--brand-soft)]">{message}</p> : null}

      <div className="surface overflow-x-auto rounded-3xl">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] text-[var(--ink-soft)]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canViewAmounts ? (
                <>
                  <th className="px-4 py-3 font-medium">Pledged</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Outstanding</th>
                </>
              ) : null}
              <th className="px-4 py-3 font-medium">Reminders</th>
            </tr>
          </thead>
          <tbody>
            {contributors.map((c) => (
              <tr key={c.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3 font-medium">{c.displayName}</td>
                <td className="px-4 py-3">{c.phoneNumber}</td>
                <td className="px-4 py-3">
                  {publicStatusLabel(c.status as never)}
                </td>
                {canViewAmounts ? (
                  <>
                    <td className="px-4 py-3">{c.pledgedAmount ?? 0}</td>
                    <td className="px-4 py-3">{c.paidAmount ?? 0}</td>
                    <td className="px-4 py-3">{c.outstandingAmount ?? 0}</td>
                  </>
                ) : null}
                <td className="px-4 py-3">{c.reminderCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
