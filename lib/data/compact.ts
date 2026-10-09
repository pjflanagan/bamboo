import { cacheLife, cacheTag } from "next/cache";
import { compactDictionary, type CompactDictionary } from "@/lib/hanzi";
import { getDictionary } from "./dictionary";
import { DATA_TAG } from "./files";

/** The dictionary as JSON, served at /api/dictionary for the reading tool. */
export async function getCompactDictionary(): Promise<CompactDictionary> {
  "use cache";
  cacheLife("data");
  cacheTag(DATA_TAG);
  return compactDictionary(await getDictionary());
}
