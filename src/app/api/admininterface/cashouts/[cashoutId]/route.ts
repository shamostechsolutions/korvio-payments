import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { approveCashoutViaPawapay, updateCashoutStatus } from "@/lib/admin/cashouts";
import { canUseAutomatedCashoutPayouts, canUseManualCashoutPayouts } from "@/lib/campaigns/cashout-payout-mode";
import { PawapayApiError, formatPawapayError, parsePawapayFailure } from "@/lib/payments/pawapay/client";

const statusSchema = z.object({
  action: z.literal("update_status").optional(),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]),
  notes: z.string().optional(),
});

const approveSchema = z.object({
  action: z.literal("approve_payout"),
});

const manualCompleteSchema = z.object({
  action: z.literal("complete_manual"),
  notes: z.string().optional(),
});

const schema = z.union([approveSchema, manualCompleteSchema, statusSchema]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cashoutId: string }> },
) {
  try {
    const admin = await requirePlatformAdmin();
    const { cashoutId } = await params;
    const body = schema.parse(await request.json());

    if (body.action === "approve_payout") {
      if (!canUseAutomatedCashoutPayouts()) {
        return NextResponse.json(
          { error: "Automated PawaPay payouts are disabled on this platform." },
          { status: 400 },
        );
      }
      const cashout = await approveCashoutViaPawapay({
        cashoutId,
        adminUserId: admin.id,
      });
      return NextResponse.json({ cashout });
    }

    if (body.action === "complete_manual") {
      if (!canUseManualCashoutPayouts()) {
        return NextResponse.json(
          { error: "Manual cash-out completion is disabled on this platform." },
          { status: 400 },
        );
      }
      const cashout = await updateCashoutStatus({
        cashoutId,
        status: "COMPLETED",
        adminUserId: admin.id,
        notes: body.notes?.trim() || "Paid manually by Korvio platform admin",
      });
      return NextResponse.json({ cashout });
    }

    const cashout = await updateCashoutStatus({
      cashoutId,
      status: body.status,
      adminUserId: admin.id,
      notes: body.notes,
    });

    return NextResponse.json({ cashout });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    if (error instanceof PawapayApiError) {
      const pawapay = parsePawapayFailure(error.body, error.status);
      return NextResponse.json(
        {
          error: formatPawapayError(error),
          pawapay,
        },
        { status: 400 },
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update cash-out" }, { status: 500 });
  }
}
