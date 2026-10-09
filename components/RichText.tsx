import Link from "next/link";
import type { Glossary } from "@/lib/data";
import { parseInlineLinks } from "@/lib/text";
import { Glossed } from "./Glossed";

/**
 * Text from a content file, with its [markdown](links) as links: site paths
 * through next/link, #anchors in place, other sites in a new tab. With a
 * glossary, Chinese terms in it get tooltips.
 */
export function RichText({ text, glossary = {} }: { text: string; glossary?: Glossary }) {
  return parseInlineLinks(text).map(({ text, href }, i) => {
    if (!href) return <Glossed key={i} text={text} glossary={glossary} />;
    const label = <Glossed text={text} glossary={glossary} focusable={false} />;
    if (href.startsWith("/")) {
      return (
        <Link key={i} href={href}>
          {label}
        </Link>
      );
    }
    if (href.startsWith("#")) {
      return (
        <a key={i} href={href}>
          {label}
        </a>
      );
    }
    return (
      <a key={i} href={href} target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  });
}
