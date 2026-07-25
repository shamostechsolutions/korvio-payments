import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils/money";
import { whatsappJoinLink } from "@/lib/utils/codes";

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

  const whatsappNumber = process.env.WHATSAPP_BUSINESS_NUMBER || "";
  const campaignCode = payment?.campaign.campaignCode;
  const whatsappLink =
    whatsappNumber && campaignCode
      ? whatsappJoinLink(whatsappNumber, campaignCode)
      : whatsappNumber
        ? `https://wa.me/${whatsappNumber}`
        : null;

  const isSuccess = payment?.paymentStatus === "SUCCESSFUL";
  const isPending = !payment || payment.paymentStatus === "PENDING";
  const isFailed =
    payment?.paymentStatus === "FAILED" || payment?.paymentStatus === "CANCELLED";

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-12">
      <div className="mx-auto max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>

        {isSuccess && payment ? (
          <>
            <div className="space-y-2">
              <p className="text-4xl">✅</p>
              <h1 className="text-2xl font-semibold text-stone-900">Payment successful</h1>
              <p className="text-stone-600">
                {formatMoney(payment.amount, payment.currency)} received for{" "}
                {payment.campaign.name}.
              </p>
            </div>
            <p className="text-sm text-stone-500">
              Your receipt has been sent to WhatsApp. You can close this page.
            </p>
          </>
        ) : isFailed && payment ? (
          <>
            <div className="space-y-2">
              <p className="text-4xl">❌</p>
              <h1 className="text-2xl font-semibold text-stone-900">Payment not completed</h1>
              <p className="text-stone-600">
                The payment for {payment.campaign.name} was not successful. You can try again
                from WhatsApp.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-4xl">⏳</p>
              <h1 className="text-2xl font-semibold text-stone-900">
                {isPending ? "Processing payment" : "Payment status"}
              </h1>
              <p className="text-stone-600">
                {txRef
                  ? "We are confirming your payment. Your receipt will arrive on WhatsApp shortly."
                  : "No payment reference was provided."}
              </p>
            </div>
          </>
        )}

        {whatsappLink ? (
          <Link href={whatsappLink} className="block w-full">
            <Button className="w-full">Return to WhatsApp</Button>
          </Link>
        ) : (
          <Link href="/" className="block w-full">
            <Button variant="secondary" className="w-full">
              Go to Korvio
            </Button>
          </Link>
        )}

        {txRef ? (
          <p className="text-xs text-stone-400">Reference: {txRef}</p>
        ) : null}
      </div>
    </main>
  );
}
