import Script from "next/script";

/**
 * Loads Google Analytics 4 (gtag.js) once, only when a Measurement ID is
 * configured via NEXT_PUBLIC_GA_ID (e.g. "G-XXXXXXXXXX"). Rendered in the
 * root layout. Uses afterInteractive so it never blocks page rendering.
 */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
