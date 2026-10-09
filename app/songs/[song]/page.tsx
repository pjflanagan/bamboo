import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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

export default async function SongPage({ params }: PageProps<"/songs/[song]">) {
  const song = await getSong((await params).song);
  if (!song) notFound();

  return (
    <>
      <PageHeader
        title={song.title}
        actions={
          <Link href="/songs" className={buttonClassName({ variant: "ghost", size: "sm" })}>
            Songs
          </Link>
        }
      />
      <Page>
        <div className={styles.song}>
          <header className={styles.header}>
            <h1 className={styles.title}>{song.title}</h1>
            {song.artist && <p className={styles.artist}>{song.artist}</p>}
          </header>
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
          <Lyrics lines={song.lines} />
        </div>
      </Page>
    </>
  );
}
