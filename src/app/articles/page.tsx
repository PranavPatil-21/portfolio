import type { Metadata } from 'next'
import TopBar from '@/components/TopBar'
import Link from 'next/link'
import { getNativeArticles, getSettings } from '@/content'
import { ArticleCard } from '@/components/sections/Articles'

export function generateMetadata(): Metadata {
  const settings = getSettings()
  return {
    title: `Articles · ${settings.name}`,
    description: `Writing by ${settings.name} on engineering, systems and the things worth building.`,
    alternates: { canonical: '/articles' },
  }
}

export default function ArticlesPage() {
  const articles = getNativeArticles()

  return (
    <>
      <TopBar settings={getSettings()} variant="sub" />
      {/* Same container and type scale as /work — the two sub-pages are peers
          and reading like different sites is what made them feel unfinished. */}
      <main className="mx-auto w-full max-w-3xl px-6 pt-10 pb-24">
      <header className="mb-12 max-w-2xl">
        <p className="eyebrow">Writing</p>
        <h1 className="display mt-4 text-balance text-[var(--foreground)]">Notes</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-pretty text-[var(--muted)]">
          On the things I build — architecture, trade-offs, and the occasional
          detour.
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="text-[var(--muted)]">
          Nothing published yet. Check back soon.
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {articles.map((article) => (
            <li key={article.slug} className="h-full">
              <ArticleCard article={article} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-16 border-t border-[var(--hairline)] pt-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm text-[var(--accent-readable)] transition-colors duration-200 motion-reduce:transition-none"
        >
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none"
          >
            ←
          </span>
          Back home
        </Link>
      </p>
    </main>
    </>
  )
}
