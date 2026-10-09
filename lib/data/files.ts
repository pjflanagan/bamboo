import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife, cacheTag } from "next/cache";

/**
 * Every cached data loader carries this tag, so one revalidateTag(DATA_TAG)
 * refreshes all of them.
 */
export const DATA_TAG = "data";

/**
 * Where data/ comes from:
 *   remote (default)   the public repo on GitHub, read at runtime, so a push
 *                      to data/ goes live without a deploy
 *   DATA_SOURCE=local  ./data on disk, to see edits without pushing
 */
function dataUrl(path: string): string {
  const repo = process.env.DATA_REPO ?? "pjflanagan/bamboo";
  const branch = process.env.DATA_BRANCH ?? "main";
  return `https://raw.githubusercontent.com/${repo}/refs/heads/${branch}/data/${path}`;
}

/**
 * Reads a file from data/. Loaders in lib/data go through here and never
 * fetch or touch the filesystem themselves. Each file is cached on its own
 * for the `data` cache life (next.config.ts), then refetched in the
 * background.
 */
export async function readDataFile(path: string): Promise<string> {
  "use cache";
  cacheLife("data");
  cacheTag(DATA_TAG);

  if (process.env.DATA_SOURCE === "local") {
    return readFile(join(process.cwd(), "data", path), "utf-8");
  }
  const response = await fetch(dataUrl(path));
  if (!response.ok) throw new Error(`data/${path}: ${response.status} from GitHub`);
  return response.text();
}
