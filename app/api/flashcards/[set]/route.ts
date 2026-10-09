import { getFlashcardCatalog, getFlashcardSet } from "@/lib/data";

/** Every set is prerendered to static JSON at build time. */
export async function generateStaticParams() {
  const { classTopics, collections } = await getFlashcardCatalog();
  return [...classTopics, ...collections].flatMap((group) =>
    group.sets.map((set) => ({ set: set.slug })),
  );
}

/** One set's tokenized cards, for the flashcards page to load on demand. */
export async function GET(_request: Request, { params }: RouteContext<"/api/flashcards/[set]">) {
  const set = await getFlashcardSet((await params).set);
  if (!set) return Response.json({ error: "Unknown set" }, { status: 404 });
  return Response.json(set);
}
