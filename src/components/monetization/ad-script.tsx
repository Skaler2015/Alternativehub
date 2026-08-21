/**
 * Loads the AdSense library. Rendered as a plain async <script> so it lands in
 * the server HTML head (React 19 hoists async scripts) exactly like AdSense's
 * own snippet — this is what the AdSense verification crawler looks for. The
 * publisher id is a public identifier (it ships to every visitor), so it
 * defaults to this site's id and can be overridden via NEXT_PUBLIC_ADSENSE_CLIENT.
 */
export function AdScript() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-9295633540951651";
  if (!client) return null;
  return (
    // eslint-disable-next-line @next/next/no-sync-scripts
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
    />
  );
}
