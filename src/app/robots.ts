import type { MetadataRoute } from 'next'
import { siteUrl } from './sitemap'

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
