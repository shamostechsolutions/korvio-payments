"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

type Contributor = { id: string; displayName: string; phoneNumber: string };
type Payment = {
  id: string;
  amount: number | null;
  paymentMethod: string;
  paymentStatus: string;
  transactionReference: string;
  manualPayment: boolean;
  completedAt: string | null;
  contributor: Contributor;
};

export default function PaymentsPage() {
  const params = useParams<{ campaignId: string }>();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const [payRes, contribRes] = await Promise.all([
      fetch(`/api/campaigns/${params.campaignId}/payments`),
      fetch(`/api/campaigns/${params.campaignId}/contributors`),
    ]);
    const payData = await payRes.json();
    const contribData = await contribRes.json();
    if (payRes.ok) setPayments(payData.payments);
    if (contribRes.ok) setContributors(contribData.contributors);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.campaignId]);

  async function recordPayment(formData: FormData) {
    setMessage("");
    const res = await fetch(`/api/campaigns/${params.campaignId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contributorId: formData.get("contributorId"),
        amount: formData.get("amount"),
        paymentMethod: formData.get("paymentMethod"),
        paymentDate: formData.get("paymentDate"),
        reference: formData.get("reference") || undefined,
        notes: formData.get("notes") || undefined,
        notifyContributor: true,
      }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Payment recorded." : data.error || "Failed");
    if (res.ok) void load();
  }

  return (
    <div className="space-y-6">
      <div className="surface rounded-3xl p-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-700 text-[var(--brand)]">
          Payments
        </h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Record cash, bank and direct mobile money payments. Contributors receive a private confirmation.
        </p>
      </div>

      <form action={recordPayment} className="surface grid gap-3 rounded-3xl p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="font-semibold text-[var(--brand)]">Record manual payment</h2>
        </div>
        <div>
          <Label>Contributor</Label>
          <Select name="contributorId" required defaultValue="">
            <option value="" disabled>
              Select contributor
            </option>
            {contributors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName} · {c.phoneNumber}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Amount</Label>
          <Input name="amount" required placeholder="100000" />
        </div>
        <div>
          <Label>Payment method</Label>
          <Select name="paymentMethod" defaultValue="CASH">
            <option value="CASH">Cash</option>
            <option value="MTN_MOMO">Direct MTN Mobile Money</option>
            <option value="AIRTEL_MONEY">Direct Airtel Money</option>
            <option value="BANK">Bank transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="IN_PERSON">In-person collection</option>
            <option value="DIRECT_TO_TREASURER">Direct to treasurer</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
        <div>
          <Label>Payment date</Label>
          <Input
            name="paymentDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div>
          <Label>Reference (optional)</Label>
          <Input name="reference" />
        </div>
        <div>
          <Label>Notes</Label>
          <Input name="notes" />
        </div>
        <div className="md:col-span-2">
          <Button>Save payment</Button>
        </div>
      </form>

      {message ? <p className="text-sm text-[var(--brand-soft)]">{message}</p> : null}

      <div className="surface overflow-x-auto rounded-3xl">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] text-[var(--ink-soft)]">
            <tr>
              <th className="px-4 py-3">Contributor</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reference</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3">{p.contributor.displayName}</td>
                <td className="px-4 py-3">{p.amount ?? "••••"}</td>
                <td className="px-4 py-3">{p.paymentMethod}</td>
                <td className="px-4 py-3">{p.paymentStatus}</td>
                <td className="px-4 py-3">{p.transactionReference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
