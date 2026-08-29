import { describe, it, expect } from 'vitest'
import {
  getSettings, getExperience, getProjects, getSkills,
  getEducation, getResponsibilities, getCustomSections,
  getLayout, getNativeArticles,
} from '../index'

/**
 * Validates the actual `content/` tree. This is the build gate: if the owner
 * publishes a bad edit from the CMS, this fails and the previous deploy stays
 * live rather than a broken one shipping.
 */
describe('real content validates', () => {
  it('loads every collection without throwing', () => {
    expect(() => {
      getSettings(); getExperience(); getProjects(); getSkills()
      getEducation(); getResponsibilities(); getCustomSections()
      getLayout(); getNativeArticles()
    }).not.toThrow()
  })

  it('has the owner identity populated', () => {
    const s = getSettings()
    expect(s.name).toBeTruthy()
    expect(s.roles.length).toBeGreaterThan(0)
    expect(s.socials.length).toBeGreaterThan(0)
  })

  it('sorts experience by order', () => {
    const e = getExperience()
    expect(e.length).toBeGreaterThan(0)
    expect(e.map((x) => x.order)).toEqual([...e.map((x) => x.order)].sort((a, b) => a - b))
  })

  it('excludes drafts from articles', () => {
    expect(getNativeArticles().every((a) => !a.draft)).toBe(true)
  })

  it('references only known section ids in layout', () => {
    const known = new Set(['hero','current','metrics','replay','experience','projects','skills','articles','education','responsibilities','contact'])
    const custom = new Set(getCustomSections().map((s) => `custom:${s.slug}`))
    for (const entry of getLayout()) {
      expect(known.has(entry.sectionId) || custom.has(entry.sectionId)).toBe(true)
    }
  })
})
