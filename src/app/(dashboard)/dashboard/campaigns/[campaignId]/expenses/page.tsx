"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

type Expense = {
  id: string;
  category: string;
  description: string;
  supplier: string | null;
  amount: number;
  approvalStatus: string;
  expenseDate: string;
};

const categories = [
  "Venue",
  "Food",
  "Transport",
  "Decorations",
  "Medical",
  "School fees",
  "Printing",
  "Communication",
  "Administration",
  "Platform fees",
  "Payment processing fees",
  "Other",
];

export default function ExpensesPage() {
  const params = useParams<{ campaignId: string }>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch(`/api/campaigns/${params.campaignId}/expenses`);
    const data = await res.json();
    if (res.ok) setExpenses(data.expenses);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.campaignId]);

  async function onSubmit(formData: FormData) {
    const res = await fetch(`/api/campaigns/${params.campaignId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: formData.get("category"),
        description: formData.get("description"),
        supplier: formData.get("supplier") || undefined,
        amount: formData.get("amount"),
        paymentMethod: formData.get("paymentMethod"),
        expenseDate: formData.get("expenseDate"),
        notes: formData.get("notes") || undefined,
        autoApprove: true,
      }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Expense recorded." : data.error || "Failed");
    if (res.ok) void load();
  }

  return (
    <div className="space-y-6">
      <div className="surface rounded-3xl p-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-700 text-[var(--brand)]">
          Expenses
        </h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Keep available balance accurate by recording every campaign expense.
        </p>
      </div>

      <form action={onSubmit} className="surface grid gap-3 rounded-3xl p-5 md:grid-cols-2">
        <div>
          <Label>Category</Label>
          <Select name="category" defaultValue="Venue">
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Amount</Label>
          <Input name="amount" required />
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Textarea name="description" required rows={2} />
        </div>
        <div>
          <Label>Supplier / recipient</Label>
          <Input name="supplier" />
        </div>
        <div>
          <Label>Date</Label>
          <Input
            name="expenseDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div>
          <Label>Payment method</Label>
          <Select name="paymentMethod" defaultValue="CASH">
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
            <option value="MTN_MOMO">MTN MoMo</option>
            <option value="AIRTEL_MONEY">Airtel Money</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
        <div>
          <Label>Notes</Label>
          <Input name="notes" />
        </div>
        <div className="md:col-span-2">
          <Button>Record expense</Button>
        </div>
      </form>

      {message ? <p className="text-sm text-[var(--brand-soft)]">{message}</p> : null}

      <div className="surface overflow-x-auto rounded-3xl">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] text-[var(--ink-soft)]">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3">{e.expenseDate.slice(0, 10)}</td>
                <td className="px-4 py-3">{e.category}</td>
                <td className="px-4 py-3">{e.description}</td>
                <td className="px-4 py-3">{e.amount}</td>
                <td className="px-4 py-3">{e.approvalStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
