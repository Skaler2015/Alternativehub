/**
 * Statcounter analytics. Rendered directly into the server HTML (not injected
 * after hydration) so it appears in view-source and is detectable by
 * Statcounter's verifier, while still loading counter.js only after the inline
 * config vars are set (correct order). The project id + security code are public
 * identifiers (Statcounter's own <noscript> pixel exposes them); overridable via
 * env if ever needed.
 */
export function StatCounter() {
  const project = process.env.NEXT_PUBLIC_STATCOUNTER_PROJECT || "13350845";
  const security = process.env.NEXT_PUBLIC_STATCOUNTER_SECURITY || "57bebf09";
  if (!project || !security) return null;

  const inline =
    `var sc_project=${Number(project)};` +
    `var sc_invisible=1;` +
    `var sc_security="${security}";` +
    `(function(){var s=document.createElement('script');s.type='text/javascript';s.async=true;` +
    `s.src='https://www.statcounter.com/counter/counter.js';` +
    `(document.body||document.head).appendChild(s);})();`;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script dangerouslySetInnerHTML={{ __html: inline }} />
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
