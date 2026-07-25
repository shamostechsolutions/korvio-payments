"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

type SupportMessage = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type Props = {
  campaignCode: string;
};

function storageKey(code: string) {
  return `korvio:contributor:${code.toUpperCase()}`;
}

export function SupportMessagesSection({ campaignCode }: Props) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey(campaignCode));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { displayName: string; phoneNumber: string };
        setAuthorName(parsed.displayName);
        setPhoneNumber(parsed.phoneNumber);
      } catch {
        /* ignore */
      }
    }
    void loadMessages();
  }, [campaignCode]);

  async function loadMessages() {
    const res = await fetch(`/api/public/campaigns/${campaignCode}/support`);
    const data = await res.json();
    if (res.ok) setMessages(data.messages);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/public/campaigns/${campaignCode}/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, phoneNumber, body, anonymous }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to post message");
      setBody("");
      setSuccess("Thank you for your words of support.");
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card p-5 md:p-6">
      <h2 className="text-lg font-bold text-[var(--ink)]">Words of support</h2>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Leave an encouraging message for the organiser and community.
      </p>

      <ul className="mt-5 max-h-80 space-y-4 overflow-y-auto">
        {messages.length ? (
          messages.map((m) => (
            <li key={m.id} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3">
              <p className="text-sm leading-relaxed text-[var(--ink)]">{m.body}</p>
              <p className="mt-2 text-xs font-medium text-[var(--ink-soft)]">
                — {m.authorName}
              </p>
            </li>
          ))
        ) : (
          <li className="text-sm text-[var(--ink-soft)]">Be the first to leave a message.</li>
        )}
      </ul>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3 border-t border-[var(--line)] pt-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Your name</Label>
            <Input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required={!anonymous}
              placeholder="Your name"
            />
          </div>
          <div>
            <Label>Phone (optional)</Label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="256700000000"
            />
          </div>
        </div>
        <div>
          <Label>Message</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={3}
            placeholder="Wishing you a quick recovery..."
            maxLength={500}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="h-4 w-4"
          />
          Post anonymously
        </label>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {success ? <p className="text-sm text-[var(--success)]">{success}</p> : null}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Posting..." : "Post message"}
        </Button>
      </form>
    </section>
  );
}
