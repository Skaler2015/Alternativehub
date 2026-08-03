import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";

export async function POST(req: Request) {
  const rl = await rateLimit(`register:${getClientIp(req)}`, 5, 300);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, email: true },
  });

  await notify({
    userId: user.id,
    type: "SYSTEM",
    title: `Welcome to AlternativeHub, ${name}! 👋`,
    body: "Discover tools, write reviews, build collections and earn reputation. Start by exploring what's trending.",
    link: "/tools",
  });

  return NextResponse.json({ ok: true, id: user.id }, { status: 201 });
}
