import { parseDictionary, type Dictionary } from "@/lib/hanzi";
import { readDataFile } from "./files";

/** The last parse, reused until dictionary.csv changes. */
let parsed: { csv: string; dictionary: Dictionary } | undefined;

/**
 * The parsed dictionary. The CSV is cached like every data file; parsing it
 * is done once per server process, and again only when the file changes.
 * Pages get tokenized phrases, not the dictionary; only the reading tool,
 * which tokenizes what you type, loads it in the browser (see compact.ts).
 */
export async function getDictionary(): Promise<Dictionary> {
  const csv = await readDataFile("dictionary.csv");
  if (parsed?.csv !== csv) parsed = { csv, dictionary: parseDictionary(csv) };
  return parsed.dictionary;
}
