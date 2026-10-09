import type { NextConfig } from "next";

/** Reading ./data from disk (DATA_SOURCE=local): edits show on the next request. */
const localData = process.env.DATA_SOURCE === "local";

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
      ? { stale: 0, revalidate: 1, expire: 1 }
      : { stale: 300, revalidate: 300, expire: 60 * 60 * 24 * 30 },
  },
};

export default nextConfig;
