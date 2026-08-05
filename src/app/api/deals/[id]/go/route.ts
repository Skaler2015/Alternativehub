import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * GET /api/deals/{id}/go — record a click and redirect to the deal's landing
 * page. Used as the href of every "Get deal" button (rel="nofollow sponsored")
 * so we can measure affiliate performance without exposing raw outbound links.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const deal = await prisma.deal.findUnique({
      where: { id },
      select: { url: true, active: true },
    });
    if (!deal || !deal.active) {
      return NextResponse.redirect(new URL("/deals", SITE.url));
    }
    // Best-effort counter — never block the redirect on it.
    prisma.deal.update({ where: { id }, data: { clicks: { increment: 1 } } }).catch(() => {});
    return NextResponse.redirect(deal.url);
  } catch {
    return NextResponse.redirect(new URL("/deals", SITE.url));
  }
}
