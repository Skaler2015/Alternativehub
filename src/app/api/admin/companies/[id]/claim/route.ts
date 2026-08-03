import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, logActivity } from "@/lib/authz";
import { notify } from "@/lib/notifications";

type Params = Promise<{ id: string }>;

/** Verify or reject a company claim. ADMIN only. */
export async function PATCH(req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (action !== "verify" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({ where: { id }, select: { id: true, name: true, slug: true, claimedById: true } });
  if (!company || !company.claimedById) return NextResponse.json({ error: "No pending claim" }, { status: 404 });

  if (action === "verify") {
    await prisma.company.update({ where: { id }, data: { claimVerified: true } });
    void notify({
      userId: company.claimedById,
      type: "SYSTEM",
      title: `Your claim for ${company.name} was verified ✅`,
      body: "You now manage this verified company profile.",
      link: `/companies/${company.slug}`,
    });
  } else {
    void notify({
      userId: company.claimedById,
      type: "SYSTEM",
      title: `Your claim for ${company.name} was declined`,
      body: "If you believe this is a mistake, contact us.",
      link: "/contact",
    });
    await prisma.company.update({ where: { id }, data: { claimedById: null, claimVerified: false, claimedAt: null } });
  }

  await logActivity({ userId: user.id, action: `company.claim.${action}`, entity: "Company", entityId: id, meta: { name: company.name } });
  return NextResponse.json({ ok: true });
}
