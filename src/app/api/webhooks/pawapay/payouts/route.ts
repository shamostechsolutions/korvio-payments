import { NextResponse } from "next/server";
import { completeCashoutFromPawapayCallback } from "@/lib/payments/pawapay/payouts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await completeCashoutFromPawapayCallback(body);
    return NextResponse.json({ ok: true, updated: result.updated });
  } catch (error) {
    console.error("[pawapay/payouts webhook]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      { status: 400 },
    );
  }
}
