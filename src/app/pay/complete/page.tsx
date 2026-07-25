import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { PublicFooter, PublicHeader } from "@/components/campaign/public-shell";
import { prisma } from "@/lib/db";
import { confirmPaymentOnReturn } from "@/lib/payments/service";
import { formatMoney } from "@/lib/utils/money";

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

type PageProps = {
  searchParams: Promise<{
    tx_ref?: string | string[];
    status?: string | string[];
    transaction_id?: string | string[];
  }>;
};

export default async function PayCompletePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const txRef = firstParam(params.tx_ref);
  const redirectStatus = firstParam(params.status)?.toLowerCase();

  let payment: {
    amount: number;
    currency: string;
    paymentStatus: string;
    transactionReference: string;
    campaign: { campaignCode: string; name: string } | null;
  } | null = null;

  let loadError = false;

  if (txRef) {
    try {
      await confirmPaymentOnReturn(txRef);
    } catch (error) {
      console.error("[pay/complete] confirm failed", error);
    }

    try {
      payment = await prisma.payment.findFirst({
        where: {
          OR: [{ transactionReference: txRef }, { providerReference: txRef }],
        },
        select: {
          amount: true,
          currency: true,
          paymentStatus: true,
          transactionReference: true,
          campaign: { select: { campaignCode: true, name: true } },
        },
      });
    } catch (error) {
      console.error("[pay/complete] db load failed", error);
      loadError = true;
    }
  }

  const flutterwaveSaysSuccess = redirectStatus === "successful";
  const isSuccess =
    payment?.paymentStatus === "SUCCESSFUL" ||
    (flutterwaveSaysSuccess && !payment && !loadError);
  const isFailed =
    payment?.paymentStatus === "FAILED" || payment?.paymentStatus === "CANCELLED";

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PublicHeader />
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="card p-8">
          {loadError ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-3xl">
                ⚠
              </div>
              <h1 className="mt-4 text-2xl font-bold text-[var(--ink)]">
                Payment received — confirming
              </h1>
              <p className="mt-2 text-[var(--ink-soft)]">
                Flutterwave shows your payment as successful. Our server is still catching up —
                refresh this page in a minute or check the campaign page.
              </p>
            </>
          ) : isSuccess && payment ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-3xl text-emerald-400">
                ✓
              </div>
              <h1 className="mt-4 text-2xl font-bold text-[var(--ink)]">Payment successful</h1>
              <p className="mt-2 text-[var(--ink-soft)]">
                {formatMoney(payment.amount, payment.currency)} received for{" "}
                {payment.campaign?.name ?? "your campaign"}.
              </p>
            </>
          ) : isSuccess && flutterwaveSaysSuccess ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-3xl text-emerald-400">
                ✓
              </div>
              <h1 className="mt-4 text-2xl font-bold text-[var(--ink)]">Payment successful</h1>
              <p className="mt-2 text-[var(--ink-soft)]">
                Your payment went through. It will appear on the campaign shortly.
              </p>
            </>
          ) : isFailed ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-3xl text-red-400">
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
                We are confirming your payment. Refresh this page in a moment.
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
