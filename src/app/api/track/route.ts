import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trackEventSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = await rateLimit(`track:${getClientIp(req)}`, 120, 60);
  if (!rl.success) return NextResponse.json({ ok: false }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = trackEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  await prisma.analyticsEvent
    .create({
      data: {
        type: parsed.data.type,
        path: parsed.data.path,
        toolId: parsed.data.toolId,
        query: parsed.data.query,
        referrer: req.headers.get("referer")?.slice(0, 500),
        device: req.headers.get("user-agent")?.includes("Mobile") ? "mobile" : "desktop",
      },
    })
    .catch(() => {});

  return NextResponse.json({ ok: true }, { status: 202 });
}
