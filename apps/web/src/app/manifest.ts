import type { MetadataRoute } from "next";

/** Light-theme accent (packages/ui tokens). docs/adr/0014-glassmorphism.md */
const LIGHT_ACCENT = "#0b6fe8";
const LIGHT_BG = "#d9e4f5";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flyte",
    short_name: "Flyte",
    description: "Electronic Flight Bag for student and GA pilots in Poland.",
    start_url: "/pl",
    display: "standalone",
    theme_color: LIGHT_ACCENT,
    background_color: LIGHT_BG,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
