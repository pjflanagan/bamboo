import {
  Iansui,
  LXGW_WenKai_TC,
  Noto_Sans,
  Noto_Sans_TC,
  Noto_Serif_TC,
  Source_Sans_3,
} from "next/font/google";

/*
 * Latin fonts, one per theme. Preloaded: every page uses one of them.
 */

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "latin-ext"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin", "latin-ext"],
});

/*
 * Hanzi fonts. Google serves CJK fonts as many small unicode-range slices,
 * and the browser only downloads the slices for characters on the page, so
 * declaring all four costs nothing until one is used. They are not preloaded:
 * preloading would only fetch the latin slice, which we never use them for.
 */

const notoSansTc = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  preload: false,
});

const notoSerifTc = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  preload: false,
});

const wenKaiTc = LXGW_WenKai_TC({
  variable: "--font-wenkai-tc",
  weight: ["400", "700"],
  preload: false,
});

const iansui = Iansui({
  variable: "--font-iansui",
  weight: "400",
  preload: false,
  // next/font has no metrics for Iansui to build a size-matched fallback.
  adjustFontFallback: false,
});

/** Class names that define every font's CSS variable. Apply to <html>. */
export const fontVariables = [notoSans, sourceSans, notoSansTc, notoSerifTc, wenKaiTc, iansui]
  .map((font) => font.variable)
  .join(" ");
