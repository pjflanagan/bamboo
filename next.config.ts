import type { NextConfig } from "next";

/**
 * Reading ./data from disk (the default in `next dev`; see lib/data/files.ts,
 * which this mirrors): refetched a second after each use, so an edit shows
 * within a refresh or two. Stale and expire stay at 5 minutes, the minimum
 * for content to stay in the App Shell; shorter, and Next reports the page's
 * data as blocking navigation ("URL data outside of Suspense").
 */
const localData =
  process.env.DATA_SOURCE === "local" ||
  (process.env.DATA_SOURCE !== "remote" && process.env.NODE_ENV === "development");

const nextConfig: NextConfig = {
  turbopack: {
    ignoreIssue: [
      // next/font has no fallback metrics for Iansui and warns even with
      // adjustFontFallback: false (design-system/tokens/fonts.ts).
      { path: "**", title: /Failed to find font override values for font `Iansui`/ },
    ],
  },
  images: {
    // Album art on the songs page (lib/data/songs.ts).
    remotePatterns: [
      new URL("https://*.spotifycdn.com/image/**"),
      new URL("https://i.scdn.co/image/**"),
    ],
  },
  async headers() {
    return [
      {
        // The service worker (public/sw.js) must always be revalidated, so a
        // new version reaches installed apps on their next launch.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    /*
     * Everything read from data/ (lib/data). Pages stay prerendered and are
     * refreshed in the background at most every 5 minutes, so a push to
     * data/ on GitHub goes live without a deploy.
     */
    data: localData
      ? { stale: 300, revalidate: 1, expire: 300 }
      : { stale: 300, revalidate: 300, expire: 60 * 60 * 24 * 30 },
  },
};

export default nextConfig;
