import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    id: "/",
    start_url: "/?utm_source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#16161f",
    theme_color: "#6d5ce7",
    categories: ["productivity", "business", "utilities"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Browse Tools", short_name: "Browse", url: "/tools" },
      { name: "Compare", short_name: "Compare", url: "/compare" },
      { name: "Leaderboard", short_name: "Leaders", url: "/leaderboard" },
      { name: "Submit a Tool", short_name: "Submit", url: "/submit" },
    ],
  };
}
