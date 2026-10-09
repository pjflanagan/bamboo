import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Reads a file from data/. For now this is the local folder, read at build
 * time; step 6 makes it fetch from GitHub at runtime (DATA_SOURCE=local
 * keeps this path for development). Loaders in lib/data go through here
 * and never touch the filesystem themselves.
 */
export async function readDataFile(path: string): Promise<string> {
  return readFile(join(process.cwd(), "data", path), "utf-8");
}
