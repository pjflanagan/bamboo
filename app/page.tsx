import Link from "next/link";
import { AppLink } from "@/components/AppLink";
import { PageHeader } from "@/components/PageHeader";
import { RichText } from "@/components/RichText";
import { Page, Section } from "@/design-system/layout";
import { Sign } from "@/design-system/motifs";
import { getHomeContent, getResources } from "@/lib/data";
import { DailyTasks } from "./_components/DailyTasks";
import styles from "./home.module.css";

/** A tool or resource name, linked: site paths via next/link, other sites in a new tab. */
function ItemLink({ href, children }: { href: string; children: string }) {
  return href.startsWith("/") ? (
    <Link href={href}>{children}</Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

/** Content comes from data/home.json and data/resources.json. */
export default async function Home() {
  const [home, resources] = await Promise.all([getHomeContent(), getResources()]);
  const titles = home.resourceTitles;

  return (
    <>
      <PageHeader />
      <Page>
        <Sign as="h1" variant="double" className={styles.title}>
          {home.title}
        </Sign>
        <p>
          <RichText text={home.intro} />
        </p>

        <Section>
          <Sign as="h2">{home.tasks.title}</Sign>
          <DailyTasks groups={home.tasks.groups} />
        </Section>

        <Section>
          <Sign as="h2">{home.tools.title}</Sign>
          <ul className={styles.list}>
            {home.tools.items.map((tool) => (
              <li key={tool.name}>
                <ItemLink href={tool.href}>{tool.name}</ItemLink>
                {tool.description && (
                  <span className={styles.description}>
                    {" – "}
                    <RichText text={tool.description} />
                  </span>
                )}
              </li>
            ))}
          </ul>

          <Sign as="h3" variant="text" className={styles.subheading} id="videos">
            {titles.videos}
          </Sign>
          <div className={styles.columns}>
            {resources.videos.map((group) => (
              <div key={group.category}>
                <Sign as="h4" variant="text" className={styles.category}>
                  {group.category}
                </Sign>
                <ul className={styles.list}>
                  {group.items.map((video) => (
                    <li key={video.url}>
                      <ItemLink href={video.url}>{video.name}</ItemLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Sign as="h3" variant="text" className={styles.subheading} id="podcasts">
            {titles.podcasts}
          </Sign>
          <ul className={styles.list}>
            {resources.podcasts.map((podcast) => (
              <li key={podcast.url}>
                <ItemLink href={podcast.url}>{podcast.name}</ItemLink>
                {podcast.description && (
                  <span className={styles.description}>{` – ${podcast.description}`}</span>
                )}
              </li>
            ))}
          </ul>

          <Sign as="h3" variant="text" className={styles.subheading}>
            {titles.apps}
          </Sign>
          <ul className={styles.list}>
            {resources.apps.map((app) => (
              <li key={app.name} className={app.strikethrough ? styles.struck : undefined}>
                {app.web ? (
                  <AppLink app={{ web: app.web, ios: app.ios, android: app.android }}>
                    {app.name}
                  </AppLink>
                ) : (
                  app.name
                )}
                {app.description && (
                  <span className={styles.description}>{` – ${app.description}`}</span>
                )}
              </li>
            ))}
          </ul>

          <Sign as="h3" variant="text" className={styles.subheading}>
            {titles.other}
          </Sign>
          <ul className={styles.list}>
            {resources.other.map((item) => (
              <li key={item.name}>
                {item.url ? <ItemLink href={item.url}>{item.name}</ItemLink> : item.name}
                {item.description && (
                  <span className={styles.description}>{` – ${item.description}`}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>

        <footer className={styles.about}>
          <Sign as="h3" variant="text" className={styles.subheading}>
            {home.about.title}
          </Sign>
          {home.about.paragraphs.map((paragraph, i) => (
            <p key={i}>
              <RichText text={paragraph} />
            </p>
          ))}
          {home.about.disclaimer && (
            <p className={styles.disclaimer}>
              <RichText text={home.about.disclaimer} />
            </p>
          )}
          <ul className={styles.links}>
            {home.about.links.map((link) => (
              <li key={link.href}>
                <ItemLink href={link.href}>{link.label}</ItemLink>
              </li>
            ))}
          </ul>
        </footer>
      </Page>
    </>
  );
}
