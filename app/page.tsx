import Link from "next/link";
import type { ReactNode } from "react";
import { AppLink } from "@/components/AppLink";
import { Glossed } from "@/components/Glossed";
import { PageHeader } from "@/components/PageHeader";
import { RichText } from "@/components/RichText";
import { Card, buttonClassName } from "@/design-system/controls";
import { ArrowRightIcon, ExternalLinkIcon } from "@/design-system/icons";
import { Page } from "@/design-system/layout";
import { Sign } from "@/design-system/motifs";
import { getHomeContent, getResources, type Glossary } from "@/lib/data";
import { DailyTasks } from "./_components/DailyTasks";
import { HomeBackground } from "./_components/HomeBackground";
import styles from "./home.module.css";

const isInternal = (href: string) => href.startsWith("/");

/** Site paths via next/link; other sites in a new tab. */
function ItemLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return isInternal(href) ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

/** A titled card holding a list: one per resource type. */
function ResourceCard({
  title,
  id,
  glossary,
  children,
}: {
  title: string;
  id?: string;
  glossary: Glossary;
  children: ReactNode;
}) {
  return (
    <Card className={styles.resource}>
      <Sign as="h3" variant="text" id={id} text={title} className={styles.cardTitle}>
        <Glossed text={title} glossary={glossary} />
      </Sign>
      {children}
    </Card>
  );
}

/** Content comes from data/home.json and data/resources.json. */
export default async function Home() {
  const [home, resources] = await Promise.all([getHomeContent(), getResources()]);
  const { glossary, resourceTitles: titles } = home;
  /** A name inside a link: tooltips on its Chinese, without extra tab stops. */
  const linkText = (text: string) => <Glossed text={text} glossary={glossary} focusable={false} />;

  return (
    <>
      <HomeBackground />
      <PageHeader />
      <Page width="wide" className={styles.home}>
        <header className={styles.hero}>
          <Sign as="h1" variant="double" text={home.title} className={styles.title}>
            <Glossed text={home.title} glossary={glossary} />
          </Sign>
          <p className={styles.intro}>
            <RichText text={home.intro} glossary={glossary} />
          </p>
        </header>

        <Card className={styles.tasks}>
          <DailyTasks tasks={home.tasks} glossary={glossary} />
        </Card>

        <section aria-labelledby="tools">
          <Sign as="h2" id="tools" text={home.tools.title} className={styles.sectionTitle}>
            <Glossed text={home.tools.title} glossary={glossary} />
          </Sign>
          <ul className={styles.features}>
            {home.tools.items.map((tool) => (
              <li key={tool.name}>
                <Card className={styles.feature}>
                  {/* Stretched over the whole card; tooltips and description links sit above it. */}
                  <ItemLink href={tool.href} className={styles.featureLink}>
                    <span className={styles.glyph} lang="zh-Hant">
                      <Glossed text={tool.glyph} glossary={glossary} focusable={false} />
                    </span>
                    <h3 className={styles.featureName}>{linkText(tool.name)}</h3>
                  </ItemLink>
                  {tool.description && (
                    <p className={styles.featureDescription}>
                      <RichText text={tool.description} glossary={glossary} />
                    </p>
                  )}
                  <span className={styles.featureFooter} aria-hidden>
                    {isInternal(tool.href) ? (
                      <>
                        Open <ArrowRightIcon size={14} />
                      </>
                    ) : (
                      <>
                        On study-mandarin <ExternalLinkIcon size={14} />
                      </>
                    )}
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby={home.resourcesTitle ? "resources" : undefined}>
          {home.resourcesTitle && (
            <Sign as="h2" id="resources" text={home.resourcesTitle} className={styles.sectionTitle}>
              <Glossed text={home.resourcesTitle} glossary={glossary} />
            </Sign>
          )}
          <div className={styles.resources}>
            <ResourceCard title={titles.videos} id="videos" glossary={glossary}>
              {resources.videos.map((group) => (
                <div key={group.category}>
                  <h4 className={styles.category}>
                    <Glossed text={group.category} glossary={glossary} />
                  </h4>
                  <ul className={styles.list}>
                    {group.items.map((video) => (
                      <li key={video.url}>
                        <ItemLink href={video.url}>{video.name}</ItemLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </ResourceCard>

            <ResourceCard title={titles.podcasts} id="podcasts" glossary={glossary}>
              <ul className={styles.list}>
                {resources.podcasts.map((podcast) => (
                  <li key={podcast.url}>
                    <ItemLink href={podcast.url}>{podcast.name}</ItemLink>
                    {podcast.description && (
                      <span className={styles.description}>{podcast.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            </ResourceCard>

            <ResourceCard title={titles.apps} glossary={glossary}>
              <ul className={styles.list}>
                {resources.apps.map((app) => (
                  <li key={app.name} className={app.strikethrough ? styles.struck : undefined}>
                    {app.web ? (
                      <AppLink app={{ web: app.web, ios: app.ios, android: app.android }}>
                        {app.name}
                      </AppLink>
                    ) : (
                      <span>{app.name}</span>
                    )}
                    {app.description && (
                      <span className={styles.description}>{app.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            </ResourceCard>

            <ResourceCard title={titles.other} glossary={glossary}>
              <ul className={styles.list}>
                {resources.other.map((item) => (
                  <li key={item.name}>
                    {item.url ? (
                      <ItemLink href={item.url}>{item.name}</ItemLink>
                    ) : (
                      <span>{item.name}</span>
                    )}
                    {item.description && (
                      <span className={styles.description}>{item.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            </ResourceCard>
          </div>
        </section>

        <Card className={styles.about}>
          <Sign as="h2" variant="text" text={home.about.title} className={styles.cardTitle}>
            <Glossed text={home.about.title} glossary={glossary} />
          </Sign>
          {home.about.paragraphs.map((paragraph, i) => (
            <p key={i}>
              <RichText text={paragraph} glossary={glossary} />
            </p>
          ))}
          {home.about.disclaimer && (
            <p className={styles.disclaimer}>
              <RichText text={home.about.disclaimer} glossary={glossary} />
            </p>
          )}
          <div className={styles.links}>
            {home.about.links.map((link) => (
              <ItemLink
                key={link.href}
                href={link.href}
                className={buttonClassName({ variant: "ghost", size: "sm" })}
              >
                {link.label}
              </ItemLink>
            ))}
          </div>
        </Card>
      </Page>
    </>
  );
}
