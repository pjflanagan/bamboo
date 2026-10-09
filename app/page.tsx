import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Page } from "@/design-system/layout";
import { Sign } from "@/design-system/motifs";

export default function Home() {
  return (
    <>
      <PageHeader />
      <Page>
        <Sign as="h1" variant="double" seed="方昕中文">
          方昕中文
        </Sign>
        <p>
          你好, welcome to my Mandarin study guide. The study pages are being ported here; in the
          meantime, see the <Link href="/design">design system</Link>.
        </p>
      </Page>
    </>
  );
}
