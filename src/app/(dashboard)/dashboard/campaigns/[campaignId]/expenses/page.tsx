"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashMessage, DashPageHeader, DashTableWrap } from "@/components/dashboard/dash-page";
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
      <DashPageHeader
        title="Expenses"
        description="Keep available balance accurate by recording every campaign expense."
      />

      <form action={onSubmit} className="dash-card grid gap-3 p-5 md:grid-cols-2">
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
          <button type="submit" className="dash-btn-primary">
            Record expense
          </button>
        </div>
      </form>

      {message ? <DashMessage type="success">{message}</DashMessage> : null}

      <DashTableWrap>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td>{e.expenseDate.slice(0, 10)}</td>
              <td>{e.category}</td>
              <td>{e.description}</td>
              <td className="text-amber-400">{e.amount}</td>
              <td>{e.approvalStatus}</td>
            </tr>
          ))}
        </tbody>
      </DashTableWrap>
    </div>
  );
}
