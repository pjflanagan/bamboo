import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false },
};

export default function DesignPage() {
  return (
    <main>
      <h1>Design system</h1>
      <p>Kitchen sink for every component, in both themes. Filled in from step 2 onward.</p>
    </main>
  );
}
