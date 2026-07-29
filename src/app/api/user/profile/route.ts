import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/authz";

const profileSchema = z.object({
  name: z.string().min(2).max(64),
  bio: z.string().max(280).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      bio: parsed.data.bio || null,
      website: parsed.data.website || null,
    },
  });

  return NextResponse.json({ ok: true });
}
