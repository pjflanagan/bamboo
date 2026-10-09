"use client";

import { useEffect } from "react";

/**
 * Tap-to-reveal for annotations outside any AnnotationScope, i.e. the user's
 * default "hover" layers, on devices that can't hover. Tapping a word toggles
 * it; CSS (--kt-*) decides which layers that reveals. Scopes handle their own
 * units and stop the event first. Render once near the root; renders nothing.
 */
export function TouchReveal() {
  useEffect(() => {
    const noHover = matchMedia("(hover: none)");
    const onClick = (event: MouseEvent) => {
      if (!noHover.matches) return;
      const word = (event.target as Element).closest?.('[data-unit="word"]');
      word?.toggleAttribute("data-revealed");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
