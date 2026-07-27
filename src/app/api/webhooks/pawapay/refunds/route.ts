import { NextResponse } from "next/server";

/** Refund callbacks — acknowledge for now; wire to payment reversal later. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.info("[pawapay/refunds webhook]", body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[pawapay/refunds webhook]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      { status: 400 },
    );
  }
}
