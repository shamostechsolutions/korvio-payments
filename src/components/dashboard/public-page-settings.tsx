"use client";

import { useEffect, useState } from "react";
import { DashCard, DashMessage } from "@/components/dashboard/dash-page";
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
      <DashCard>
        <h2 className="text-lg font-bold text-[var(--dash-ink)]">Public campaign page</h2>
        <p className="mt-1 text-sm text-[var(--dash-muted)]">
          Customise how your campaign appears at{" "}
          <a href={publicUrl} target="_blank" rel="noreferrer" className="font-medium text-teal-400">
            {publicUrl.replace(/^https?:\/\//, "")}
          </a>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="dash-btn-secondary" onClick={() => void copyLink()}>
            Copy public link
          </button>
          <a href={publicUrl} target="_blank" rel="noreferrer" className="dash-btn-primary">
            Preview page
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
            <p className="mt-1 text-xs text-[var(--dash-muted)]">
              Paste a link to a photo (Google Drive, Cloudinary, etc.)
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--dash-muted)]">
            <input
              type="checkbox"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="h-4 w-4 accent-teal-500"
            />
            Show verified beneficiary badge
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--dash-muted)]">
            <input
              type="checkbox"
              checked={allowSupportMessages}
              onChange={(e) => setAllowSupportMessages(e.target.checked)}
              className="h-4 w-4 accent-teal-500"
            />
            Allow words of support on public page
          </label>
          <button
            type="button"
            className="dash-btn-primary"
            onClick={() => void saveSettings()}
            disabled={loading}
          >
            Save settings
          </button>
        </div>
      </DashCard>

      <DashCard>
        <h2 className="text-lg font-bold text-[var(--dash-ink)]">Post an update</h2>
        <p className="mt-1 text-sm text-[var(--dash-muted)]">
          Share progress with contributors — shown on your public campaign page.
        </p>
        <div className="mt-4 space-y-3">
          <Textarea
            value={updateBody}
            onChange={(e) => setUpdateBody(e.target.value)}
            rows={4}
            placeholder="Thank you everyone for your support so far..."
          />
          <button
            type="button"
            className="dash-btn-primary"
            onClick={() => void postUpdate()}
            disabled={loading || !updateBody.trim()}
          >
            Publish update
          </button>
        </div>
        {updates.length ? (
          <ul className="mt-6 space-y-3 border-t border-[var(--dash-border)] pt-6">
            {updates.map((u) => (
              <li key={u.id} className="rounded-xl bg-[var(--dash-bg)] p-4 text-sm">
                <p className="font-medium text-[var(--dash-ink)]">
                  {u.authorName} · {new Date(u.publishedAt).toLocaleDateString()}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[var(--dash-muted)]">{u.body}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </DashCard>

      {message ? <DashMessage type="success">{message}</DashMessage> : null}
      {error ? <DashMessage type="error">{error}</DashMessage> : null}
    </div>
  );
}
