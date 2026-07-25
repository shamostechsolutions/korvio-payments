"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";

export default function RemindersPage() {
  const params = useParams<{ campaignId: string }>();
  const [audience, setAudience] = useState("outstanding");
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function send() {
    if (!confirming) {
      setConfirming(true);
      setMessage("Confirm again to send private reminders.");
      return;
    }

    const res = await fetch(`/api/campaigns/${params.campaignId}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audience, confirm: true }),
    });
    const data = await res.json();
    setConfirming(false);
    setMessage(res.ok ? `Sent ${data.sent} private reminder(s).` : data.error || "Failed");
  }

  return (
    <div className="space-y-6">
      <div className="surface rounded-3xl p-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-700 text-[var(--brand)]">
          Reminders
        </h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Reminders are private by default. The group is never named and shamed unless you deliberately enable public reminders.
        </p>
      </div>

      <div className="surface max-w-xl space-y-4 rounded-3xl p-5">
        <div>
          <Label>Who should receive reminders?</Label>
          <Select value={audience} onChange={(e) => setAudience(e.target.value)}>
            <option value="outstanding">Everyone with outstanding pledges</option>
            <option value="unpaid">Contributors who have not paid</option>
            <option value="partial">Partially paid contributors</option>
            <option value="overdue">Promised date has passed</option>
          </Select>
        </div>
        <Button onClick={() => void send()} variant={confirming ? "danger" : "primary"}>
          {confirming ? "Yes, send reminders now" : "Prepare reminders"}
        </Button>
        {message ? <p className="text-sm text-[var(--brand-soft)]">{message}</p> : null}
      </div>
    </div>
  );
}
