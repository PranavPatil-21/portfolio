import type { MetadataRoute } from 'next'

/**
 * The absolute origin the site is served from. Read from the environment so the
 * domain is never hardcoded — set `NEXT_PUBLIC_SITE_URL` in Vercel once.
 *
 * Deliberately duplicated from `sitemap.ts` rather than shared: a route module
 * may only export the symbols Next expects, so neither file can host the helper
 * for the other.
 */
function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'http://localhost:3000'
  )
}

/**
 * Everything on the site is meant to be indexed. `/admin` is excluded by the
 * `noindex` meta tag on its own page rather than a disallow rule here, so the
 * admin path is not advertised in a public file.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl()
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
