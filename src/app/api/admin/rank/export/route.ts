import { getApiUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getOrCreateProject } from "@/lib/rank/data";
import { rankBucket } from "@/lib/rank/normalize";

export const dynamic = "force-dynamic";

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Export current rankings as CSV. */
export async function GET(req: Request) {
  const user = await getApiUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const project = await getOrCreateProject();
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
