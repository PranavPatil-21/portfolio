import { XMLParser, XMLValidator } from 'fast-xml-parser'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { articleSchema, type Article } from '@/content/schemas'

/**
 * Medium RSS importer.
 *
 * Medium's feed carries the ten most recent posts and, for member-only pieces,
 * only an abstract terminated by a "Continue reading on Medium" link. Those are
 * surfaced as external cards rather than rendered on-site.
 *
 * Everything here is best-effort: the feed is a third-party dependency on the
 * build's critical path, so `fetchMediumArticles` never throws and never fails
 * a build. A bad feed logs a warning and yields `[]`; a single bad item is
 * dropped and its siblings are kept.
 *
 * SECURITY: `<content:encoded>` is attacker-controllable HTML that would be
 * rendered on our own origin — a stored-XSS vector. It is sanitised
 * server-side against rehype-sanitize's default GitHub allowlist before it
 * ever reaches a component. Never bypass `sanitiseHtml` below.
 */

const FEED_BASE = 'https://medium.com/feed/@'
const TIMEOUT_MS = 5000

/**
 * Medium terminates a member-only abstract with a trailing anchor back to the
 * post itself: `<a href="…medium.com/@me/slug">Continue reading on Medium »</a>`.
 */
const TRUNCATION_MARKER =
  /<a\b[^>]*href\s*=\s*["'][^"']*medium\.com[^"']*["'][^>]*>\s*continue reading[^<]*<\/a>\s*(?:<\/[a-z]+>\s*)*$/i

/**
 * True only when the document *ends* with Medium's own "Continue reading"
 * anchor. Deliberately anchored to the tail and to the anchor's own link text:
 * a full-text post may say "continue reading the RFC" in prose and cross-link
 * another Medium article, and misreading that as a paywall would discard a
 * complete body.
 */
function looksTruncated(html: string): boolean {
  return TRUNCATION_MARKER.test(html.trimEnd())
}

const parser = new XMLParser({
  ignoreAttributes: false,
  // Without this a numeric-looking title or date coerces to a number and then
  // fails the schema's string checks.
  parseTagValue: false,
  trimValues: true,
})

/** fast-xml-parser collapses a single repeated element to a scalar. */
function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

/** Unwraps `{ '#text': 'x' }` shapes produced when an element carries attributes. */
function text(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value && typeof value === 'object' && '#text' in value) {
    return text((value as Record<string, unknown>)['#text'])
  }
  return ''
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#3[49];/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Markdown-aware HTML pipeline, sanitised against the default GitHub schema.
 * Mirrors the approach in the article renderer but is deliberately independent
 * of it — this module must be safe on its own terms.
 */
async function sanitiseHtml(html: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(html)
  return String(file).trim()
}

/** Strips Medium's `?source=rss-…` tracking query to leave the bare permalink. */
function permalink(link: string): string | null {
  try {
    const url = new URL(link)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    url.search = ''
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

/** Last path segment of the permalink, reduced to characters safe in a URL path. */
function slugFrom(url: string): string {
  const last = new URL(url).pathname.split('/').filter(Boolean).pop() ?? ''
  return decodeURIComponent(last)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isoDate(pubDate: string): string | null {
  const parsed = new Date(pubDate)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

type FeedItem = Record<string, unknown>

async function toArticle(item: FeedItem): Promise<Article | null> {
  const link = permalink(text(item.link))
  if (!link) {
    console.warn('[medium] skipping item with an unusable link:', text(item.link))
    return null
  }

  const slug = slugFrom(link)
  if (!slug) {
    console.warn(`[medium] skipping item with no derivable slug: ${link}`)
    return null
  }

  const date = isoDate(text(item.pubDate))
  if (!date) {
    console.warn(`[medium] skipping item with an unparseable pubDate: ${link}`)
    return null
  }

  const raw = text(item['content:encoded']).trim()
  // Derived from the sanitised body, not the raw string, so content that is
  // entirely disallowed markup degrades to an external card rather than an
  // empty article page.
  const body = raw === '' || looksTruncated(raw) ? '' : await sanitiseHtml(raw)
  const hasFullText = body !== ''

  const candidate = {
    slug,
    title: stripTags(text(item.title)),
    excerpt: stripTags(text(item.description)),
    body,
    tags: toArray(item.category).map((c) => stripTags(text(c))).filter(Boolean),
    date,
    draft: false,
    source: 'medium' as const,
    canonicalUrl: link,
    // Only paywalled/abstract posts link out; a full-text post renders on-site.
    externalUrl: hasFullText ? undefined : link,
    hasFullText,
  }

  const parsed = articleSchema.safeParse(candidate)
  if (!parsed.success) {
    console.warn(
      `[medium] dropping malformed item ${link}:`,
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    )
    return null
  }
  return parsed.data
}

/**
 * Fetches and normalises a Medium author feed.
 *
 * Never throws. Returns `[]` on a network failure, timeout, non-200 response,
 * malformed XML, a non-RSS document, or an empty feed — logging a warning in
 * each case so the cause is visible in the build log.
 */
export async function fetchMediumArticles(handle: string): Promise<Article[]> {
  try {
    const clean = String(handle ?? '').trim().replace(/^@+/, '')
    if (!clean) {
      console.warn('[medium] no handle supplied; skipping import')
      return []
    }

    const url = `${FEED_BASE}${encodeURIComponent(clean)}`

    let xml: string
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (!res.ok) {
        console.warn(`[medium] feed ${url} returned HTTP ${res.status}; skipping import`)
        return []
      }
      xml = await res.text()
    } catch (error) {
      console.warn(`[medium] could not fetch ${url}; skipping import`, error)
      return []
    }

    // fast-xml-parser is lenient and will happily produce garbage from broken
    // markup, so validate explicitly rather than relying on parse() to throw.
    const validation = XMLValidator.validate(xml)
    if (validation !== true) {
      console.warn(`[medium] feed ${url} is not well-formed XML; skipping import`, validation.err)
      return []
    }

    const doc = parser.parse(xml) as Record<string, unknown>
    const rss = doc?.rss as Record<string, unknown> | undefined
    const channel = rss?.channel as Record<string, unknown> | undefined
    if (!channel) {
      console.warn(`[medium] feed ${url} is not an RSS document; skipping import`)
      return []
    }

    const items = toArray(channel.item as FeedItem | FeedItem[] | undefined)
    if (items.length === 0) return []

    const articles: Article[] = []
    for (const item of items) {
      try {
        const article = await toArticle(item)
        if (article) articles.push(article)
      } catch (error) {
        // One bad item must never cost us the rest of the feed.
        console.warn('[medium] failed to normalise a feed item; skipping it', error)
      }
    }
    return articles
  } catch (error) {
    console.warn('[medium] import failed unexpectedly; continuing without Medium articles', error)
    return []
  }
}
