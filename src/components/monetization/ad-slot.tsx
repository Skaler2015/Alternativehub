"use client";

import * as React from "react";

/**
 * Google AdSense slot. Renders nothing unless NEXT_PUBLIC_ADSENSE_CLIENT is set,
 * so the site stays clean until ads are configured & approved. Pass the ad
 * `slot` id from your AdSense dashboard.
 */
export function AdSlot({ slot, className, format = "auto" }: { slot?: string; className?: string; format?: string }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  React.useEffect(() => {
    if (!client) return;
    try {
      // @ts-expect-error adsbygoogle is injected by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, [client]);

  if (!client || !slot) return null;

  return (
    <div className={className} aria-hidden>
      <p className="mb-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">Advertisement</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
