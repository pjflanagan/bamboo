import { getFlashcardCatalog } from "@/lib/data";

/** Every set, grouped as on the set picker, for the Chrome extension (extension/). */
export async function GET() {
  return Response.json(await getFlashcardCatalog());
}
