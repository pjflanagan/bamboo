import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Page, Section } from "@/design-system/layout";
import { AnnotationPlayground } from "./_components/AnnotationPlayground";
import { ControlsPreview } from "./_components/ControlsPreview";
import { MotifPreview } from "./_components/MotifPreview";
import { TokenPreview } from "./_components/TokenPreview";
import { TypographyPreview } from "./_components/TypographyPreview";
import { getSamplePhrases } from "./_lib/samples";
import styles from "./design.module.css";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false },
};

export default async function DesignPage() {
  const phrases = await getSamplePhrases();

  return (
    <>
      <PageHeader title="Design system" />
      <Page width="wide">
        <h1>Design system</h1>
        <p>
          Every component in the current theme. Switch theme, script, and font from the header menu.
        </p>

        <Section title="Hanzi">
          <AnnotationPlayground phrases={phrases} />
        </Section>

        <Section title="Controls">
          <ControlsPreview />
        </Section>

        <Section title="Motifs">
          <MotifPreview />
        </Section>

        <Section title="Typography">
          <TypographyPreview />
        </Section>

        <Section title="Tokens">
          <div className={styles.previews}>
            <TokenPreview theme="neon" />
            <TokenPreview theme="bamboo" />
          </div>
        </Section>
      </Page>
    </>
  );
}
