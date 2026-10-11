import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Page } from "@/design-system/layout";
import { TransferReceiver } from "./_components/TransferReceiver";

export const metadata: Metadata = {
  title: "Transfer progress",
  description: "Add study progress from another device.",
  // Only ever reached from a personal link.
  robots: { index: false },
};

export default function TransferPage() {
  return (
    <>
      <PageHeader title="Transfer progress" />
      <Page>
        <TransferReceiver />
      </Page>
    </>
  );
}
