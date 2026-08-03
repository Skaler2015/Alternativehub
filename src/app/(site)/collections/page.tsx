import Link from "next/link";
import type { Metadata } from "next";
import { FolderOpen, Layers } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/misc";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Collections — Curated Software Lists",
  description: "Discover curated collections of software, apps and AI tools hand-picked by the AlternativeHub community.",
  path: "/collections",
});

export default async function CollectionsPage() {
  const collections = await prisma.collection
    .findMany({
      where: { isPublic: true, items: { some: {} } },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true, name: true, description: true,
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { items: true } },
        items: { take: 4, orderBy: { addedAt: "desc" }, select: { tool: { select: { name: true, logoUrl: true, slug: true } } } },
      },
    })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Collections", path: "/collections" }]} />

      <div className="mt-4 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-primary"><Layers className="size-6" /></span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Collections</h1>
          <p className="text-sm text-muted-foreground">Curated software lists from the community</p>
        </div>
      </div>

      {collections.length === 0 ? (
        <p className="mt-16 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No public collections yet — <Link href="/dashboard/collections" className="text-primary hover:underline">create the first one</Link>.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <Link key={c.id} href={`/collections/${c.id}`} className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:soft-shadow-lg">
              <div className="flex items-center gap-2">
                <FolderOpen className="size-5 text-primary" />
                <h2 className="truncate font-semibold transition-colors group-hover:text-primary">{c.name}</h2>
              </div>
              {c.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
              <div className="mt-3 flex -space-x-2">
                {c.items.map((it) => (
                  <span key={it.tool.slug} className="flex size-8 items-center justify-center overflow-hidden rounded-lg border bg-background" title={it.tool.name}>
                    {it.tool.logoUrl
                      ? <img src={it.tool.logoUrl} alt="" className="size-full object-contain p-1" />
                      : <span className="text-[10px] font-medium">{getInitials(it.tool.name)}</span>}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Avatar className="size-5"><AvatarImage src={c.user.image ?? undefined} /><AvatarFallback className="text-[9px]">{getInitials(c.user.name ?? "A")}</AvatarFallback></Avatar>
                  {c.user.name ?? "Anonymous"}
                </span>
                <span>{c._count.items} tools</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
