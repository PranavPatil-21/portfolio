import Link from 'next/link'
import type { Article } from '@/content'
import SectionShell from '@/components/ui/SectionShell'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Reveal from '@/components/ui/Reveal'

/**
 * Where an article actually lives.
 *
 * `hasFullText: false` means we only ever received an abstract — typically a
 * member-only Medium post — so linking to `/articles/<slug>` would show a page
 * with no body. Those link out instead. The `externalUrl` guard matters because
 * the schema allows `hasFullText: false` with no URL; in that case the on-site
 * route is still the least-broken destination.
 */
function resolveDestination(article: Article) {
  const external = !article.hasFullText && Boolean(article.externalUrl)
  return {
    external,
    href: external ? (article.externalUrl as string) : `/articles/${article.slug}`,
  }
}

export function formatArticleDate(date: string): string {
  const parts = date.split('-').map(Number)
  const d = new Date(Date.UTC(parts[0], (parts[1] ?? 1) - 1, parts[2] ?? 1))
  return d.toLocaleDateString('en-GB', {
    day: parts[2] ? 'numeric' : undefined,
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * The one link per article, stretched over its whole row or card.
 *
 * Everything else in the item — the date, the badge, the "read" cue — is inert
 * text, so an article is exactly one tab stop and exactly one accessible name.
 */
function ArticleLink({ article }: { article: Article }) {
  const { external, href } = resolveDestination(article)
  const className =
    'after:absolute after:inset-0 transition-colors duration-200 hover:text-[var(--accent-readable)] motion-reduce:transition-none'

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {article.title}
    </a>
  ) : (
    <Link href={href} className={className}>
      {article.title}
    </Link>
  )
}

/**
 * The externally-hosted marker.
 *
 * Kept as prominent as the date: whether a click leaves the site is the one
 * thing a reader wants to know before they click.
 */
function ExternalBadge() {
  return (
    <span className="eyebrow text-[var(--accent-readable)]">Hosted on Medium</span>
  )
}

function ArticleTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <ul className="mt-3 flex list-none flex-wrap gap-1.5 p-0">
      {tags.map((tag) => (
        <li key={tag}>
          <Tag>{tag}</Tag>
        </li>
      ))}
    </ul>
  )
}

/**
 * The card form, used by the `/articles` index where a grid needs equal-height
 * tiles. The homepage uses the editorial row form below instead.
 */
export function ArticleCard({ article }: { article: Article }) {
  const { external } = resolveDestination(article)

  return (
    <Card className="group relative flex h-full flex-col p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <time dateTime={article.date} className="eyebrow tabular">
          {formatArticleDate(article.date)}
        </time>
        {external ? <ExternalBadge /> : null}
      </div>

      <h3 className="mt-3 text-[17px] leading-snug font-semibold tracking-tight text-balance text-[var(--foreground)]">
        <ArticleLink article={article} />
      </h3>

      {article.excerpt ? (
        <p className="mt-2 text-sm leading-relaxed text-pretty text-[var(--muted)]">
          {article.excerpt}
        </p>
      ) : null}

      <div className="mt-auto">
        <ArticleTags tags={article.tags} />
      </div>

      <span aria-hidden="true" className="mt-4 text-[13px] text-[var(--accent-readable)]">
        {external ? 'Read on Medium →' : 'Read article →'}
      </span>
    </Card>
  )
}

/**
 * The editorial row: a mono date column beside the title, excerpt and tags.
 * Rules rather than surfaces, so the list reads as a contents page — the
 * fastest thing to scan when a reader is deciding whether to stop.
 */
function ArticleRow({ article }: { article: Article }) {
  const { external } = resolveDestination(article)

  return (
    <article className="group relative grid gap-2 py-6 md:grid-cols-[10rem_1fr] md:gap-8">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 md:flex-col md:items-start md:gap-y-2 md:pt-1">
        <time dateTime={article.date} className="eyebrow tabular">
          {formatArticleDate(article.date)}
        </time>
        {external ? <ExternalBadge /> : null}
      </div>

      <div className="min-w-0">
        <h3 className="text-lg leading-snug font-semibold tracking-tight text-balance text-[var(--foreground)]">
          <ArticleLink article={article} />
        </h3>

        {article.excerpt ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-pretty text-[var(--muted)]">
            {article.excerpt}
          </p>
        ) : null}

        <ArticleTags tags={article.tags} />

        <span
          aria-hidden="true"
          className="mt-3 inline-block text-[13px] text-[var(--accent-readable)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:opacity-100 motion-reduce:transition-none"
        >
          {external ? 'Read on Medium →' : 'Read article →'}
        </span>
      </div>
    </article>
  )
}

/**
 * Homepage teaser. Shows the most recent handful and defers the rest to
 * `/articles`; an empty list renders nothing at all rather than an orphan
 * heading, which is the convention every section on this site follows.
 */
export default function Articles({
  items,
  limit = 3,
}: {
  items: Article[]
  limit?: number
}) {
  if (items.length === 0) return null

  const shown = items.slice(0, limit)

  return (
    <SectionShell
      id="articles"
      eyebrow="Selected"
      title="Writing"
      subtitle="Notes on what I build, why it was worth building, and what it cost."
      action={
        <Link
          href="/articles"
          className="text-[13px] text-[var(--accent-readable)] underline-offset-4 transition-colors duration-200 hover:underline motion-reduce:transition-none"
        >
          All articles →
        </Link>
      }
    >
      <ol className="list-none divide-y divide-[var(--hairline)] border-y border-[var(--hairline)] p-0">
        {shown.map((article, i) => (
          <li key={article.slug}>
            <Reveal delay={i * 0.05}>
              <ArticleRow article={article} />
            </Reveal>
          </li>
        ))}
      </ol>
    </SectionShell>
  )
}
