import { getCompactDictionary } from "@/lib/data";

/** The dictionary as static JSON, for the reading tool to tokenize in the browser. */
export async function GET() {
  return Response.json(await getCompactDictionary());
}
