import { Tooltip } from "@/design-system/overlays";
import type { Glossary } from "@/lib/data";
import { splitGlossary } from "@/lib/text";
import styles from "./Glossed.module.css";

type GlossedProps = {
  text: string;
  glossary: Glossary;
  /** Off inside links and buttons, which take focus themselves. */
  focusable?: boolean;
};

/**
 * Text with every glossary term in it wrapped in a tooltip: hover or tap
 * 每天任務 to see "měitiān rènwù · daily tasks".
 */
export function Glossed({ text, glossary, focusable = true }: GlossedProps) {
  return splitGlossary(text, Object.keys(glossary)).map(({ text, term }, i) => {
    const gloss = term ? glossary[term] : undefined;
    if (!gloss) return text;
    return (
      <Tooltip
        key={i}
        focusable={focusable}
        content={
          <>
            <span className={styles.pinyin}>{gloss.pinyin}</span>
            <span className={styles.english}>{gloss.english}</span>
          </>
        }
      >
        {text}
      </Tooltip>
    );
  });
}
