import Link from "next/link";
import type { ReactNode } from "react";
import { AppLink } from "@/components/AppLink";
import { BambooLogo } from "@/components/BambooLogo";
import { Glossed } from "@/components/Glossed";
import { PageHeader } from "@/components/PageHeader";
import { RichText } from "@/components/RichText";
import { Card, buttonClassName } from "@/design-system/controls";
import { ArrowRightIcon, ExternalLinkIcon } from "@/design-system/icons";
import { Masonry, Page } from "@/design-system/layout";
import { Sign, hueScope } from "@/design-system/motifs";
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
          <h1 className={styles.title} {...hueScope(home.title)}>
            <BambooLogo label={home.title} />
          </h1>
          <p className={styles.intro}>
            <RichText text={home.intro} glossary={glossary} />
          </p>
        </header>

        <DailyTasks tasks={home.tasks} glossary={glossary} />

        <section aria-labelledby="tools">
          <Sign as="h2" id="tools" text={home.tools.title} className={styles.sectionTitle}>
            <Glossed text={home.tools.title} glossary={glossary} />
          </Sign>
          <ul className={styles.features}>
            {home.tools.items.map((tool) => (
              <li key={tool.name}>
                {/* Each card its own neon color: icon, glow, and links. */}
                <Card className={styles.feature} {...hueScope(tool.name)}>
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
                  <div className={styles.featureFooter}>
                    <span className={styles.featureOpen} aria-hidden>
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
                    {tool.buttons?.map((button) => (
                      <ItemLink
                        key={button.href}
                        href={button.href}
                        className={buttonClassName({ size: "sm", className: styles.featureButton })}
                      >
                        {linkText(button.label)}
                      </ItemLink>
                    ))}
                  </div>
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
          <Masonry>
            <ResourceCard title={titles.videos} id="videos" glossary={glossary}>
              {resources.videos.map((group) => (
                <div key={group.category}>
                  <h4 className={styles.category}>
                    <Glossed text={group.category} glossary={glossary} />
                  </h4>
                  <ul className={styles.list}>
                    {group.items.map((video) => (
                      <li key={video.url} {...hueScope(video.name)}>
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
                  <li key={podcast.url} {...hueScope(podcast.name)}>
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
                  <li
                    key={app.name}
                    className={app.strikethrough ? styles.struck : undefined}
                    {...hueScope(app.name)}
                  >
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
                  <li key={item.name} {...hueScope(item.name)}>
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
          </Masonry>
        </section>

        <section aria-labelledby="about">
          <Sign as="h2" id="about" text={home.about.title} className={styles.sectionTitle}>
            <Glossed text={home.about.title} glossary={glossary} />
          </Sign>
          <Card className={styles.about}>
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
        </section>
      </Page>
    </>
  );
}
