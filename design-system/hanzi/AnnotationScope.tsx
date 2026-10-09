"use client";

import {
  createContext,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  isClickable,
  isTappable,
  mergeConfig,
  scopeStyle,
  type AnnotationConfig,
  type RevealUnit,
} from "./annotation";

const AnnotationContext = createContext<AnnotationConfig>({});

/** The merged config of the nearest scope. */
export function useAnnotation(): AnnotationConfig {
  return useContext(AnnotationContext);
}

export type AnnotationScopeHandle = {
  /** Re-hide everything revealed by clicks or taps in this scope. */
  clearRevealed(): void;
};

type AnnotationScopeProps = AnnotationConfig & {
  children: ReactNode;
  ref?: Ref<AnnotationScopeHandle>;
};

const UNIT_SELECTOR: Record<RevealUnit, string> = {
  character: '[data-unit="character"]',
  word: '[data-unit="word"]',
  phrase: '[data-unit="phrase"]',
};

function toggle(unit: Element) {
  const revealed = !unit.hasAttribute("data-revealed");
  unit.toggleAttribute("data-revealed", revealed);
  if (unit.getAttribute("role") === "button") {
    unit.setAttribute("aria-pressed", String(revealed));
  }
}

/**
 * Sets how annotations behave for everything inside it. Renders a
 * `display: contents` wrapper, so it never affects layout.
 *
 * Visibility is pure CSS: this component only writes custom properties
 * (see scopeStyle) and data attributes. Hover reveals cost no JavaScript.
 * Click reveals use one delegated listener per scope that toggles
 * `data-revealed` on the clicked unit, without a React re-render.
 */
export function AnnotationScope({ children, ref, ...config }: AnnotationScopeProps) {
  const parent = useContext(AnnotationContext);
  // Config is plain JSON. Keying on its serialized form keeps the context
  // value stable across re-renders, so units only re-render when it changes.
  const key = JSON.stringify(mergeConfig(parent, config));
  const merged = useMemo(() => JSON.parse(key) as AnnotationConfig, [key]);
  const element = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    clearRevealed() {
      element.current?.querySelectorAll("[data-revealed]").forEach((unit) => {
        unit.removeAttribute("data-revealed");
        if (unit.hasAttribute("aria-pressed")) unit.setAttribute("aria-pressed", "false");
      });
    },
  }));

  const unit = merged.revealUnit ?? "word";
  const clickable = isClickable(merged, unit);
  const tappable = isTappable(merged, unit);

  const findUnit = useCallback(
    (target: EventTarget) => {
      const found = (target as Element).closest?.(UNIT_SELECTOR[unit]);
      return found && element.current?.contains(found) ? found : null;
    },
    [unit],
  );

  const onClick = (event: MouseEvent) => {
    // Hover layers become tap-to-reveal on devices that can't hover.
    if (!clickable && !(tappable && matchMedia("(hover: none)").matches)) return;
    const found = findUnit(event.target);
    if (!found) return;
    event.stopPropagation(); // an outer scope shouldn't toggle it again
    toggle(found);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!clickable || (event.key !== "Enter" && event.key !== " ")) return;
    const found = findUnit(event.target);
    if (!found || found !== event.target) return;
    event.preventDefault();
    event.stopPropagation();
    toggle(found);
  };

  return (
    <AnnotationContext value={merged}>
      <div
        ref={element}
        style={{ display: "contents", ...scopeStyle(merged) }}
        data-script={config.script}
        data-hanzi-font={config.font}
        onClick={tappable ? onClick : undefined}
        onKeyDown={clickable ? onKeyDown : undefined}
      >
        {children}
      </div>
    </AnnotationContext>
  );
}

/**
 * Props that make a unit operable when its scope reveals on click: focusable,
 * announced as a toggle button. aria-pressed is managed by the scope's
 * listener, not React, so re-renders don't reset it.
 */
export function useUnitProps(unit: RevealUnit) {
  const config = useAnnotation();
  return isClickable(config, unit) ? { role: "button", tabIndex: 0 } : {};
}
