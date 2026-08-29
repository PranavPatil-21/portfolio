import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getNativeArticles, getSettings } from '@/content'
import type { Article } from '@/content'
import { MarkdownBody } from '@/lib/markdown'
import { formatArticleDate } from '@/components/sections/Articles'
import Tag from '@/components/ui/Tag'

type Params = { slug: string }

function findArticle(slug: string): Article | undefined {
  return getNativeArticles().find((a) => a.slug === slug)
}

export function generateStaticParams(): Params[] {
  return getNativeArticles().map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const article = findArticle(slug)
  if (!article) return { title: 'Article not found' }

  const settings = getSettings()

  return {
    title: `${article.title} · ${settings.name}`,
    description: article.excerpt || settings.seo.description,
    // An imported article's original lives elsewhere; pointing the canonical at
    // it is what keeps this copy from competing with the source in search.
    // Omit the key entirely when absent — `canonical: undefined` is not the same
    // as no `alternates` at all.
    ...(article.canonicalUrl
      ? { alternates: { canonical: article.canonicalUrl } }
      : {}),
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt || settings.seo.description,
      publishedTime: article.date,
      ...(article.cover ? { images: [{ url: article.cover }] } : {}),
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const article = findArticle(slug)

  if (!article) notFound()

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      <article>
        <header className="mb-12 border-b border-[color:var(--foreground)]/10 pb-10">
          <p className="text-xs uppercase tracking-wider text-[color:var(--foreground)]/55">
            <time dateTime={article.date}>{formatArticleDate(article.date)}</time>
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[color:var(--foreground)] text-balance sm:text-5xl">
            {article.title}
          </h1>
          {article.excerpt ? (
            <p className="mt-5 text-lg leading-8 text-[color:var(--foreground)]/70 text-pretty">
              {article.excerpt}
            </p>
          ) : null}
          {article.tags.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <li key={tag}>
                  <Tag>{tag}</Tag>
                </li>
              ))}
            </ul>
          ) : null}
          {article.canonicalUrl ? (
            <p className="mt-6 text-sm text-[color:var(--foreground)]/60">
              Originally published at{' '}
              <a
                href={article.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer canonical"
                className="text-[color:var(--accent-readable)] underline underline-offset-4"
              >
                the original source
              </a>
              .
            </p>
          ) : null}
        </header>

        <MarkdownBody content={article.body} />
      </article>

      <p className="mt-16 border-t border-[color:var(--foreground)]/10 pt-8">
        <Link
          href="/articles"
          className="text-sm font-medium text-[color:var(--accent-readable)] underline underline-offset-4 decoration-[color:var(--accent)]/40 hover:decoration-[color:var(--accent)]"
        >
          ← All articles
        </Link>
      </p>
    </main>
  )
}
