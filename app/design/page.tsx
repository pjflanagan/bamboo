import type { Metadata } from "next";
import { PreferenceControls } from "@/components/PreferenceControls";
import { TokenPreview } from "./_components/TokenPreview";
import styles from "./design.module.css";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false },
};

export default function DesignPage() {
  return (
    <main className={styles.page}>
      <h1>Design system</h1>
      <div className={styles.panel}>
        <PreferenceControls />
      </div>
      <div className={styles.previews}>
        <TokenPreview theme="neon" />
        <TokenPreview theme="bamboo" />
      </div>
    </main>
  );
}
