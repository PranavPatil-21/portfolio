import { describe, it, expect } from 'vitest'
import { getProjects } from '@/content'
import { generateStaticParams } from '@/app/work/[slug]/page'
import { formatProjectDate } from '@/app/work/date'

/**
 * These run against the real `content/projects/` files, deliberately unmocked.
 *
 * The rest of the suite proves the components behave; this proves the routes
 * still line up with what is actually published. In particular, `/work` groups
 * by a hardcoded list of three categories — a project whose category fell
 * outside that list would vanish from the index while still being emitted into
 * the sitemap, and no fixture-based test can see that.
 */

const CATEGORIES = ['ai', 'systems', 'product']

describe('work routes against real content', () => {
  it('generates a static param for every published case study', async () => {
    const params = await generateStaticParams()
    expect(params).toHaveLength(getProjects().length)
    expect(params.map((p) => p.slug)).toEqual(getProjects().map((p) => p.slug))
    expect(new Set(params.map((p) => p.slug)).size).toBe(params.length)
  })

  it('has every project inside a category the index actually groups', () => {
    const grouped = CATEGORIES.reduce(
      (total, key) => total + getProjects().filter((p) => p.category === key).length,
      0,
    )
    expect(grouped).toBe(getProjects().length)
  })

  it('has a summary on every project — the standfirst renders unconditionally', () => {
    for (const project of getProjects()) {
      expect(project.summary.trim(), project.slug).not.toBe('')
    }
  })

  it('formats every published date into something human', () => {
    for (const project of getProjects()) {
      expect(formatProjectDate(project.date), project.slug).toMatch(/\d{4}/)
    }
  })
})
