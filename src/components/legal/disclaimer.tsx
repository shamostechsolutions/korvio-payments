export function KorvioDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-[var(--ink-soft)] ${className}`}>
      Korvio is not a bank or mobile money issuer. Korvio provides software for organizing
      contributions, payment requests, and campaign wallets. Collections and cash-outs are
      processed through supported licensed payment providers, including MTN MoMo and Airtel
      Money via Flutterwave.
    </p>
  );
}
