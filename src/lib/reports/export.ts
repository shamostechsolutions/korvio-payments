import ExcelJS from "exceljs";
import type { Campaign, Contributor, Expense, Payment } from "@prisma/client";
import { formatMoney } from "@/lib/utils/money";
import { publicStatusLabel } from "@/lib/status";

export async function buildCampaignWorkbook(input: {
  campaign: Campaign;
  contributors: Contributor[];
  payments: Payment[];
  expenses: Expense[];
  includeAmounts: boolean;
}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Korvio";

  const summary = wb.addWorksheet("Summary");
  summary.addRows([
    ["Campaign", input.campaign.name],
    ["Code", input.campaign.campaignCode],
    ["Target", formatMoney(input.campaign.targetAmount, input.campaign.currency)],
    ["Pledged", formatMoney(input.campaign.totalPledged, input.campaign.currency)],
    ["Received", formatMoney(input.campaign.totalReceived, input.campaign.currency)],
    ["Expenses", formatMoney(input.campaign.totalExpenses, input.campaign.currency)],
    ["Available balance", formatMoney(input.campaign.availableBalance, input.campaign.currency)],
    ["Contributors", input.contributors.length],
  ]);

  const contribSheet = wb.addWorksheet("Contributors");
  contribSheet.columns = input.includeAmounts
    ? [
        { header: "Name", key: "name", width: 24 },
        { header: "Phone", key: "phone", width: 16 },
        { header: "Status", key: "status", width: 18 },
        { header: "Pledged", key: "pledged", width: 14 },
        { header: "Paid", key: "paid", width: 14 },
        { header: "Outstanding", key: "outstanding", width: 14 },
      ]
    : [
        { header: "Name", key: "name", width: 24 },
        { header: "Phone", key: "phone", width: 16 },
        { header: "Status", key: "status", width: 18 },
      ];

  for (const c of input.contributors) {
    contribSheet.addRow(
      input.includeAmounts
        ? {
            name: c.anonymous ? "Anonymous" : c.displayName,
            phone: c.phoneNumber,
            status: publicStatusLabel(c.status),
            pledged: c.pledgedAmount,
            paid: c.paidAmount,
            outstanding: c.outstandingAmount,
          }
        : {
            name: c.anonymous ? "Anonymous" : c.displayName,
            phone: c.phoneNumber,
            status: publicStatusLabel(c.status),
          },
    );
  }

  if (input.includeAmounts) {
    const paySheet = wb.addWorksheet("Payments");
    paySheet.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Contributor", key: "contributor", width: 22 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Method", key: "method", width: 16 },
      { header: "Status", key: "status", width: 14 },
      { header: "Reference", key: "reference", width: 20 },
    ];
    for (const p of input.payments) {
      const contributor = input.contributors.find((c) => c.id === p.contributorId);
      paySheet.addRow({
        date: (p.completedAt || p.initiatedAt).toISOString().slice(0, 10),
        contributor: contributor?.displayName || p.contributorId,
        amount: p.amount,
        method: p.paymentMethod,
        status: p.paymentStatus,
        reference: p.transactionReference,
      });
    }

    const expSheet = wb.addWorksheet("Expenses");
    expSheet.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Category", key: "category", width: 16 },
      { header: "Description", key: "description", width: 28 },
      { header: "Supplier", key: "supplier", width: 18 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Approval", key: "approval", width: 12 },
    ];
    for (const e of input.expenses) {
      expSheet.addRow({
        date: e.expenseDate.toISOString().slice(0, 10),
        category: e.category,
        description: e.description,
        supplier: e.supplier || "",
        amount: e.amount,
        approval: e.approvalStatus,
      });
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function buildContributorsCsv(
  contributors: Contributor[],
  includeAmounts: boolean,
  currency: string,
) {
  const headers = includeAmounts
    ? ["Name", "Phone", "Status", "Pledged", "Paid", "Outstanding"]
    : ["Name", "Phone", "Status"];

  const rows = contributors.map((c) => {
    const base = [
      c.anonymous ? "Anonymous" : c.displayName,
      c.phoneNumber,
      publicStatusLabel(c.status),
    ];
    if (!includeAmounts) return base;
    return [
      ...base,
      formatMoney(c.pledgedAmount, currency),
      formatMoney(c.paidAmount, currency),
      formatMoney(c.outstandingAmount, currency),
    ];
  });

  return [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
}

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
