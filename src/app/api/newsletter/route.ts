import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = await rateLimit(`newsletter:${getClientIp(req)}`, 5, 3600);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email },
    update: { unsubscribedAt: null },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
