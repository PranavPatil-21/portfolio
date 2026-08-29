import { describe, it, expect } from 'vitest'
import {
  settingsSchema, experienceSchema, projectSchema, articleSchema, customSectionSchema,
} from '../schemas'

/**
 * Pins the shapes a CMS actually *writes*, as opposed to the shapes we hoped it
 * would write.
 *
 * Every other content test runs in the read direction — files we authored parse
 * correctly. That direction can be perfectly green while the first real edit
 * from `/admin` still fails the build, because a browser form serialises
 * cleared and blank inputs in ways hand-written YAML never does.
 */

const baseSettings = {
  name: 'Pranav Patil', roles: ['Software Engineer'], bio: 'hi',
  email: 'a@b.com', socials: [],
  theme: { accent: '#6d4aff', background: '#08080c', foreground: '#f4f4f7', defaultMode: 'dark' },
  seo: { title: 'T', description: 'D' },
  features: { hero3d: true, mediumImport: false },
}

describe('datetime widget output', () => {
  it('accepts a full ISO timestamp from a picker_utc datetime field', () => {
    const r = experienceSchema.safeParse({
      role: 'SWE', company: 'Wio', start: '2024-09-01T00:00:00.000Z',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.start).toBe('2024-09-01')
  })

  it('still accepts the coarse forms a human types', () => {
    for (const start of ['2024', '2024-09', '2024-09-01']) {
      expect(experienceSchema.safeParse({ role: 'a', company: 'b', start }).success).toBe(true)
    }
  })

  it('still rejects genuine nonsense', () => {
    expect(
      experienceSchema.safeParse({ role: 'a', company: 'b', start: 'last September' }).success,
    ).toBe(false)
  })
})

describe('number widget output', () => {
  it.each([['cleared to empty string', ''], ['cleared to null', null], ['absent', undefined]])(
    'treats an order field %s as 0',
    (_label, order) => {
      const r = projectSchema.safeParse({ title: 'X', summary: 'Y', date: '2024-01', order })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.order).toBe(0)
    },
  )

  it('coerces a numeric string to a number', () => {
    const r = projectSchema.safeParse({ title: 'X', summary: 'Y', date: '2024-01', order: '3' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.order).toBe(3)
  })
})

describe('list widget output', () => {
  it('drops a blank row left behind in a list', () => {
    const r = experienceSchema.safeParse({
      role: 'SWE', company: 'Wio', start: '2024-09',
      bullets: ['shipped a thing', '', '   '], tech: [''],
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.bullets).toEqual(['shipped a thing'])
      expect(r.data.tech).toEqual([])
    }
  })

  it('drops blank tag rows on an article', () => {
    const r = articleSchema.safeParse({ title: 'T', date: '2026-01-01', tags: ['ai', ''] })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.tags).toEqual(['ai'])
  })

  it('still requires at least one real role after blanks are dropped', () => {
    expect(settingsSchema.safeParse({ ...baseSettings, roles: ['Engineer', ''] }).success).toBe(true)
    const empty = settingsSchema.safeParse({ ...baseSettings, roles: ['', '  '] })
    expect(empty.success).toBe(false)
    if (!empty.success) expect(JSON.stringify(empty.error.issues)).toContain('at least one role')
  })
})

describe('a realistic first edit from /admin', () => {
  it('parses an entry saved with every optional field left untouched', () => {
    const r = customSectionSchema.safeParse({
      title: 'Talks', layout: 'cards', order: '',
      items: [{ title: 'A talk', subtitle: '', date: '', description: '', image: '', imageAlt: '', tags: [''], links: [] }],
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.order).toBe(0)
      expect(r.data.items[0].subtitle).toBeUndefined()
      expect(r.data.items[0].tags).toEqual([])
    }
  })
})
