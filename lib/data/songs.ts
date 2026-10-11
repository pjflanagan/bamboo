import { cacheLife, cacheTag } from "next/cache";
import Papa from "papaparse";
import { isCardColor, type CardColor } from "@/design-system/controls";
import type { PhraseData } from "@/design-system/hanzi";
import { tokenize } from "@/lib/hanzi";
import { getDictionary } from "./dictionary";
import { DATA_TAG, readDataFile } from "./files";

/** One song: a CSV under data/songs, listed in data/songs/_songs.json. */
export type SongInfo = {
  /** URL segment: /songs/<slug>. */
  slug: string;
  title: string;
  artist?: string;
  /** For the Spotify player. */
  spotifyTrack?: string;
  /** The track's album art (300px square), from Spotify. */
  artwork?: string;
};

/**
 * A lyric line, or a section heading ("# Verse 1" in the CSV). A line's
 * color marks who sings it in a duet.
 */
export type SongLine =
  | { kind: "section"; id: string; title: string }
  | { kind: "line"; id: string; text: string; phrase: PhraseData; color?: CardColor };

export type Song = SongInfo & { lines: SongLine[] };

type ListedSong = { csv: string; title: string; artist?: string; spotify_url?: string };

/** "https://open.spotify.com/track/72OV…?si=…" -> "72OV…". */
function spotifyTrack(url?: string): string | undefined {
  return url?.match(/\/track\/([A-Za-z0-9]+)/)?.[1];
}

async function listSongs(): Promise<{ info: SongInfo; file: string }[]> {
  const listed = JSON.parse(await readDataFile("songs/_songs.json")) as ListedSong[];
  return listed.map((song) => ({
    info: {
      slug: song.csv.replaceAll("_", "-"),
      title: song.title,
      artist: song.artist,
      spotifyTrack: spotifyTrack(song.spotify_url),
    },
    file: `songs/${song.csv}.csv`,
  }));
}

/**
 * A track's album art URL, from Spotify's oEmbed endpoint (public, no key).
 * Undefined if Spotify can't be reached: the song list just goes without.
 */
async function spotifyArtwork(track: string): Promise<string | undefined> {
  "use cache";
  cacheLife("weeks");
  try {
    const url = `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${track}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return undefined;
    const { thumbnail_url } = (await response.json()) as { thumbnail_url?: unknown };
    return typeof thumbnail_url === "string" ? thumbnail_url : undefined;
  } catch {
    return undefined;
  }
}

/** Every song, in _songs.json order, with its album art. */
export async function getSongs(): Promise<SongInfo[]> {
  "use cache";
  cacheLife("data");
  cacheTag(DATA_TAG);
  return Promise.all(
    (await listSongs()).map(async ({ info }) => ({
      ...info,
      artwork: info.spotifyTrack && (await spotifyArtwork(info.spotifyTrack)),
    })),
  );
}

type Row = { phrase?: string; english?: string; pinyin?: string; color?: string };

/** A song's lyrics, tokenized on the server with each line's pinyin. */
export async function getSong(slug: string): Promise<Song | undefined> {
  "use cache";
  cacheLife("data");
  cacheTag(DATA_TAG);
  const song = (await listSongs()).find((s) => s.info.slug === slug);
  if (!song) return undefined;

  const [csv, dictionary] = await Promise.all([readDataFile(song.file), getDictionary()]);
  const { data } = Papa.parse<Row>(csv, { header: true, skipEmptyLines: true });
  const lines = data.flatMap((row, i): SongLine[] => {
    const text = row.phrase?.trim();
    if (!text) return [];
    const id = String(i);
    if (text.startsWith("#")) return [{ kind: "section", id, title: text.slice(1).trim() }];
    const color = row.color?.trim();
    return [
      {
        kind: "line",
        id,
        text,
        phrase: tokenize(text, dictionary, {
          pinyin: row.pinyin?.trim() || undefined,
          english: row.english?.trim() || undefined,
        }),
        color: isCardColor(color) ? color : undefined,
      },
    ];
  });

  return { ...song.info, lines };
}
