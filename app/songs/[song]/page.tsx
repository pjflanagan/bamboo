import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { buttonClassName } from "@/design-system/controls";
import { Page } from "@/design-system/layout";
import { getSong, getSongs } from "@/lib/data";
import { Lyrics } from "./_components/Lyrics";
import styles from "./song.module.css";

/** Every song is prerendered at build time. */
export async function generateStaticParams() {
  return (await getSongs()).map((song) => ({ song: song.slug }));
}

export async function generateMetadata({ params }: PageProps<"/songs/[song]">): Promise<Metadata> {
  const song = await getSong((await params).song);
  if (!song) return {};
  return {
    title: song.artist ? `${song.title} · ${song.artist}` : song.title,
    description: `Lyrics to ${song.title} with pinyin, zhuyin, and English.`,
  };
}

/**
 * The header and page frame don't depend on which song this is, so they are
 * the shell every song link shares; only the song itself waits on the URL.
 */
export default function SongPage({ params }: PageProps<"/songs/[song]">) {
  return (
    <>
      <PageHeader
        title="唱歌 Songs"
        actions={
          <Link href="/songs" className={buttonClassName({ variant: "ghost", size: "sm" })}>
            Songs
          </Link>
        }
      />
      <Page>
        <Suspense fallback={null}>
          <Song params={params} />
        </Suspense>
      </Page>
    </>
  );
}

async function Song({ params }: Pick<PageProps<"/songs/[song]">, "params">) {
  const song = await getSong((await params).song);
  if (!song) notFound();

  return (
    <div className={styles.song}>
      <Lyrics title={song.title} artist={song.artist} lines={song.lines}>
        {song.spotifyTrack && (
          <iframe
            className={styles.player}
            title={`${song.title} on Spotify`}
            src={`https://open.spotify.com/embed/track/${song.spotifyTrack}?utm_source=generator`}
            height="80"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        )}
      </Lyrics>
    </div>
  );
}
