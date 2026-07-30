import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ToolForm } from "@/components/admin/tool-form";

export const dynamic = "force-dynamic";

export default async function NewToolPage() {
  const categories = await prisma.category
    .findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
    .catch(() => []);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/listings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Listings
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Add a new tool</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create a listing manually. It goes live based on the status you choose.</p>
      </div>
      <ToolForm categories={categories} />
    </div>
  );
}
