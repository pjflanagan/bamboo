import { cacheLife, cacheTag } from "next/cache";
import { getDictionary } from "./dictionary";
import { DATA_TAG, readDataFile } from "./files";

/*
 * The homepage's content: data/home.json (sections, tasks, tools, about) and
 * data/resources.json (videos, podcasts, apps, other). Text fields may hold
 * [markdown](links).
 */

/** Opens the app on phones, the website elsewhere. */
export type AppTarget = { web: string; ios?: string; android?: string };

/** What a piece of Chinese on the page means, shown in a tooltip. */
export type Gloss = {
  pinyin: string;
  english: string;
  /** The term in simplified characters, when that differs (added by the loader). */
  simp?: string;
};
export type Glossary = Readonly<Record<string, Gloss>>;

export type Task = { id: string; label: string; href?: string; app?: AppTarget };

/**
 * What a group asks for each day: every task (all), any one task (one), or
 * nothing (none: optional extras that don't count toward the day).
 */
export type TaskRequirement = "all" | "one" | "none";

export type TaskGroup = { title: string; require: TaskRequirement; items: Task[] };

export type HomeContent = {
  title: string;
  intro: string;
  tasks: { title: string; groups: TaskGroup[] };
  tools: {
    title: string;
    /** `glyph` is one character, shown large on the tool's card. */
    items: { glyph: string; name: string; href: string; description?: string }[];
  };
  /**
   * The heading over the resource cards. Optional: the page can deploy
   * before the data that names it is pushed.
   */
  resourcesTitle?: string;
  resourceTitles: Record<"videos" | "podcasts" | "apps" | "other", string>;
  /** Chinese terms used on the page, by text; matched longest first. */
  glossary: Glossary;
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
  cacheLife("data");
  cacheTag(DATA_TAG);
  const [json, dictionary] = await Promise.all([readDataFile("home.json"), getDictionary()]);
  const home = JSON.parse(json) as HomeContent;
  // Each term's simplified form, so the page can follow the 繁/简 preference.
  const glossary = Object.fromEntries(
    Object.entries(home.glossary).map(([term, gloss]) => {
      const simp = [...term].map((char) => dictionary.get(char)?.simp ?? char).join("");
      return [term, simp === term ? gloss : { ...gloss, simp }];
    }),
  );
  return { ...home, glossary };
}

export async function getResources(): Promise<Resources> {
  "use cache";
  cacheLife("data");
  cacheTag(DATA_TAG);
  return JSON.parse(await readDataFile("resources.json")) as Resources;
}
