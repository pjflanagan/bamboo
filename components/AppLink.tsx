"use client";

import type { ReactNode } from "react";
import type { AppTarget } from "@/lib/data";

/**
 * A link that opens an app on iOS or Android (its URL scheme, e.g.
 * duolingo://) and its website everywhere else. If the app doesn't open,
 * the website loads after a moment instead.
 */
export function AppLink({ app, children }: { app: AppTarget; children: ReactNode }) {
  return (
    <a
      href={app.web}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => {
        const agent = navigator.userAgent;
        const scheme = /iPhone|iPad|iPod/.test(agent)
          ? app.ios
          : /Android/.test(agent)
            ? app.android
            : undefined;
        if (!scheme) return; // not a phone: follow the web link
        event.preventDefault();
        // Leaving for the app hides the page; if it's still showing, the app isn't installed.
        const fallback = setTimeout(() => {
          if (document.visibilityState === "visible") window.location.href = app.web;
        }, 1200);
        document.addEventListener("visibilitychange", () => clearTimeout(fallback), { once: true });
        window.location.href = scheme;
      }}
    >
      {children}
    </a>
  );
}
