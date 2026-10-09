import { ProgressBar } from "@/design-system/controls";
import { Cluster, Stack } from "@/design-system/layout";
import { BambooCanvas, Sign } from "@/design-system/motifs";
import styles from "../design.module.css";

/** Signs, progress, and the bamboo canvas, as rendered by the current theme. */
export function MotifPreview() {
  return (
    <Stack gap={6}>
      <Cluster gap={6} align="flex-end">
        <Sign as="div" variant="double" seed="方昕中文">
          方昕中文
        </Sign>
        <Sign as="div">每天任務</Sign>
        <Sign as="div">學習工具</Sign>
        <Sign as="div">Flashcards</Sign>
      </Cluster>
      <Stack gap={2}>
        <ProgressBar value={0.25} label="Example progress, 25%" />
        <ProgressBar value={0.7} label="Example progress, 70%" />
      </Stack>
      <Cluster gap={4} align="stretch">
        <div className={styles.canvasFrame}>
          <BambooCanvas />
        </div>
        <div className={styles.canvasFrame}>
          <BambooCanvas filled />
        </div>
      </Cluster>
    </Stack>
  );
}
