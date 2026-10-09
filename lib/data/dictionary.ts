import { parseDictionary, type Dictionary } from "@/lib/hanzi";
import { readDataFile } from "./files";

let dictionary: Promise<Dictionary> | undefined;

/**
 * The parsed dictionary, loaded once per server process. Server only: pages
 * get tokenized phrases, never the dictionary itself.
 */
export function getDictionary(): Promise<Dictionary> {
  dictionary ??= readDataFile("dictionary.csv").then(parseDictionary);
  return dictionary;
}
