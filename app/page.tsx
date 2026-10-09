import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>方昕中文</h1>
      <p>Scaffold. Pages get ported here once the design system is in place.</p>
      <p>
        <Link href="/design">Design system</Link>
      </p>
    </main>
  );
}
