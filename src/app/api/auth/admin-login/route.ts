import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "No platform admin account exists for this email. Admin accounts are created by Korvio only (seed or database setup).",
        },
        { status: 401 },
      );
    }

    if (!user.passwordHash || !(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    if (!isPlatformAdmin(user)) {
      return NextResponse.json(
        {
          error:
            "This account is not authorised for platform admin. Use the organiser login at /login instead.",
        },
        { status: 403 },
      );
    }

    await createSession(user, {
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to sign in" }, { status: 500 });
  }
}
