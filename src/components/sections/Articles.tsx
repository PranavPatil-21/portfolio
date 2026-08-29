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

export function ArticleCard({ article }: { article: Article }) {
  const { external, href } = resolveDestination(article)

  const title = external ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="after:absolute after:inset-0 hover:text-[color:var(--accent)]"
    >
      {article.title}
    </a>
  ) : (
    <Link
      href={href}
      className="after:absolute after:inset-0 hover:text-[color:var(--accent)]"
    >
      {article.title}
    </Link>
  )

  return (
    <Card className="group relative flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-wider text-[color:var(--foreground)]/55">
        <time dateTime={article.date}>{formatArticleDate(article.date)}</time>
        {external ? (
          <span className="rounded-full border border-[color:var(--accent)]/40 px-2 py-0.5 normal-case tracking-normal text-[color:var(--accent)]">
            Hosted on Medium
          </span>
        ) : null}
      </div>

      <h3 className="text-lg font-semibold leading-snug tracking-tight text-[color:var(--foreground)] text-balance">
        {title}
      </h3>

      {article.excerpt ? (
        <p className="text-sm leading-7 text-[color:var(--foreground)]/70 text-pretty">
          {article.excerpt}
        </p>
      ) : null}

      {article.tags.length > 0 ? (
        <ul className="mt-auto flex flex-wrap gap-2 pt-2">
          {article.tags.map((tag) => (
            <li key={tag}>
              <Tag>{tag}</Tag>
            </li>
          ))}
        </ul>
      ) : null}

      <span
        aria-hidden
        className="text-sm font-medium text-[color:var(--accent)] transition-transform group-hover:translate-x-0.5"
      >
        {external ? 'Read on Medium →' : 'Read article →'}
      </span>
    </Card>
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
    <SectionShell id="articles" title="Writing" subtitle="Notes on the things I build.">
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((article, i) => (
          <li key={article.slug} className="h-full">
            <Reveal delay={i * 0.06}>
              <ArticleCard article={article} />
            </Reveal>
          </li>
        ))}
      </ul>

      <p className="mt-8">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--accent)] underline underline-offset-4 decoration-[color:var(--accent)]/40 hover:decoration-[color:var(--accent)]"
        >
          All articles
          <span aria-hidden>→</span>
        </Link>
      </p>
    </SectionShell>
  )
}
