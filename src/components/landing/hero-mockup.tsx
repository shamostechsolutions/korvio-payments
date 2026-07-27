import { ProgressBar } from "@/components/campaign/progress-bar";

export function LandingHeroMockup() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="landing-phone landing-phone-muted">
        <div className="landing-phone-notch" />
        <div className="landing-phone-body">
          <p className="text-[10px] font-semibold text-[var(--ink-soft)]">WhatsApp · Group</p>
          <p className="mt-2 text-xs font-bold text-[var(--ink)]">Karamoja support 🙏</p>
          <ol className="mt-3 space-y-1.5 text-[10px] text-[var(--ink-soft)]">
            <li>1. Andrew — 300k ⭕</li>
            <li>2. Sarah — 120k ✅</li>
            <li>3. Peter — 80k ⭕</li>
            <li>4. Aunt Flo — 100k ❓</li>
          </ol>
          <p className="mt-3 rounded-lg bg-[#dcf8c6] px-2 py-1.5 text-[10px] text-[#111]">
            Total so far 1.2M?? Who paid cash again?
          </p>
        </div>
        <p className="mt-2 text-center text-xs font-medium text-[var(--ink-soft)]">The old way</p>
      </div>

      <div className="landing-phone landing-phone-brand">
        <div className="landing-phone-notch" />
        <div className="landing-phone-body !p-0 overflow-hidden">
          <div className="bg-[var(--brand)] px-3 py-4 text-[#042f2e]">
            <p className="text-[10px] font-semibold opacity-80">KH-2026 · Open</p>
            <p className="mt-1 text-sm font-bold">Karamoja hunger</p>
            <p className="mt-2 text-lg font-bold">UGX 2,450,000</p>
            <p className="text-[10px] opacity-80">127 contributors</p>
          </div>
          <div className="space-y-2 p-3">
            <ProgressBar value={68} />
            <div className="flex justify-between text-[10px] text-[var(--ink-soft)]">
              <span>Live ledger</span>
              <span className="font-semibold text-[var(--brand)]">68% funded</span>
            </div>
            {[
              { name: "Grace N.", amount: "+120K" },
              { name: "Brian K.", amount: "+80K" },
            ].map((row) => (
              <div key={row.name} className="flex justify-between text-[10px]">
                <span className="font-medium">{row.name}</span>
                <span className="font-semibold text-[var(--success)]">{row.amount}</span>
              </div>
            ))}
            <div className="rounded-lg bg-[var(--brand)] py-2 text-center text-[10px] font-bold text-[#042f2e]">
              Contribute now
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-xs font-semibold text-[var(--brand)]">The Korvio way</p>
      </div>
    </div>
  );
}
