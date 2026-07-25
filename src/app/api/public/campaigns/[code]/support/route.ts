import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublicCampaign, normalizePhone } from "@/lib/contributors/web";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const campaign = await getPublicCampaign(code);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (!campaign.allowSupportMessages) {
    return NextResponse.json({ messages: [] });
  }

  const messages = await prisma.campaignSupportMessage.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      authorName: m.anonymous ? "Anonymous" : m.authorName,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

const postSchema = z.object({
  authorName: z.string().max(80).optional(),
  phoneNumber: z.string().optional(),
  body: z.string().min(3).max(500),
  anonymous: z.boolean().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const campaign = await getPublicCampaign(code);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    if (!campaign.allowSupportMessages) {
      return NextResponse.json({ error: "Support messages are disabled" }, { status: 400 });
    }

    const body = postSchema.parse(await request.json());
    if (!body.anonymous && (!body.authorName || body.authorName.trim().length < 2)) {
      return NextResponse.json({ error: "Enter your name or post anonymously" }, { status: 400 });
    }
    const phone = body.phoneNumber ? normalizePhone(body.phoneNumber) : null;
    const contributor =
      phone && phone.length >= 10
        ? await prisma.contributor.findUnique({
            where: {
              campaignId_phoneNumber: { campaignId: campaign.id, phoneNumber: phone },
            },
          })
        : null;

    const authorName = body.anonymous
      ? "Anonymous"
      : (body.authorName ?? "").trim();

    await prisma.campaignSupportMessage.create({
      data: {
        campaignId: campaign.id,
        contributorId: contributor?.id,
        authorName,
        body: body.body.trim(),
        anonymous: body.anonymous ?? false,
      },
    });

    const messages = await prisma.campaignSupportMessage.findMany({
      where: { campaignId: campaign.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        authorName: m.anonymous ? "Anonymous" : m.authorName,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to post message" },
      { status: 400 },
    );
  }
}
