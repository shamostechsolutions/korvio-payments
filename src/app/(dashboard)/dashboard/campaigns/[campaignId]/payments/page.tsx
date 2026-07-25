"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashMessage, DashPageHeader, DashTableWrap } from "@/components/dashboard/dash-page";
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
      <DashPageHeader
        title="Payments"
        description="Record cash, bank and direct mobile money payments. Contributors receive a private confirmation."
      />

      <form action={recordPayment} className="dash-card grid gap-3 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="font-semibold text-[var(--dash-ink)]">Record manual payment</h2>
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
          <button type="submit" className="dash-btn-primary">
            Save payment
          </button>
        </div>
      </form>

      {message ? <DashMessage type="success">{message}</DashMessage> : null}

      <DashTableWrap>
        <thead>
          <tr>
            <th>Contributor</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>{p.contributor.displayName}</td>
              <td className="text-emerald-400">{p.amount ?? "••••"}</td>
              <td>{p.paymentMethod}</td>
              <td>{p.paymentStatus}</td>
              <td className="text-[var(--dash-muted)]">{p.transactionReference}</td>
            </tr>
          ))}
        </tbody>
      </DashTableWrap>
    </div>
  );
}
