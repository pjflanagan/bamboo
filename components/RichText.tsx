import Link from "next/link";
import { parseInlineLinks } from "@/lib/text";

/**
 * Text from a content file, with its [markdown](links) as links: site paths
 * through next/link, #anchors in place, other sites in a new tab.
 */
export function RichText({ text }: { text: string }) {
  return parseInlineLinks(text).map(({ text, href }, i) => {
    if (!href) return text;
    if (href.startsWith("/")) {
      return (
        <Link key={i} href={href}>
          {text}
        </Link>
      );
    }
    if (href.startsWith("#")) {
      return (
        <a key={i} href={href}>
          {text}
        </a>
      );
    }
    return (
      <a key={i} href={href} target="_blank" rel="noreferrer">
        {text}
      </a>
    );
  });
}
