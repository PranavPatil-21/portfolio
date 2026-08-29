import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Article } from '@/content'

const state = {
  native: [] as Article[],
  imported: [] as Article[],
  mediumImport: true,
}

vi.mock('@/content', () => ({
  getNativeArticles: () => state.native,
  getSettings: () => ({
    features: { mediumImport: state.mediumImport, mediumHandle: 'someone' },
  }),
}))

vi.mock('@/lib/medium', () => ({
  fetchMediumArticles: async () => state.imported,
}))

import { getAllArticles } from '../articles'

function article(over: Partial<Article>): Article {
  return {
    slug: 'x', title: 'X', excerpt: '', body: '', tags: [], date: '2026-01-01',
    draft: false, source: 'native', hasFullText: true, ...over,
  } as Article
}

beforeEach(() => {
  state.native = []
  state.imported = []
  state.mediumImport = true
})

describe('getAllArticles de-duplication', () => {
  it('keeps an imported post that has no local counterpart', async () => {
    state.imported = [article({ slug: 'a-post-484e80', title: 'A Post', source: 'medium' })]
    expect(await getAllArticles()).toHaveLength(1)
  })

  it('drops an import whose title matches a local article, despite different slugs', async () => {
    /*
     * The real case. Medium appends a post id to its slug, so the two slugs
     * never collide — matching on slug alone would show the article twice.
     */
    state.native = [article({ slug: 'a-post', title: 'A Post' })]
    state.imported = [article({ slug: 'a-post-484e80', title: 'A Post', source: 'medium' })]
    const all = await getAllArticles()
    expect(all).toHaveLength(1)
    expect(all[0].source).toBe('native')
  })

  it('matches titles across casing, smart quotes and punctuation', async () => {
    state.native = [article({ slug: 'teammate', title: 'I Taught It To Say "I Don\'t Know"' })]
    state.imported = [
      article({ slug: 'teammate-99', title: 'I taught it to say “I don’t know”', source: 'medium' }),
    ]
    expect(await getAllArticles()).toHaveLength(1)
  })

  it('drops an import when a local article names it as its canonical URL', async () => {
    state.native = [
      article({ slug: 'own', title: 'Different Headline', canonicalUrl: 'https://medium.com/@me/p-1' }),
    ]
    state.imported = [
      article({ slug: 'p-1', title: 'Original Headline', source: 'medium', canonicalUrl: 'https://www.medium.com/@me/p-1/?source=rss' }),
    ]
    expect(await getAllArticles()).toHaveLength(1)
  })

  it('returns only local articles when the importer is off', async () => {
    state.mediumImport = false
    state.native = [article({ slug: 'own', title: 'Mine' })]
    state.imported = [article({ slug: 'other', title: 'Theirs', source: 'medium' })]
    expect(await getAllArticles()).toHaveLength(1)
  })

  it('sorts newest first across both sources', async () => {
    state.native = [article({ slug: 'old', title: 'Old', date: '2025-01-01' })]
    state.imported = [article({ slug: 'new', title: 'New', date: '2026-06-01', source: 'medium' })]
    expect((await getAllArticles()).map((a) => a.slug)).toEqual(['new', 'old'])
  })
})
