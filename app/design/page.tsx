import type { Metadata } from "next";
import { PreferenceControls } from "@/components/PreferenceControls";
import { AnnotationPlayground } from "./_components/AnnotationPlayground";
import { TokenPreview } from "./_components/TokenPreview";
import { getSamplePhrases } from "./_lib/samples";
import styles from "./design.module.css";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false },
};

export default async function DesignPage() {
  const phrases = await getSamplePhrases();

  return (
    <main className={styles.page}>
      <h1>Design system</h1>
      <div className={styles.panel}>
        <PreferenceControls />
      </div>

      <h2>Hanzi</h2>
      <AnnotationPlayground phrases={phrases} />

      <h2>Tokens</h2>
      <div className={styles.previews}>
        <TokenPreview theme="neon" />
        <TokenPreview theme="bamboo" />
      </div>
    </main>
  );
}
