import { cacheLife } from "next/cache";
import {
  compactDictionary,
  parseDictionary,
  type CompactDictionary,
  type Dictionary,
} from "@/lib/hanzi";
import { readDataFile } from "./files";

let dictionary: Promise<Dictionary> | undefined;

/**
 * The parsed dictionary, loaded once per server process. Pages get tokenized
 * phrases, not the dictionary; only the reading tool, which tokenizes what
 * you type, loads it in the browser (getCompactDictionary).
 */
export function getDictionary(): Promise<Dictionary> {
  dictionary ??= readDataFile("dictionary.csv").then(parseDictionary);
  return dictionary;
}

/** The dictionary as JSON, served at /api/dictionary for the reading tool. */
export async function getCompactDictionary(): Promise<CompactDictionary> {
  "use cache";
  cacheLife("max");
  return compactDictionary(await getDictionary());
}
