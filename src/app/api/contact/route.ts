import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendContactNotification } from "@/lib/email";

export async function POST(req: Request) {
  const rl = await rateLimit(`contact:${getClientIp(req)}`, 5, 3600);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many messages — please try again later" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // Honeypot tripped → pretend success, drop silently.
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 201 });

  const { name, email, subject, message } = parsed.data;

  await prisma.contactMessage
    .create({ data: { name, email, subject: subject || null, message } })
    .catch(() => {});

  // Email the owner if Resend is configured (no-op otherwise).
  void sendContactNotification({ name, email, subject, message });

  return NextResponse.json({ ok: true }, { status: 201 });
}
