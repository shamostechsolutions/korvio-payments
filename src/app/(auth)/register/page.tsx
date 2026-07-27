"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromWhatsApp = searchParams.get("from") === "whatsapp";
  const createCampaign = searchParams.get("intent") === "create-campaign";
  const presetEmail = searchParams.get("email") || "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.get("fullName"),
          phoneNumber: formData.get("phoneNumber"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to register");
        return;
      }
      router.push(createCampaign ? "/dashboard/new" : "/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface w-full max-w-md rounded-3xl p-8">
      <Logo />
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-700 text-[var(--brand)]">
        {createCampaign ? "Create your campaign" : "Create your Korvio account"}
      </h1>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        {fromWhatsApp
          ? "You came from WhatsApp. Register here, then we’ll take you straight to campaign setup."
          : "Set up campaigns for weddings, medical drives, school reunions and more."}
      </p>
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
        <div>
          <Label>Full name</Label>
          <Input name="fullName" required placeholder="Moses Etuku" />
        </div>
        <div>
          <Label>Phone number</Label>
          <Input name="phoneNumber" required placeholder="256700000000" />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            name="email"
            type="email"
            required
            defaultValue={presetEmail}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label>Password</Label>
          <Input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <Button type="submit" className="w-full" loading={loading}>
          {loading ? "Creating account..." : createCampaign ? "Register and set up campaign" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-[var(--ink-soft)]">
        Already have an account?{" "}
        <Link
          href={createCampaign ? "/login?redirect=/dashboard/new" : "/login"}
          className="font-semibold text-[var(--brand)]"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="brand-pattern flex min-h-screen items-center justify-center px-4 py-10">
      <Suspense fallback={<div className="surface rounded-3xl p-8">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
