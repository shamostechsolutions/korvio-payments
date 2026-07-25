import { pushOutbound } from "./outbox";

type TextMessage = {
  body: string;
};

type ButtonMessage = {
  body: string;
  buttons: { id: string; title: string }[];
};

type ListMessage = {
  body: string;
  buttonText: string;
  sections: {
    title: string;
    rows: { id: string; title: string; description?: string }[];
  }[];
};

type CtaUrlMessage = {
  body: string;
  displayText: string;
  url: string;
  header?: string;
  footer?: string;
};

const isConfigured = () =>
  Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);

async function sendGraph(payload: Record<string, unknown>) {
  const to = String(payload.to || "");
  const type = String(payload.type || "text");

  if (type === "text") {
    const body = String((payload.text as { body?: string } | undefined)?.body || "");
    pushOutbound({ to, body, kind: "text", at: Date.now() });
  } else if (type === "interactive") {
    const interactive = payload.interactive as {
      type?: string;
      body?: { text?: string };
      action?: {
        buttons?: { reply?: { id?: string; title?: string } }[];
        button?: string;
        sections?: {
          rows?: { id?: string; title?: string; description?: string }[];
        }[];
      };
    };

    if (interactive.type === "button") {
      const buttons = (interactive.action?.buttons || []).map((b) => ({
        id: b.reply?.id || "",
        title: b.reply?.title || "",
      }));
      pushOutbound({
        to,
        body: interactive.body?.text || "",
        kind: "buttons",
        buttons,
        at: Date.now(),
      });
    } else if (interactive.type === "list") {
      const rows = (interactive.action?.sections || []).flatMap((s) => s.rows || []);
      pushOutbound({
        to,
        body: interactive.body?.text || "",
        kind: "list",
        listButton: interactive.action?.button,
        rows: rows.map((r) => ({
          id: r.id || "",
          title: r.title || "",
          description: r.description,
        })),
        at: Date.now(),
      });
    } else if (interactive.type === "cta_url") {
      const params = (
        interactive.action as {
          parameters?: { display_text?: string; url?: string };
        }
      )?.parameters;
      pushOutbound({
        to,
        body: interactive.body?.text || "",
        kind: "cta_url",
        cta: {
          title: params?.display_text || "Open",
          url: params?.url || "",
        },
        at: Date.now(),
      });
    }
  }

  if (!isConfigured()) {
    const interactive = payload.interactive as
      | {
          type?: string;
          body?: { text?: string };
          action?: {
            buttons?: { reply?: { id?: string; title?: string } }[];
            button?: string;
            sections?: {
              rows?: { id?: string; title?: string; description?: string }[];
            }[];
          };
        }
      | undefined;

    if (interactive?.type === "button") {
      const buttons = (interactive.action?.buttons || [])
        .map((b) => `[${b.reply?.title}]`)
        .join("  ");
      console.info(
        `\n[whatsapp:mock] → ${to}\n${interactive.body?.text}\n\nBUTTONS: ${buttons}\n`,
      );
    } else if (interactive?.type === "list") {
      const rows = (interactive.action?.sections || [])
        .flatMap((s) => s.rows || [])
        .map((r) => `• ${r.title}`)
        .join("\n");
      console.info(
        `\n[whatsapp:mock] → ${to}\n${interactive.body?.text}\n\nLIST “${interactive.action?.button}”:\n${rows}\n`,
      );
    } else if (interactive?.type === "cta_url") {
      const params = (
        interactive.action as {
          parameters?: { display_text?: string; url?: string };
        }
      )?.parameters;
      console.info(
        `\n[whatsapp:mock] → ${to}\n${interactive.body?.text}\n\nCTA: [${params?.display_text}] → ${params?.url}\n`,
      );
    } else {
      const text = (payload.text as { body?: string } | undefined)?.body;
      console.info(`\n[whatsapp:mock] → ${to}\n${text}\n`);
    }
    return { mock: true, payload };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WhatsApp API error: ${res.status} ${text}`);
  }

  return res.json();
}

export async function sendText(to: string, message: TextMessage) {
  return sendGraph({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: message.body },
  });
}

export async function sendButtons(to: string, message: ButtonMessage) {
  return sendGraph({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: message.body },
      action: {
        buttons: message.buttons.slice(0, 3).map((button) => ({
          type: "reply",
          reply: { id: button.id, title: button.title.slice(0, 20) },
        })),
      },
    },
  });
}

export async function sendList(to: string, message: ListMessage) {
  return sendGraph({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: message.body },
      action: {
        button: message.buttonText.slice(0, 20),
        sections: message.sections,
      },
    },
  });
}

export async function sendCtaUrl(to: string, message: CtaUrlMessage) {
  return sendGraph({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "cta_url",
      ...(message.header
        ? { header: { type: "text", text: message.header.slice(0, 60) } }
        : {}),
      body: { text: message.body },
      ...(message.footer ? { footer: { text: message.footer.slice(0, 60) } } : {}),
      action: {
        name: "cta_url",
        parameters: {
          display_text: message.displayText.slice(0, 20),
          url: message.url,
        },
      },
    },
  });
}
