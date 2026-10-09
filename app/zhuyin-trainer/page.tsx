import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Page } from "@/design-system/layout";
import { getZhuyinDrill } from "@/lib/data";
import { ZhuyinTrainer } from "./_components/ZhuyinTrainer";

export const metadata: Metadata = {
  title: "Zhuyin trainer",
  description:
    "Practice reading zhuyin: one syllable at a time, then reveal the character and pinyin.",
};

export default async function ZhuyinTrainerPage() {
  const drill = await getZhuyinDrill();

  return (
    <>
      <PageHeader title="注音 Trainer" />
      <Page>
        <ZhuyinTrainer drill={drill} />
      </Page>
    </>
  );
}
