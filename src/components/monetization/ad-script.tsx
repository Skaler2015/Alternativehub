import Script from "next/script";

/**
 * Loads the AdSense library once. The publisher id is a public identifier (it
 * ships in the script tag to every visitor), so it defaults to this site's id
 * and can be overridden via NEXT_PUBLIC_ADSENSE_CLIENT. Rendered in the root
 * layout; enables site verification + Auto Ads.
 */
export function AdScript() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-9295633540951651";
  if (!client) return null;
  return (
    <Script
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
    />
  );
}
