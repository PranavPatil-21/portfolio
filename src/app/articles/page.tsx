import type { Metadata } from 'next'
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
    <main className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
      <header className="mb-12 max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--foreground)] text-balance sm:text-5xl">
          Writing
        </h1>
        <p className="mt-4 text-lg leading-8 text-[color:var(--foreground)]/70 text-pretty">
          Notes on the things I build — architecture, trade-offs, and the occasional
          detour.
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="text-[color:var(--foreground)]/70">
          Nothing published yet. Check back soon.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <li key={article.slug} className="h-full">
              <ArticleCard article={article} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-14">
        <Link
          href="/"
          className="text-sm font-medium text-[color:var(--accent-readable)] underline underline-offset-4 decoration-[color:var(--accent)]/40 hover:decoration-[color:var(--accent)]"
        >
          ← Back home
        </Link>
      </p>
    </main>
  )
}
