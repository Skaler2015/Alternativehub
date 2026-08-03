import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/authz";
import { companyEditSchema } from "@/lib/validations";
import { invalidate, invalidatePrefix, CACHE_KEYS } from "@/lib/cache";

type Params = Promise<{ id: string }>;

/** Edit a company profile. Allowed for the claiming owner or admins. */
export async function PATCH(req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id }, select: { id: true, slug: true, claimedById: true } });
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = company.claimedById === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = companyEditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  await prisma.company.update({
    where: { id },
    data: {
      name: d.name,
      description: d.description || null,
      websiteUrl: d.websiteUrl || null,
      logoUrl: d.logoUrl || null,
      country: d.country || null,
      foundedYear: d.foundedYear ?? null,
      founder: d.founder || null,
      employees: d.employees || null,
      funding: d.funding || null,
    },
  });

  await invalidate(CACHE_KEYS.home).catch(() => {});
  await invalidatePrefix("v1:").catch(() => {});
  return NextResponse.json({ ok: true, slug: company.slug });
}
