import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { PublicFooter, PublicHeader } from "@/components/campaign/public-shell";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils/money";

export default async function PayCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ tx_ref?: string }>;
}) {
  const { tx_ref: txRef } = await searchParams;

  const payment = txRef
    ? await prisma.payment.findFirst({
        where: {
          OR: [{ transactionReference: txRef }, { providerReference: txRef }],
        },
        include: {
          campaign: true,
          contributor: true,
        },
      })
    : null;

  const isSuccess = payment?.paymentStatus === "SUCCESSFUL";
  const isPending = !payment || payment.paymentStatus === "PENDING";
  const isFailed =
    payment?.paymentStatus === "FAILED" || payment?.paymentStatus === "CANCELLED";

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PublicHeader />
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="card p-8">
          {isSuccess && payment ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--success)_12%,white)] text-3xl">
                ✓
              </div>
              <h1 className="mt-4 text-2xl font-bold text-[var(--ink)]">Payment successful</h1>
              <p className="mt-2 text-[var(--ink-soft)]">
                {formatMoney(payment.amount, payment.currency)} received for{" "}
                {payment.campaign.name}.
              </p>
            </>
          ) : isFailed && payment ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
                ✕
              </div>
              <h1 className="mt-4 text-2xl font-bold text-[var(--ink)]">Payment not completed</h1>
              <p className="mt-2 text-[var(--ink-soft)]">
                Please try again from the campaign page.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg)] text-3xl">
                ⏳
              </div>
              <h1 className="mt-4 text-2xl font-bold text-[var(--ink)]">Processing payment</h1>
              <p className="mt-2 text-[var(--ink-soft)]">
                We are confirming your payment. Refresh the campaign page shortly.
              </p>
            </>
          )}

          {payment?.campaign ? (
            <Link href={`/c/${payment.campaign.campaignCode}`} className="mt-6 block">
              <Button className="w-full">Back to campaign</Button>
            </Link>
          ) : (
            <Link href="/" className="mt-6 block">
              <Button variant="secondary" className="w-full">
                Go to Korvio
              </Button>
            </Link>
          )}

          {txRef ? (
            <p className="mt-4 text-xs text-[var(--ink-soft)]">Ref: {txRef}</p>
          ) : null}
        </div>
        <div className="mt-8 flex justify-center">
          <Logo />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
