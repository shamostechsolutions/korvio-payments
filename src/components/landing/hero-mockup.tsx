import { ProgressBar } from "@/components/campaign/progress-bar";

export function LandingHeroMockup() {
  return (
    <div className="landing-hero-card card mx-auto max-w-sm overflow-hidden p-0 lg:ml-auto">
      <div className="hero-gradient px-6 py-8">
        <p className="text-sm text-white/80">NMS Class of &apos;12 reunion</p>
        <p className="mt-2 text-3xl font-bold text-white">UGX 4,850,000</p>
        <p className="mt-1 text-sm text-white/70">of 6,000,000 goal · 94 contributors</p>
      </div>
      <div className="space-y-4 p-6">
        <ProgressBar value={81} />
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--ink-soft)]">Live ledger</span>
          <span className="font-semibold text-[var(--brand)]">81% funded</span>
        </div>
        <div className="space-y-2 border-t border-[var(--line)] pt-4">
          {[
            { name: "Grace N.", amount: "+120K" },
            { name: "Brian K.", amount: "+80K" },
            { name: "Diana M.", amount: "+50K" },
          ].map((row) => (
            <div key={row.name} className="flex items-center justify-between text-sm">
              <span className="font-medium">{row.name}</span>
              <span className="font-semibold text-[var(--success)]">{row.amount}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-[var(--brand)] py-3 text-center text-sm font-bold text-[#042f2e]">
          Contribute now
        </div>
      </div>
    </div>
  );
}
