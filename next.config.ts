import type { NextConfig } from "next";

/**
 * Reading ./data from disk (the default in `next dev`; see lib/data/files.ts,
 * which this mirrors): refetched a second after
 * each use, so an edit shows within a refresh or two. Stale and expire stay
 * at the minimums for prerendering (30s, 5min), so local builds still work.
 */
const localData =
  process.env.DATA_SOURCE === "local" ||
  (process.env.DATA_SOURCE !== "remote" && process.env.NODE_ENV === "development");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    /*
     * Everything read from data/ (lib/data). Pages stay prerendered and are
     * refreshed in the background at most every 5 minutes, so a push to
     * data/ on GitHub goes live without a deploy.
     */
    data: localData
      ? { stale: 30, revalidate: 1, expire: 300 }
      : { stale: 300, revalidate: 300, expire: 60 * 60 * 24 * 30 },
  },
};

export default nextConfig;
