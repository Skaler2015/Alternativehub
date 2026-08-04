import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";

export const runtime = "edge";

/**
 * Dynamic Open Graph image generator. Renders a branded 1200×630 card from
 * ?title= and ?subtitle=, used as the default social preview for every page.
 */
export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") ?? SITE.name).slice(0, 100);
  const subtitle = (searchParams.get("subtitle") ?? SITE.tagline).slice(0, 140);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #16161f 0%, #241d3d 55%, #3b2d6b 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #6d5ce7, #a855f7)",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>{SITE.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>{title}</div>
          <div style={{ fontSize: 30, color: "#b8b4c8", lineHeight: 1.35 }}>{subtitle}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 24, color: "#9aa0ab" }}>
          <span>{SITE.url.replace(/^https?:\/\//, "")}</span>
          <span>Discover Better Alternatives</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
