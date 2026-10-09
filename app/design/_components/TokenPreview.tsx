import { HANZI_FONTS, HANZI_FONT_LABELS, type Theme } from "@/design-system/preferences";
import styles from "../design.module.css";

const SEMANTIC = [
  "bg",
  "surface",
  "surface-raised",
  "text",
  "text-secondary",
  "text-muted",
  "border-strong",
  "primary",
  "primary-hover",
  "secondary",
  "secondary-hover",
  "danger",
  "info",
  "highlight",
  "focus-ring",
  "annot-color",
];

const TONES = [1, 2, 3, 4, 5];
const TONE_SAMPLE = ["媽 mā", "麻 má", "馬 mǎ", "罵 mà", "嗎 ma"];

const CARDS = [
  "red",
  "dark-red",
  "brown",
  "tan",
  "orange",
  "yellow",
  "lime",
  "green",
  "teal",
  "cyan",
  "light-blue",
  "blue",
  "dark-blue",
  "purple",
  "pink",
  "hot-pink",
  "white",
  "light-grey",
  "grey",
  "dark-grey",
  "black",
];

const HANZI_SAMPLE = "池塘邊的榕樹上，知了在聲聲叫著夏天";

/** Every color and font token, rendered inside one theme. */
export function TokenPreview({ theme }: { theme: Theme }) {
  return (
    <section data-theme={theme} className={styles.preview}>
      <h2 className={styles.previewTitle}>{theme === "neon" ? "Neon" : "Bamboo"}</h2>

      <h3>Semantic colors</h3>
      <ul className={styles.swatches}>
        {SEMANTIC.map((token) => (
          <li key={token}>
            <span className={styles.chip} style={{ background: `var(--${token})` }} />
            <code>--{token}</code>
          </li>
        ))}
      </ul>

      <h3>Tones</h3>
      <p className={styles.tones}>
        {TONES.map((tone, i) => (
          <span key={tone} style={{ color: `var(--tone-${tone})` }}>
            {TONE_SAMPLE[i]}
          </span>
        ))}
      </p>

      <h3>Card colors</h3>
      <ul className={styles.cards}>
        {CARDS.map((name) => (
          <li
            key={name}
            style={{ background: `var(--card-${name})`, color: `var(--card-${name}-text)` }}
          >
            {name}
          </li>
        ))}
      </ul>

      <h3>Fonts</h3>
      <p className={styles.latin}>
        Latin text: the quick brown fox. Pinyin: chítáng biān de róngshù shàng
      </p>
      <dl className={styles.fonts}>
        {HANZI_FONTS.map((font) => (
          <div key={font} data-hanzi-font={font}>
            <dt>{HANZI_FONT_LABELS[font]}</dt>
            <dd lang="zh-Hant">{HANZI_SAMPLE}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
