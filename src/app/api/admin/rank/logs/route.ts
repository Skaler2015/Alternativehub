import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getApiUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function guard() {
  const user = await getApiUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) return null;
  return user;
}

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** GET ?format=csv exports logs; otherwise returns recent logs as JSON. */
export async function GET(req: Request) {
  if (!(await guard())) return new Response("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || undefined;
  const where: Prisma.RankLogWhereInput = type ? { type } : {};

  if (url.searchParams.get("format") === "csv") {
    const logs = await prisma.rankLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 50000 });
    const head = ["Timestamp", "Type", "Message", "Keyword", "Provider", "HTTP Status", "Attempt"];
    const lines = [head.join(",")];
    for (const l of logs) {
      lines.push([esc(l.createdAt.toISOString()), esc(l.type), esc(l.message), esc(l.keyword ?? ""), esc(l.provider ?? ""), l.httpStatus ?? "", l.attempt ?? ""].join(","));
    }
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rank-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const logs = await prisma.rankLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ ok: true, logs });
}

/** Clear logs (optionally by type). */
export async function DELETE(req: Request) {
  if (!(await guard())) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { type?: string } | null;
  const where: Prisma.RankLogWhereInput = body?.type ? { type: body.type } : {};
  const res = await prisma.rankLog.deleteMany({ where });
  return NextResponse.json({ ok: true, deleted: res.count });
}
