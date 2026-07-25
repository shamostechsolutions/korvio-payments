"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { DashCard, DashMessage, DashPageHeader } from "@/components/dashboard/dash-page";
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
      <DashPageHeader
        title="Reminders"
        description="Send private payment reminders. Contributors are never named and shamed on the public page."
      />

      <DashCard className="max-w-xl space-y-4">
        <div>
          <Label>Who should receive reminders?</Label>
          <Select value={audience} onChange={(e) => setAudience(e.target.value)}>
            <option value="outstanding">Everyone with outstanding pledges</option>
            <option value="unpaid">Contributors who have not paid</option>
            <option value="partial">Partially paid contributors</option>
            <option value="overdue">Promised date has passed</option>
          </Select>
        </div>
        <button
          type="button"
          onClick={() => void send()}
          className={confirming ? "dash-btn-danger" : "dash-btn-primary"}
        >
          {confirming ? "Yes, send reminders now" : "Prepare reminders"}
        </button>
        {message ? <DashMessage type="success">{message}</DashMessage> : null}
      </DashCard>
    </div>
  );
}
