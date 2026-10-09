import { BambooCanvas } from "@/design-system/motifs";
import styles from "../home.module.css";

/**
 * Behind the whole homepage: bamboo-web's growing stalks in bamboo, the old
 * study-mandarin dark gradient in neon. Fixed to the viewport, behind the
 * content (the root paints the page color underneath it).
 */
export function HomeBackground() {
  return (
    <div className={styles.background} aria-hidden>
      <BambooCanvas filled className={styles.bamboo} />
    </div>
  );
}
