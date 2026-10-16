"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js, which caches the app for offline use once it is
 * installed. Production only: in `next dev` it would serve stale chunks over
 * hot reloads.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error: unknown) => console.error("Service worker registration failed", error));
  }, []);

  return null;
}
