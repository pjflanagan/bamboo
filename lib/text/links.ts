/** A run of text, or a link, from a string with markdown-style links. */
export type InlineSegment = { text: string; href?: string };

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * Splits "see the [zhuyin chart](/zhuyin-chart)." into text and link runs.
 * Only [text](url) is understood; everything else is plain text, so content
 * files can hold links without becoming a markup language.
 */
export function parseInlineLinks(source: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let last = 0;
  for (const match of source.matchAll(LINK)) {
    if (match.index > last) segments.push({ text: source.slice(last, match.index) });
    segments.push({ text: match[1], href: match[2] });
    last = match.index + match[0].length;
  }
  if (last < source.length) segments.push({ text: source.slice(last) });
  return segments;
}
