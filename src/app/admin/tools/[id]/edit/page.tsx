import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ToolForm } from "@/components/admin/tool-form";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditToolPage({ params }: { params: Params }) {
  const { id } = await params;
  const [tool, categories] = await Promise.all([
    prisma.tool.findUnique({
      where: { id },
      include: { tags: { include: { tag: { select: { name: true } } } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!tool) notFound();

  const initial = {
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    tagline: tool.tagline ?? "",
    description: tool.description,
    websiteUrl: tool.websiteUrl,
    affiliateUrl: tool.affiliateUrl ?? "",
    downloadUrl: tool.downloadUrl ?? "",
    logoUrl: tool.logoUrl ?? "",
    categoryId: tool.categoryId,
    pricingModel: tool.pricingModel,
    tier: tool.tier,
    status: tool.status,
    featured: tool.featured,
    verified: tool.verified,
    isOpenSource: tool.isOpenSource,
    launchYear: tool.launchYear ? String(tool.launchYear) : "",
    pros: tool.pros.join("\n"),
    cons: tool.cons.join("\n"),
    bestFor: tool.bestFor.join("\n"),
    tags: tool.tags.map((t) => t.tag.name).join(", "),
    seoTitle: tool.seoTitle ?? "",
    seoDesc: tool.seoDesc ?? "",
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/listings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Listings
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit {tool.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Update any detail. Changes go live immediately.</p>
      </div>
      <ToolForm categories={categories} initial={initial} />
    </div>
  );
}
