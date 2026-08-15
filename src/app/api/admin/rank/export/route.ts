import { getApiUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getOrCreateProject } from "@/lib/rank/data";
import { rankBucket } from "@/lib/rank/normalize";

export const dynamic = "force-dynamic";

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function csvResponse(csv: string, name: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

/** Export current rankings, or full ranking history (backup), as CSV. */
export async function GET(req: Request) {
  const user = await getApiUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const project = await getOrCreateProject();
  const scope = new URL(req.url).searchParams.get("scope");

  // ── Full history backup ──
  if (scope === "history") {
    const hist = await prisma.rankHistory.findMany({
      where: { projectId: project.id },
      orderBy: { checkedAt: "desc" },
      take: 200000,
      include: { keyword: { select: { keyword: true } } },
    });
    const head = ["Keyword", "Rank", "Ranking URL", "Title", "Search Engine", "Country", "Device", "Provider", "Status", "Checked At"];
    const lines = [head.join(",")];
    for (const h of hist) {
      lines.push(
        [
          esc(h.keyword?.keyword ?? ""), h.rank ?? "", esc(h.rankingUrl ?? ""), esc(h.rankingTitle ?? ""),
          esc(h.searchEngine), esc(h.country), esc(h.device), esc(h.provider), esc(h.status),
          esc(h.checkedAt.toISOString()),
        ].join(","),
      );
    }
    return csvResponse(lines.join("\n"), "rank-history");
  }

  const rows = await prisma.rankKeyword.findMany({
    where: { projectId: project.id },
    orderBy: { currentRank: { sort: "asc", nulls: "last" } },
    take: 100000,
  });

  const header = [
    "Keyword", "Current Rank", "Previous Rank", "Change", "Status", "Movement",
    "Ranking URL", "Target URL", "Group", "Country", "Device", "Checked At",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    const change = r.previousRank != null && r.currentRank != null ? r.previousRank - r.currentRank : "";
    lines.push(
      [
        esc(r.keyword),
        r.currentRank ?? "Not Ranking",
        r.previousRank ?? "",
        change,
        esc(rankBucket(r.currentRank)),
        esc(r.lastStatus ?? ""),
        esc(r.rankingUrl ?? ""),
        esc(r.targetUrl ?? ""),
        esc(r.groupName ?? ""),
        esc(project.country),
        esc(project.device),
        esc(r.lastCheckedAt ? r.lastCheckedAt.toISOString() : ""),
      ].join(","),
    );
  }

  const csv = lines.join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rankings-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
