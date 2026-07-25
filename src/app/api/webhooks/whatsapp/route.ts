import { NextResponse } from "next/server";
import { handleIncomingWhatsAppMessage } from "@/lib/whatsapp/conversation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entries = body?.entry || [];

    for (const entry of entries) {
      for (const change of entry.changes || []) {
        const value = change.value;
        const messages = value?.messages || [];
        for (const message of messages) {
          const from = message.from as string;
          let text = "";
          let buttonId: string | undefined;

          if (message.type === "text") {
            text = message.text?.body || "";
          } else if (message.type === "interactive") {
            buttonId =
              message.interactive?.button_reply?.id ||
              message.interactive?.list_reply?.id;
            text =
              message.interactive?.button_reply?.title ||
              message.interactive?.list_reply?.title ||
              "";
          } else if (message.type === "button") {
            text = message.button?.text || "";
            buttonId = message.button?.payload;
          }

          if (from && (text || buttonId)) {
            await handleIncomingWhatsAppMessage({ from, text, buttonId });
          }
        }
      }
    }

    // Also support simplified local testing payload: { from, text }
    if (body?.from && body?.text) {
      await handleIncomingWhatsAppMessage({
        from: body.from,
        text: body.text,
        buttonId: body.buttonId,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("WhatsApp webhook error", error);
    return NextResponse.json({ ok: true }); // acknowledge to avoid retries storms during dev
  }
}
