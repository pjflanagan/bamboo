import type { MetadataRoute } from "next";
import { THEME_COLORS } from "@/design-system/attributes";
import { DEFAULT_THEME } from "@/lib/preferences";

/** The web app manifest, served at /manifest.webmanifest: makes the site installable. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "方昕中文",
    short_name: "方昕中文",
    description:
      "A personal Traditional Chinese study site with flashcards, a text reader, zhuyin drills, and song lyrics.",
    lang: "zh-Hant",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: THEME_COLORS[DEFAULT_THEME],
    theme_color: THEME_COLORS[DEFAULT_THEME],
    categories: ["education"],
    // Full-bleed artwork with the leaf inside the central safe zone, so the
    // same files serve as maskable icons.
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Flashcards", url: "/flashcards" },
      { name: "Read", url: "/read" },
      { name: "Songs", url: "/songs" },
    ],
  };
}
