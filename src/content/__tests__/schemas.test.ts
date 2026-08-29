import { describe, it, expect } from 'vitest'
import {
  settingsSchema,
  experienceSchema,
  articleSchema,
  customSectionSchema,
} from '../schemas'

const validSettings = {
  name: 'Pranav Patil',
  roles: ['Software Engineer'],
  bio: 'Backend engineer.',
  location: 'India',
  email: 'a@b.com',
  socials: [],
  theme: {
    accent: '#6c5ce7',
    background: '#0b0b12',
    foreground: '#f5f5f7',
    defaultMode: 'dark',
  },
  seo: { title: 'Pranav Patil', description: 'Portfolio' },
  features: { hero3d: true, mediumImport: false },
}

describe('settingsSchema', () => {
  it('accepts a complete settings object', () => {
    expect(settingsSchema.safeParse(validSettings).success).toBe(true)
  })

  it('rejects a missing required field and names it', () => {
    const r = settingsSchema.safeParse({ ...validSettings, email: undefined })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(JSON.stringify(r.error.issues)).toContain('email')
    }
  })

  it('rejects a non-hex accent colour', () => {
    const r = settingsSchema.safeParse({
      ...validSettings,
      theme: { ...validSettings.theme, accent: 'blurple' },
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].message).toContain('hex colour')
    }
  })

  it('requires at least one role', () => {
    expect(
      settingsSchema.safeParse({ ...validSettings, roles: [] }).success,
    ).toBe(false)
  })
})

describe('experienceSchema', () => {
  it('defaults current to false and tech to an empty array', () => {
    const r = experienceSchema.parse({
      role: 'SWE',
      company: 'Wio',
      location: 'Gurugram',
      start: '2024-09',
      bullets: ['did things'],
    })
    expect(r.current).toBe(false)
    expect(r.tech).toEqual([])
  })

  it('rejects a malformed date', () => {
    const r = experienceSchema.safeParse({
      role: 'SWE',
      company: 'Wio',
      start: 'Sept 2024',
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(JSON.stringify(r.error.issues)).toContain('YYYY-MM')
    }
  })

  it('accepts YYYY, YYYY-MM and YYYY-MM-DD', () => {
    for (const start of ['2024', '2024-09', '2024-09-01']) {
      expect(
        experienceSchema.safeParse({ role: 'a', company: 'b', start }).success,
      ).toBe(true)
    }
  })
})

describe('articleSchema', () => {
  it('defaults to a published native article with full text', () => {
    const r = articleSchema.parse({ title: 'Hello', date: '2026-01-01' })
    expect(r.draft).toBe(false)
    expect(r.source).toBe('native')
    expect(r.hasFullText).toBe(true)
  })

  it('rejects a non-URL canonical', () => {
    expect(
      articleSchema.safeParse({
        title: 'Hello',
        date: '2026-01-01',
        canonicalUrl: 'not-a-url',
      }).success,
    ).toBe(false)
  })
})

describe('customSectionSchema', () => {
  it('defaults layout to cards and items to empty', () => {
    const r = customSectionSchema.parse({ title: 'Talks' })
    expect(r.layout).toBe('cards')
    expect(r.items).toEqual([])
  })

  it('rejects an unknown layout', () => {
    expect(
      customSectionSchema.safeParse({ title: 'Talks', layout: 'carousel' })
        .success,
    ).toBe(false)
  })
})
