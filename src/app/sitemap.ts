import type { MetadataRoute } from 'next'
import { getNativeArticles } from '@/content'

/**
 * The absolute origin the site is served from. Read from the environment so the
 * domain is never hardcoded — set `NEXT_PUBLIC_SITE_URL` in Vercel once.
 */
function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'http://localhost:3000'
  )
}

/**
 * `date` is validated as `YYYY`, `YYYY-MM` or `YYYY-MM-DD`, which is not quite
 * enough to guarantee a real calendar date (`2023-13` passes the regex). An
 * unparseable date drops `lastModified` rather than failing the whole sitemap.
 */
function lastModified(date: string): Date | undefined {
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  const articles = getNativeArticles()

  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/articles`, changeFrequency: 'weekly', priority: 0.8 },
    ...articles.map((a) => ({
      url: `${base}/articles/${a.slug}`,
      lastModified: lastModified(a.date),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ]
}
