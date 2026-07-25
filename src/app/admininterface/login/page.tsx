"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Unable to sign in");
      return;
    }
    router.push("/admininterface");
    router.refresh();
  }

  return (
    <main className="dashboard-theme flex min-h-screen items-center justify-center px-4 py-10">
      <div className="dash-card w-full max-w-md p-8">
        <div className="flex items-center gap-3">
          <Logo />
        </div>
        <div className="mt-6 flex items-center gap-2 text-teal-400">
          <Shield className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">Platform admin</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-[var(--dash-ink)]">Korvio admin sign in</h1>
        <p className="mt-2 text-sm text-[var(--dash-muted)]">
          For Korvio staff only — manage all campaigns, cash-outs and verifications. Campaign
          organisers should use the regular login instead.
        </p>

        <form action={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label>Admin email</Label>
            <Input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="shamos@korvio.com"
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <Button className="w-full" loading={loading}>
            Sign in to admin
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--dash-muted)]">
          Running a campaign?{" "}
          <Link href="/login" className="font-semibold text-teal-400">
            Organiser login
          </Link>
        </p>
      </div>
    </main>
  );
}
