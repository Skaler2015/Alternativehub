"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track, type TrackType } from "@/lib/analytics";

/**
 * Mounts once in the site layout. Records:
 *  - a PAGE_VIEW on every client navigation (and initial load)
 *  - a CLICK_OUT / AFFILIATE_CLICK whenever a `[data-track]` link is clicked
 *    (e.g. the "Visit Website" button carries data-track + data-tool)
 */
function TrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Page views
  React.useEffect(() => {
    const q = searchParams.get("q") ?? undefined;
    const path = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    track({ type: "PAGE_VIEW", path, query: q });
  }, [pathname, searchParams]);

  // Delegated outbound-click tracking
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-track]");
      if (!el) return;
      const kind = el.getAttribute("data-track");
      const toolId = el.getAttribute("data-tool") ?? undefined;
      const map: Record<string, TrackType> = {
        "click-out": "CLICK_OUT",
        "affiliate": "AFFILIATE_CLICK",
        "share": "SHARE",
      };
      const type = map[kind ?? ""] ?? "CLICK_OUT";
      track({ type, toolId });
    };
    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true });
  }, []);

  return null;
}

export function AnalyticsTracker() {
  // useSearchParams requires a Suspense boundary during prerender
  return (
    <React.Suspense fallback={null}>
      <TrackerInner />
    </React.Suspense>
  );
}
