"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

type Props = {
  campaignId: string;
  initialImageUrl: string | null;
  initialVerified: boolean;
  initialAllowSupport: boolean;
  publicUrl: string;
  organiserName: string;
};

export function PublicPageSettings({
  campaignId,
  initialImageUrl,
  initialVerified,
  initialAllowSupport,
  publicUrl,
  organiserName,
}: Props) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl || "");
  const [isVerified, setIsVerified] = useState(initialVerified);
  const [allowSupportMessages, setAllowSupportMessages] = useState(initialAllowSupport);
  const [updateBody, setUpdateBody] = useState("");
  const [updates, setUpdates] = useState<
    { id: string; authorName: string; body: string; publishedAt: string }[]
  >([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch(`/api/campaigns/${campaignId}/public-updates`)
      .then((r) => r.json())
      .then((d) => setUpdates(d.updates || []));
  }, [campaignId]);

  async function saveSettings() {
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch(`/api/campaigns/${campaignId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: imageUrl.trim() || null,
        isVerified,
        allowSupportMessages,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Unable to save");
      return;
    }
    setMessage("Public page settings saved.");
  }

  async function postUpdate() {
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch(`/api/campaigns/${campaignId}/public-updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: updateBody, authorName: organiserName }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Unable to post update");
      return;
    }
    setUpdateBody("");
    setUpdates((prev) => [data.update, ...prev]);
    setMessage("Update published to your public campaign page.");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setMessage("Public link copied.");
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="text-lg font-bold text-[var(--ink)]">Public campaign page</h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Customise how your campaign appears at{" "}
          <a href={publicUrl} target="_blank" rel="noreferrer" className="font-medium text-[var(--brand)]">
            {publicUrl.replace(/^https?:\/\//, "")}
          </a>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => void copyLink()}>
            Copy public link
          </Button>
          <a href={publicUrl} target="_blank" rel="noreferrer">
            <Button type="button" variant="secondary" size="sm">
              Preview page
            </Button>
          </a>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <Label>Cover image URL</Label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              Paste a link to a photo (Google Drive, Cloudinary, etc.)
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
            <input
              type="checkbox"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="h-4 w-4"
            />
            Show verified beneficiary badge
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
            <input
              type="checkbox"
              checked={allowSupportMessages}
              onChange={(e) => setAllowSupportMessages(e.target.checked)}
              className="h-4 w-4"
            />
            Allow words of support on public page
          </label>
          <Button type="button" onClick={() => void saveSettings()} disabled={loading}>
            Save settings
          </Button>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold text-[var(--ink)]">Post an update</h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Share progress with contributors — shown on your public campaign page.
        </p>
        <div className="mt-4 space-y-3">
          <Textarea
            value={updateBody}
            onChange={(e) => setUpdateBody(e.target.value)}
            rows={4}
            placeholder="Thank you everyone for your support so far..."
          />
          <Button type="button" onClick={() => void postUpdate()} disabled={loading || !updateBody.trim()}>
            Publish update
          </Button>
        </div>
        {updates.length ? (
          <ul className="mt-6 space-y-3 border-t border-[var(--line)] pt-6">
            {updates.map((u) => (
              <li key={u.id} className="rounded-xl bg-[var(--bg)] p-4 text-sm">
                <p className="font-medium text-[var(--ink)]">
                  {u.authorName} · {new Date(u.publishedAt).toLocaleDateString()}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[var(--ink-soft)]">{u.body}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
