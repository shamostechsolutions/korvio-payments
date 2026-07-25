import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

const schema = z.object({
  fullName: z.string().min(2),
  phoneNumber: z.string().min(10),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const phoneNumber = body.phoneNumber.replace(/\D/g, "");

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { phoneNumber }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email or phone already exists." },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        fullName: body.fullName,
        phoneNumber,
        email: body.email.toLowerCase(),
        passwordHash: await hashPassword(body.password),
        accountType: "ADMIN",
      },
    });

    await createSession(user, {
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to register" }, { status: 500 });
  }
}
