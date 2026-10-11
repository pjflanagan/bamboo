import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, buttonClassName } from "@/design-system/controls";
import { ArrowRightIcon, ExternalLinkIcon } from "@/design-system/icons";
import { Page } from "@/design-system/layout";
import { getSongs } from "@/lib/data";
import styles from "./songs.module.css";

export const metadata: Metadata = {
  title: "Songs",
  description:
    "Song lyrics in Chinese with pinyin, zhuyin, and English to reveal as you sing along.",
};

const PLAYLIST = "https://open.spotify.com/playlist/7636wPWQfSQ2UXZ6Lj9Mn9";
const LYRIC_DOCS = "https://drive.google.com/drive/folders/1axMQBMYX7Rk4quZHPtHFPWvlqEIqbFyj";

export default async function SongsPage() {
  const songs = await getSongs();

  return (
    <>
      <PageHeader title="唱歌 Songs" />
      <Page>
        <div className={styles.songs}>
          <div className={styles.more}>
            <a
              href={PLAYLIST}
              target="_blank"
              rel="noreferrer"
              className={buttonClassName({ variant: "ghost", size: "sm" })}
            >
              Spotify playlist <ExternalLinkIcon size={14} />
            </a>
            <a
              href={LYRIC_DOCS}
              target="_blank"
              rel="noreferrer"
              className={buttonClassName({ variant: "ghost", size: "sm" })}
            >
              More lyrics on Google Docs <ExternalLinkIcon size={14} />
            </a>
          </div>
          <ul className={styles.list}>
            {songs.map((song) => (
              <li key={song.slug}>
                <Card className={styles.song}>
                  {song.artwork ? (
                    <Image
                      src={song.artwork}
                      alt=""
                      width={48}
                      height={48}
                      className={styles.art}
                    />
                  ) : (
                    <span className={styles.art} aria-hidden />
                  )}
                  <Link href={`/songs/${song.slug}`} className={styles.songLink}>
                    <span className={styles.title}>{song.title}</span>
                    {song.artist && <span className={styles.artist}>{song.artist}</span>}
                  </Link>
                  <ArrowRightIcon size={16} aria-hidden />
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </Page>
    </>
  );
}
