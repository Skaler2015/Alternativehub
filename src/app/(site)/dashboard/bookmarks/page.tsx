import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { ToolCard } from "@/components/tools/tool-card";
import { toolCardSelect } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const user = await requireUser();
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { tool: { select: toolCardSelect } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Bookmarks</h1>
      <p className="mt-1 text-sm text-muted-foreground">{bookmarks.length} saved tools</p>

      {bookmarks.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Nothing saved yet. Hit the bookmark button on any tool to keep it here.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bookmarks.map((b) => (
            <ToolCard key={b.toolId} tool={b.tool} />
          ))}
        </div>
      )}
    </div>
  );
}
