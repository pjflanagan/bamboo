import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/design-system/tokens/fonts";
import {
  DEFAULT_PREFERENCES,
  DEFAULT_THEME,
  PreferencesScript,
  PreferencesSync,
  THEME_COLORS,
} from "@/design-system/preferences";
import "@/design-system/tokens/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "方昕中文",
    template: "方昕中文: %s",
  },
  description:
    "A personal Traditional Chinese study site with flashcards, a text reader, zhuyin drills, and song lyrics.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.neon },
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.bamboo },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // The static HTML carries defaults; PreferencesScript swaps in the saved
  // values before first paint, so <html> attributes differ from the server
  // render by design (hence suppressHydrationWarning).
  return (
    <html
      lang="en"
      className={fontVariables}
      data-theme={DEFAULT_THEME}
      data-hanzi-font={DEFAULT_PREFERENCES.font}
      data-script={DEFAULT_PREFERENCES.script}
      suppressHydrationWarning
    >
      <head>
        <PreferencesScript />
      </head>
      <body>
        <PreferencesSync />
        {children}
      </body>
    </html>
  );
}
