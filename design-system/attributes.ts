/*
 * The design system's contract with the page: the values its CSS understands
 * for the data attributes below. Any element may carry them; <html> carries
 * the user's preferences, and a subtree can override them.
 *
 *   data-theme        neon | bamboo          tokens/neon.css, tokens/bamboo.css
 *   data-hanzi-font   sans | serif | ...     tokens/fonts.css
 *   data-script       trad | simp            hanzi/scope.css
 *
 * Where the values come from (cookie, user controls) is the app's business,
 * not the design system's: see lib/preferences and providers/.
 */

export const THEMES = ["neon", "bamboo"] as const;
export const HANZI_FONTS = ["sans", "serif", "wenkai", "iansui"] as const;
export const SCRIPTS = ["trad", "simp"] as const;

export type Theme = (typeof THEMES)[number];
export type HanziFont = (typeof HANZI_FONTS)[number];
export type Script = (typeof SCRIPTS)[number];

export const THEME_LABELS: Record<Theme, string> = {
  neon: "Neon",
  bamboo: "Bamboo",
};

export const HANZI_FONT_LABELS: Record<HanziFont, string> = {
  sans: "Sans",
  serif: "Serif",
  wenkai: "WenKai",
  iansui: "Iansui",
};

export const SCRIPT_LABELS: Record<Script, string> = {
  trad: "繁 Traditional",
  simp: "简 Simplified",
};

/** Page background per theme, for the browser UI (<meta name="theme-color">). */
export const THEME_COLORS: Record<Theme, string> = {
  neon: "#1c1c1c",
  bamboo: "#f5f2ee",
};

/*
 * Default annotation layers, set on <html> as data-default-pinyin,
 * data-default-zhuyin, and data-default-english (hanzi/scope.css). They apply
 * wherever no AnnotationScope sets that layer. Click isn't offered: a page
 * that wants click-to-reveal says so with its own scope.
 */
export const DEFAULT_LAYERS = ["pinyin", "zhuyin", "english"] as const;
export const DEFAULT_LAYER_MODES = ["shown", "hover", "collapsed"] as const;

export type DefaultLayer = (typeof DEFAULT_LAYERS)[number];
export type DefaultLayerMode = (typeof DEFAULT_LAYER_MODES)[number];

export const DEFAULT_LAYER_LABELS: Record<DefaultLayer, string> = {
  pinyin: "Pinyin",
  zhuyin: "Zhuyin",
  english: "English",
};

export const DEFAULT_LAYER_MODE_LABELS: Record<DefaultLayerMode, string> = {
  shown: "Show",
  hover: "Hover",
  collapsed: "Hide",
};
