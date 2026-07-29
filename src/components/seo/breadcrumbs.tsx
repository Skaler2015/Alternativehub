import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 overflow-x-auto text-xs text-muted-foreground">
        {items.map((item, i) => (
          <span key={item.path} className="flex shrink-0 items-center gap-1">
            {i > 0 && <ChevronRight className="size-3" />}
            {i === items.length - 1 ? (
              <span className="text-foreground">{item.name}</span>
            ) : (
              <Link href={item.path} className="transition-colors hover:text-foreground">
                {item.name}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
