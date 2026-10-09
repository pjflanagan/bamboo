import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { buttonClassName } from "@/design-system/controls";
import { Page } from "@/design-system/layout";
import { getFlashcardCatalog } from "@/lib/data";
import { SetEditor } from "./_components/SetEditor";

export const metadata: Metadata = {
  title: "Lists",
};

export default async function ListsPage() {
  const catalog = await getFlashcardCatalog();

  return (
    <>
      <PageHeader
        title="Lists"

        actions={
          <Link href="/flashcards" className={buttonClassName({ variant: "ghost", size: "sm" })}>
            Study
          </Link>
        }
      />
      <Page>
        <SetEditor catalog={catalog} />
      </Page>
    </>
  );
}
