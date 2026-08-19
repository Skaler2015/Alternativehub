import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/rank/crypto";

export const dynamic = "force-dynamic";

async function guard() {
  const user = await getApiUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) return null;
  return user;
}

/** Save Search Console config. The service-account JSON is validated + encrypted
 *  and never returned to the client. Blank JSON keeps the existing key. */
export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => null)) as
    | { enabled?: boolean; siteUrl?: string; serviceAccountJson?: string }
    | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });

  let serviceAccountEnc: string | undefined;
  const raw = (body.serviceAccountJson ?? "").trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { client_email?: string; private_key?: string };
      if (!parsed.client_email || !parsed.private_key) {
        return NextResponse.json({ ok: false, error: "JSON must include client_email and private_key." }, { status: 400 });
      }
      serviceAccountEnc = encryptSecret(raw);
    } catch {
      return NextResponse.json({ ok: false, error: "Service account key is not valid JSON." }, { status: 400 });
    }
  }

  const siteUrl = (body.siteUrl ?? "").trim() || null;
  const enabled = Boolean(body.enabled);
  await prisma.rankGscConfig.upsert({
    where: { id: "default" },
    create: { id: "default", enabled, siteUrl, serviceAccountEnc: serviceAccountEnc ?? null },
    update: { enabled, siteUrl, ...(serviceAccountEnc ? { serviceAccountEnc } : {}) },
  });
  return NextResponse.json({ ok: true });
}
