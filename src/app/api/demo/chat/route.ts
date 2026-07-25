import { NextResponse } from "next/server";
import { z } from "zod";
import { handleIncomingWhatsAppMessage } from "@/lib/whatsapp/conversation";
import { consumeOutbound } from "@/lib/whatsapp/outbox";

const schema = z.object({
  from: z.string().min(8),
  text: z.string().optional().default(""),
  buttonId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const phone = body.from.replace(/\D/g, "");

    await handleIncomingWhatsAppMessage({
      from: phone,
      text: body.text || body.buttonId || "",
      buttonId: body.buttonId,
    });

    const messages = consumeOutbound(phone);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 400 },
    );
  }
}
