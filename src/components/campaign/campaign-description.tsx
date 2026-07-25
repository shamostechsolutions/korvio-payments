"use client";

import { useState } from "react";

export function CampaignDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 320;

  return (
    <div>
      <p
        className={`text-[15px] leading-7 text-[var(--ink-soft)] whitespace-pre-wrap ${
          !expanded && long ? "line-clamp-5" : ""
        }`}
      >
        {text}
      </p>
      {long ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-semibold text-[var(--brand)]"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
