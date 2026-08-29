import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { articleSchema } from '@/content/schemas'
import { fetchMediumArticles } from '../medium'

const FIXTURES = path.join(process.cwd(), 'src/lib/__tests__/fixtures')

function fixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES, `${name}.xml`), 'utf8')
}

/** Mock `fetch` with a successful XML response. */
function mockFeed(xml: string) {
  const f = vi.fn(async () => new Response(xml, { status: 200 }))
  vi.stubGlobal('fetch', f)
  return f
}

let warn: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchMediumArticles — request', () => {
  it('fetches the handle feed with a 5s abort signal', async () => {
    const f = mockFeed(fixture('medium-empty'))
    await fetchMediumArticles('pranav')

    expect(f).toHaveBeenCalledTimes(1)
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://medium.com/feed/@pranav')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('tolerates a handle written with a leading @', async () => {
    const f = mockFeed(fixture('medium-empty'))
    await fetchMediumArticles('@pranav')

    const [url] = f.mock.calls[0] as unknown as [string]
    expect(url).toBe('https://medium.com/feed/@pranav')
  })
})

describe('fetchMediumArticles — full-text posts', () => {
  it('returns every item in the feed', async () => {
    mockFeed(fixture('medium-full'))
    const articles = await fetchMediumArticles('pranav')
    expect(articles).toHaveLength(2)
  })

  it('marks a post with <content:encoded> as full text and renders its body', async () => {
    mockFeed(fixture('medium-full'))
    const [first] = await fetchMediumArticles('pranav')

    expect(first.hasFullText).toBe(true)
    expect(first.body).toContain('<h2>The problem</h2>')
    expect(first.body).toContain('<strong>inevitable</strong>')
    expect(first.body).toContain('<a href="https://example.com/spec">the spec</a>')
  })

  it('normalises metadata: slug, date, tags, excerpt, title', async () => {
    mockFeed(fixture('medium-full'))
    const [first, second] = await fetchMediumArticles('pranav')

    expect(first.title).toBe('Designing Idempotent Payment APIs')
    expect(first.slug).toBe('designing-idempotent-payment-apis-9f1c2d3e4b5a')
    expect(first.date).toBe('2026-08-15')
    expect(first.tags).toEqual(['payments', 'api-design'])
    expect(first.excerpt).toBe('Why every money-moving POST needs a key.')

    // Single <category> parses to a scalar, not an array — must still normalise.
    expect(second.tags).toEqual(['kafka'])
    expect(second.date).toBe('2026-07-01')
  })

  it('sets source and canonicalUrl to the Medium permalink on every article', async () => {
    mockFeed(fixture('medium-full'))
    const articles = await fetchMediumArticles('pranav')

    for (const a of articles) {
      expect(a.source).toBe('medium')
      expect(a.canonicalUrl).toMatch(/^https:\/\/medium\.com\/@pranav\//)
      // The rss tracking query string is not part of the permalink.
      expect(a.canonicalUrl).not.toContain('?source=')
    }
    expect(articles[0].canonicalUrl).toBe(
      'https://medium.com/@pranav/designing-idempotent-payment-apis-9f1c2d3e4b5a',
    )
  })

  it('leaves externalUrl unset when the post renders on-site', async () => {
    mockFeed(fixture('medium-full'))
    const articles = await fetchMediumArticles('pranav')
    for (const a of articles) expect(a.externalUrl).toBeUndefined()
  })

  it('does not mistake a mid-body "continue reading" cross-link for a paywall', async () => {
    mockFeed(`<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0"><channel><title>t</title>
<item><title>Long Read</title>
<link>https://medium.com/@pranav/long-read-000000000004</link>
<pubDate>Thu, 02 Jan 2026 00:00:00 GMT</pubDate>
<content:encoded><![CDATA[<p>Before you continue reading, see <a href="https://medium.com/@pranav/other-post-000000000009">my earlier post</a>.</p>
<h2>The actual article</h2>
<p>This is the <strong>full body</strong> and must survive intact.</p>]]></content:encoded>
</item></channel></rss>`)

    const [a] = await fetchMediumArticles('pranav')
    expect(a.hasFullText).toBe(true)
    expect(a.body).toContain('<strong>full body</strong>')
  })

  it('produces objects that satisfy the frozen articleSchema', async () => {
    mockFeed(fixture('medium-full'))
    const articles = await fetchMediumArticles('pranav')

    for (const a of articles) {
      expect(articleSchema.safeParse(a).success).toBe(true)
    }
  })
})

describe('fetchMediumArticles — member-only posts', () => {
  it('treats a "Continue reading" abstract as paywalled', async () => {
    mockFeed(fixture('medium-abstract'))
    const articles = await fetchMediumArticles('pranav')

    expect(articles).toHaveLength(1)
    const [a] = articles
    expect(a.hasFullText).toBe(false)
    expect(a.body).toBe('')
    expect(a.externalUrl).toBe(
      'https://medium.com/@pranav/member-only-scaling-ledgers-abcdef123456',
    )
    expect(a.canonicalUrl).toBe(a.externalUrl)
    expect(a.excerpt).toBe('A double-entry ledger is the only sane way to count money.')
  })

  it('treats a missing <content:encoded> as paywalled', async () => {
    mockFeed(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>t</title>
<item><title>No Content Element</title>
<link>https://medium.com/@pranav/no-content-element-0f0f0f0f0f0f</link>
<pubDate>Thu, 02 Jan 2026 00:00:00 GMT</pubDate>
<description>Just a teaser.</description>
</item></channel></rss>`)

    const [a] = await fetchMediumArticles('pranav')
    expect(a.hasFullText).toBe(false)
    expect(a.body).toBe('')
    expect(a.externalUrl).toBe('https://medium.com/@pranav/no-content-element-0f0f0f0f0f0f')
  })

  it('treats content that sanitises away to nothing as paywalled', async () => {
    mockFeed(`<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0"><channel><title>t</title>
<item><title>All Script</title>
<link>https://medium.com/@pranav/all-script-000000000005</link>
<pubDate>Thu, 02 Jan 2026 00:00:00 GMT</pubDate>
<content:encoded><![CDATA[<script>alert(1)</script>]]></content:encoded>
</item></channel></rss>`)

    const [a] = await fetchMediumArticles('pranav')
    expect(a.hasFullText).toBe(false)
    expect(a.body).toBe('')
    expect(a.externalUrl).toBe('https://medium.com/@pranav/all-script-000000000005')
  })
})

describe('fetchMediumArticles — degradation (never throws)', () => {
  it('returns [] for an empty feed', async () => {
    mockFeed(fixture('medium-empty'))
    await expect(fetchMediumArticles('pranav')).resolves.toEqual([])
  })

  it('returns [] and warns on malformed XML', async () => {
    mockFeed(fixture('medium-malformed'))
    await expect(fetchMediumArticles('pranav')).resolves.toEqual([])
    expect(warn).toHaveBeenCalled()
  })

  it('returns [] and warns on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed')
      }),
    )
    await expect(fetchMediumArticles('pranav')).resolves.toEqual([])
    expect(warn).toHaveBeenCalled()
  })

  it('returns [] and warns on an aborted (timed out) request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new DOMException('The operation was aborted.', 'AbortError')
      }),
    )
    await expect(fetchMediumArticles('pranav')).resolves.toEqual([])
    expect(warn).toHaveBeenCalled()
  })

  it('returns [] and warns on a non-200 response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })))
    await expect(fetchMediumArticles('pranav')).resolves.toEqual([])
    expect(warn).toHaveBeenCalled()
  })

  it('returns [] and warns when the body cannot be read', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () => {
          throw new Error('stream broke')
        },
      })),
    )
    await expect(fetchMediumArticles('pranav')).resolves.toEqual([])
    expect(warn).toHaveBeenCalled()
  })

  it('returns [] and warns when the document is valid XML but not an RSS feed', async () => {
    mockFeed('<?xml version="1.0"?><html><body>login required</body></html>')
    await expect(fetchMediumArticles('pranav')).resolves.toEqual([])
    expect(warn).toHaveBeenCalled()
  })

  it('drops an item that fails the schema and keeps its siblings', async () => {
    mockFeed(`<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0"><channel><title>t</title>
<item>
<link>https://medium.com/@pranav/untitled-post-000000000001</link>
<pubDate>Thu, 02 Jan 2026 00:00:00 GMT</pubDate>
<content:encoded><![CDATA[<p>No title, so invalid.</p>]]></content:encoded>
</item>
<item>
<title>Perfectly Fine Post</title>
<link>https://medium.com/@pranav/perfectly-fine-post-000000000002</link>
<pubDate>Thu, 02 Jan 2026 00:00:00 GMT</pubDate>
<content:encoded><![CDATA[<p>Body.</p>]]></content:encoded>
</item>
</channel></rss>`)

    const articles = await fetchMediumArticles('pranav')
    expect(articles).toHaveLength(1)
    expect(articles[0].title).toBe('Perfectly Fine Post')
    expect(warn).toHaveBeenCalled()
  })

  it('drops an item whose link yields no usable slug', async () => {
    mockFeed(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>t</title>
<item><title>Bad Link</title><link>not-a-url</link>
<pubDate>Thu, 02 Jan 2026 00:00:00 GMT</pubDate></item>
</channel></rss>`)

    await expect(fetchMediumArticles('pranav')).resolves.toEqual([])
    expect(warn).toHaveBeenCalled()
  })

  it('drops an item with an unparseable pubDate rather than throwing', async () => {
    mockFeed(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>t</title>
<item><title>Bad Date</title>
<link>https://medium.com/@pranav/bad-date-000000000003</link>
<pubDate>whenever, really</pubDate></item>
</channel></rss>`)

    await expect(fetchMediumArticles('pranav')).resolves.toEqual([])
    expect(warn).toHaveBeenCalled()
  })
})

describe('fetchMediumArticles — sanitisation of hostile HTML', () => {
  it('strips script, event handlers, javascript: hrefs, iframes and style expressions', async () => {
    mockFeed(fixture('medium-hostile'))
    const [a] = await fetchMediumArticles('pranav')

    // Positive control: without this, an empty body would pass every check below.
    expect(a.hasFullText).toBe(true)
    expect(a.body).toContain('<strong>bold text</strong>')

    expect(a.body).not.toContain('<script')
    expect(a.body).not.toContain('alert(1)')
    expect(a.body).not.toContain('onerror')
    expect(a.body).not.toContain('alert(2)')
    expect(a.body).not.toContain('javascript:')
    expect(a.body).not.toContain('alert(3)')
    expect(a.body).not.toContain('<iframe')
    expect(a.body).not.toContain('evil.example.com')
    expect(a.body).not.toContain('expression(')
    expect(a.body).not.toContain('style=')
    expect(a.body).not.toMatch(/\son\w+\s*=/i)
  })

  it('strips markup from the excerpt', async () => {
    mockFeed(fixture('medium-hostile'))
    const [a] = await fetchMediumArticles('pranav')

    expect(a.excerpt).toBe('An innocent summary.')
    expect(a.excerpt).not.toContain('<')
  })
})
