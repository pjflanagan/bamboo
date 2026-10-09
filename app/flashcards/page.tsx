import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { buttonClassName } from "@/design-system/controls";
import { Page } from "@/design-system/layout";
import { getFlashcardCatalog } from "@/lib/data";
import { FlashcardStudy } from "./_components/FlashcardStudy";

export const metadata: Metadata = {
  title: "Flashcards",
};

export default async function FlashcardsPage() {
  const catalog = await getFlashcardCatalog();

  return (
    <>
      <PageHeader
        title="Flashcards"

        actions={
          <Link href="/lists" className={buttonClassName({ variant: "ghost", size: "sm" })}>
            Lists
          </Link>
        }
      />
      <Page>
        <FlashcardStudy catalog={catalog} />
      </Page>
    </>
  );
}
