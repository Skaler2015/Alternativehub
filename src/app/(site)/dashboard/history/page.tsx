import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { ToolCard } from "@/components/tools/tool-card";
import { toolCardSelect } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await requireUser();
  const history = await prisma.recentlyViewed.findMany({
    where: { userId: user.id },
    orderBy: { viewedAt: "desc" },
    take: 30,
    include: { tool: { select: toolCardSelect } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Recently Viewed</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tools you&apos;ve looked at recently</p>

      {history.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No history yet — start exploring!
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {history.map((rv) => (
            <ToolCard key={rv.toolId} tool={rv.tool} />
          ))}
        </div>
      )}
    </div>
  );
}
