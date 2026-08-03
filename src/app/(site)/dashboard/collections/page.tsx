import type { Metadata } from "next";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { CollectionManager } from "@/components/collections/collection-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Collections", robots: { index: false, follow: false } };

export default async function DashboardCollectionsPage() {
  const user = await requireUser();
  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, name: true, description: true, isPublic: true, _count: { select: { items: true } } },
  });

  return (
    <CollectionManager
      initial={collections.map((c) => ({
        id: c.id, slug: c.slug, name: c.name, description: c.description, isPublic: c.isPublic, count: c._count.items,
      }))}
    />
  );
}
