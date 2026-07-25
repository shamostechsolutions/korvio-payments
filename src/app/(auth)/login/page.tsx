"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
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
      setError(data.error || "Unable to log in");
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="surface w-full max-w-md rounded-3xl p-8">
      <Logo />
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-700 text-[var(--brand)]">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Log in to manage campaigns, payments and WhatsApp updates.
      </p>
      <form action={onSubmit} className="mt-6 space-y-4">
        <div>
          <Label>Email</Label>
          <Input name="email" type="email" required placeholder="you@example.com" />
        </div>
        <div>
          <Label>Password</Label>
          <Input name="password" type="password" required placeholder="••••••••" />
        </div>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <Button className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-[var(--ink-soft)]">
        New to Korvio?{" "}
        <Link href="/register" className="font-semibold text-[var(--brand)]">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="brand-pattern flex min-h-screen items-center justify-center px-4 py-10">
      <Suspense fallback={<div className="surface rounded-3xl p-8">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
