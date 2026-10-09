import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "方昕中文",
    template: "方昕中文: %s",
  },
  description:
    "A personal Traditional Chinese study site with flashcards, a text reader, zhuyin drills, and song lyrics.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
