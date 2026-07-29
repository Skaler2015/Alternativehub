import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/newsletter-token";
import { SITE } from "@/lib/constants";

/** One-click unsubscribe from the weekly digest via a signed link. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  const token = url.searchParams.get("token") ?? "";

  const redirect = (status: string) =>
    NextResponse.redirect(`${SITE.url}/unsubscribe?status=${status}`, { status: 302 });

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return redirect("invalid");
  }

  await prisma.newsletterSubscriber
    .updateMany({ where: { email }, data: { unsubscribedAt: new Date() } })
    .catch(() => {});

  return redirect("ok");
}
