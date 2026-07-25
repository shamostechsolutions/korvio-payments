"use client";

import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatMessage = {
  from: "user" | "korvio";
  body: string;
  kind?: "text" | "buttons" | "list" | "cta_url";
  buttons?: { id: string; title: string }[];
  listButton?: string;
  rows?: { id: string; title: string; description?: string }[];
  cta?: { title: string; url: string };
};

export default function DemoChatPage() {
  const [phone, setPhone] = useState("256700000202");
  const [text, setText] = useState("JOIN MSW-2026");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function send(payload: { text?: string; buttonId?: string; label?: string }) {
    const label = payload.label || payload.text || payload.buttonId || "";
    setMessages((prev) => [...prev, { from: "user", body: label }]);
    setLoading(true);

    const res = await fetch("/api/demo/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: phone,
        text: payload.text || "",
        buttonId: payload.buttonId,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessages((prev) => [
        ...prev,
        { from: "korvio", body: data.error || "Something went wrong", kind: "text" },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      ...((data.messages || []) as ChatMessage[]).map((m) => ({
        from: "korvio" as const,
        body: m.body,
        kind: m.kind,
        buttons: m.buttons,
        listButton: m.listButton,
        rows: m.rows,
        cta: m.cta,
      })),
    ]);
    setText("");
  }

  return (
    <main className="brand-pattern min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
            WhatsApp button demo
          </p>
        </div>

        <section className="surface rounded-3xl p-4">
          <p className="text-sm text-[var(--ink-soft)]">
            This simulates the Korvio WhatsApp chat with tappable buttons and lists.
            With real Cloud API credentials, the same controls appear inside WhatsApp.
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="max-w-[180px]"
            />
            <Button
              variant="secondary"
              onClick={() => {
                setMessages([]);
                void send({ text: "MENU", label: "MENU" });
              }}
            >
              New user demo
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setMessages([]);
                void send({ text: "JOIN MSW-2026", label: "JOIN MSW-2026" });
              }}
            >
              Join campaign
            </Button>
          </div>
        </section>

        <section className="surface flex min-h-[60vh] flex-col rounded-[28px] bg-[#ece5dd] p-3">
          <div className="mb-3 rounded-2xl bg-[#075e54] px-4 py-3 text-white">
            <p className="text-sm font-semibold">Korvio</p>
            <p className="text-xs text-white/80">Contribution assistant</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-1 py-2">
            {messages.length === 0 ? (
              <p className="px-2 text-sm text-[#667781]">
                Tap “Start demo” or send JOIN MSW-2026 to see interactive buttons.
              </p>
            ) : null}

            {messages.map((message, index) => (
              <div
                key={`${message.from}-${index}-${message.body.slice(0, 12)}`}
                className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    message.from === "user"
                      ? "rounded-br-md bg-[#dcf8c6] text-[#111b21]"
                      : "rounded-bl-md bg-white text-[#111b21]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.body}</p>

                  {message.kind === "buttons" && message.buttons?.length ? (
                    <div className="mt-3 grid gap-2 border-t border-[#e9edef] pt-2">
                      {message.buttons.map((button) => (
                        <button
                          key={button.id}
                          type="button"
                          disabled={loading}
                          onClick={() =>
                            void send({
                              buttonId: button.id,
                              text: button.id,
                              label: button.title,
                            })
                          }
                          className="rounded-xl bg-[#f0f2f5] px-3 py-2 text-center text-sm font-semibold text-[#027eb5]"
                        >
                          {button.title}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {message.kind === "list" && message.rows?.length ? (
                    <div className="mt-3 border-t border-[#e9edef] pt-2">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#667781]">
                        {message.listButton || "Options"}
                      </p>
                      <div className="grid gap-2">
                        {message.rows.map((row) => (
                          <button
                            key={row.id}
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              void send({
                                buttonId: row.id,
                                text: row.id,
                                label: row.title,
                              })
                            }
                            className="rounded-xl bg-[#f0f2f5] px-3 py-2 text-left"
                          >
                            <span className="block text-sm font-semibold text-[#027eb5]">
                              {row.title}
                            </span>
                            {row.description ? (
                              <span className="mt-0.5 block text-xs text-[#667781]">
                                {row.description}
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {message.kind === "cta_url" && message.cta ? (
                    <div className="mt-3 border-t border-[#e9edef] pt-2">
                      <a
                        href={message.cta.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl bg-[#027eb5] px-3 py-2.5 text-center text-sm font-semibold text-white"
                      >
                        {message.cta.title}
                      </a>
                      <p className="mt-1 text-center text-[10px] text-[#667781]">
                        Opens Korvio website
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              void send({ text, label: text });
            }}
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="bg-white"
            />
            <Button disabled={loading || !text.trim()}>Send</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
