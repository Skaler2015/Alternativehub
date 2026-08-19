import Script from "next/script";

/**
 * Statcounter analytics. The project id + security code are public identifiers
 * (Statcounter's own <noscript> pixel exposes them), so they default to this
 * site's values and can be overridden via env if ever needed. Loads after the
 * page is interactive so it never blocks rendering.
 */
export function StatCounter() {
  const project = process.env.NEXT_PUBLIC_STATCOUNTER_PROJECT || "13350845";
  const security = process.env.NEXT_PUBLIC_STATCOUNTER_SECURITY || "57bebf09";
  if (!project || !security) return null;

  return (
    <>
      <Script id="statcounter-init" strategy="afterInteractive">
        {`
          var sc_project=${Number(project)};
          var sc_invisible=1;
          var sc_security="${security}";
          (function(){
            var s=document.createElement('script');
            s.type='text/javascript'; s.async=true;
            s.src='https://www.statcounter.com/counter/counter.js';
            document.body.appendChild(s);
          })();
        `}
      </Script>
      <noscript>
        <div className="statcounter">
          <a title="Web Analytics Made Easy - Statcounter" href="https://statcounter.com/" target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="statcounter"
              src={`https://c.statcounter.com/${project}/0/${security}/1/`}
              alt="Web Analytics Made Easy - Statcounter"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </a>
        </div>
      </noscript>
    </>
  );
}
