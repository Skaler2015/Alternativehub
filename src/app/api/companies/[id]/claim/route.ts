import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, logActivity } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";

type Params = Promise<{ id: string }>;

/**
 * Claim a company. Records the requesting user as owner with claimVerified=false;
 * an admin verifies it later. Unverified owners can still manage the profile.
 */
export async function POST(_req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const rl = await rateLimit(`claim:${user.id}`, 10, 86400);
  if (!rl.success) return NextResponse.json({ error: "Too many claim requests" }, { status: 429 });

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id }, select: { id: true, name: true, claimedById: true } });
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (company.claimedById && company.claimedById !== user.id) {
    return NextResponse.json({ error: "This company has already been claimed" }, { status: 409 });
  }

  await prisma.company.update({
    where: { id },
    data: { claimedById: user.id, claimVerified: false, claimedAt: new Date() },
  });

  await logActivity({ userId: user.id, action: "company.claim", entity: "Company", entityId: id, meta: { name: company.name } });
  void notify({
    userId: user.id,
    type: "SYSTEM",
    title: `Claim submitted for ${company.name}`,
    body: "Your claim is pending verification. You can already manage the company profile from your dashboard.",
    link: "/dashboard/company",
  });

  return NextResponse.json({ ok: true });
}
