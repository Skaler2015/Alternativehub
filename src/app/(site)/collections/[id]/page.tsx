import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FolderOpen, Globe, Lock } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolCard } from "@/components/tools/tool-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/misc";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toolCardSelect } from "@/lib/data/queries";
import { buildMetadata, itemListJsonLd } from "@/lib/seo";
import { getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const c = await prisma.collection.findUnique({ where: { id }, select: { name: true, description: true, isPublic: true } }).catch(() => null);
  if (!c) return { title: "Collection not found" };
  return buildMetadata({
    title: `${c.name} — Collection`,
    description: c.description ?? `A curated collection of software tools on AlternativeHub.`,
    path: `/collections/${id}`,
    noIndex: !c.isPublic,
  });
}

export default async function CollectionPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = await auth();

  const collection = await prisma.collection.findUnique({
    where: { id },
    select: {
      id: true, name: true, description: true, isPublic: true, userId: true, createdAt: true,
      user: { select: { id: true, name: true, image: true } },
      items: {
        orderBy: { addedAt: "desc" },
        select: { note: true, tool: { select: toolCardSelect } },
      },
    },
  }).catch(() => null);

  if (!collection) notFound();
  const isOwner = session?.user?.id === collection.userId;
  if (!collection.isPublic && !isOwner) notFound();

  const tools = collection.items.map((i) => i.tool);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {collection.isPublic && tools.length > 0 && (
        <JsonLd data={itemListJsonLd(tools.map((t) => ({ name: t.name, path: `/tools/${t.slug}` })), collection.name)} />
      )}
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Collections", path: "/collections" }, { name: collection.name, path: `/collections/${collection.id}` }]} />

      <header className="mt-6 flex flex-col gap-4 rounded-3xl border bg-card p-6 sm:flex-row sm:items-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-primary">
          <FolderOpen className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{collection.name}</h1>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
              {collection.isPublic ? <><Globe className="size-3" /> Public</> : <><Lock className="size-3" /> Private</>}
            </span>
          </div>
          {collection.description && <p className="mt-1 text-sm text-muted-foreground">{collection.description}</p>}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Link href={`/u/${collection.user.id}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
              <Avatar className="size-5"><AvatarImage src={collection.user.image ?? undefined} /><AvatarFallback className="text-[9px]">{getInitials(collection.user.name ?? "A")}</AvatarFallback></Avatar>
              {collection.user.name ?? "Anonymous"}
            </Link>
            <span>· {tools.length} tools</span>
          </div>
        </div>
      </header>

      {tools.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          This collection is empty. {isOwner && "Hit “Save” on any tool to add it here."}
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
        </div>
      )}
    </div>
  );
}
