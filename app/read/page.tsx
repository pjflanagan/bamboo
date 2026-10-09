import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Page } from "@/design-system/layout";
import { Reader } from "./_components/Reader";

export const metadata: Metadata = {
  title: "Reading tool",
  description: "Type or paste Chinese to see its pinyin and zhuyin, in traditional characters.",
};

export default function ReadPage() {
  return (
    <>
      <PageHeader title="讀 Reading tool" />
      <Page>
        <Reader />
      </Page>
    </>
  );
}
