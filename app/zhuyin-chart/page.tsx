import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { buttonClassName } from "@/design-system/controls";
import { Page } from "@/design-system/layout";
import { getZhuyinChart } from "@/lib/data";
import { ZhuyinChart } from "./_components/ZhuyinChart";

export const metadata: Metadata = {
  title: "Zhuyin chart",
  description: "Every zhuyin symbol with its pinyin spelling. Tap a symbol to hear it.",
};

export default async function ZhuyinChartPage() {
  const chart = await getZhuyinChart();

  return (
    <>
      <PageHeader
        title="注音 Chart"
        actions={
          <Link
            href="/zhuyin-trainer"
            className={buttonClassName({ variant: "ghost", size: "sm" })}
          >
            Trainer
          </Link>
        }
      />
      <Page>
        <ZhuyinChart chart={chart} />
      </Page>
    </>
  );
}
