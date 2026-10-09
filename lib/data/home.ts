import { cacheLife } from "next/cache";
import { readDataFile } from "./files";

/*
 * The homepage's content: data/home.json (sections, tasks, tools, about) and
 * data/resources.json (videos, podcasts, apps, other). Text fields may hold
 * [markdown](links).
 */

/** Opens the app on phones, the website elsewhere. */
export type AppTarget = { web: string; ios?: string; android?: string };

export type Task = { id: string; label: string; href?: string; app?: AppTarget };

export type HomeContent = {
  title: string;
  intro: string;
  tasks: { title: string; groups: { title: string; items: Task[] }[] };
  tools: { title: string; items: { name: string; href: string; description?: string }[] };
  resourceTitles: Record<"videos" | "podcasts" | "apps" | "other", string>;
  about: {
    title: string;
    paragraphs: string[];
    disclaimer?: string;
    links: { label: string; href: string }[];
  };
};

export type Resources = {
  videos: { category: string; items: { name: string; url: string }[] }[];
  podcasts: { name: string; url: string; description?: string }[];
  apps: (Partial<AppTarget> & {
    name: string;
    description?: string;
    /** Apps no longer used: shown struck through. */
    strikethrough?: boolean;
  })[];
  other: { name: string; url?: string; description?: string }[];
};

export async function getHomeContent(): Promise<HomeContent> {
  "use cache";
  cacheLife("max");
  return JSON.parse(await readDataFile("home.json")) as HomeContent;
}

export async function getResources(): Promise<Resources> {
  "use cache";
  cacheLife("max");
  return JSON.parse(await readDataFile("resources.json")) as Resources;
}
