import { readJson, readCollection, byOrder, byDateDesc } from './loader'
import {
  settingsSchema,
  experienceSchema,
  projectSchema,
  articleSchema,
  skillsSchema,
  educationSchema,
  responsibilitySchema,
  customSectionSchema,
  layoutSchema,
  metricsSchema,
} from './schemas'
import type {
  Settings,
  Experience,
  Project,
  Article,
  SkillGroup,
  Education,
  Responsibility,
  CustomSection,
  LayoutEntry,
  Metric,
} from './schemas'

export * from './schemas'

/**
 * The public content API. Components import from here and nowhere else — this
 * is the single place the filesystem is touched, so a change to how content is
 * stored stays contained to `src/content/`.
 */

export function getSettings(): Settings {
  return readJson('settings.json', settingsSchema)
}

export function getExperience(): Experience[] {
  return byOrder(readCollection('experience', experienceSchema))
}

export function getProjects(): Project[] {
  return byOrder(readCollection('projects', projectSchema))
}

/** Published native articles, newest first. Drafts never reach the site. */
export function getNativeArticles(): Article[] {
  const all = readCollection('articles', articleSchema)
  return byDateDesc(
    all
      .filter((a) => !a.draft)
      .map((a) => ({ ...a, source: 'native' as const, hasFullText: true })),
  )
}

export function getSkills(): SkillGroup[] {
  return readJson('skills.json', skillsSchema).groups
}

export function getEducation(): Education[] {
  return byOrder(readCollection('education', educationSchema))
}

export function getResponsibilities(): Responsibility[] {
  return byOrder(readCollection('responsibilities', responsibilitySchema))
}

export function getCustomSections(): CustomSection[] {
  return byOrder(readCollection('sections', customSectionSchema))
}

/** Headline impact figures. Absent file is valid — the section simply omits. */
export function getMetrics(): Metric[] {
  try {
    return readJson('metrics.json', metricsSchema).items
  } catch {
    return []
  }
}

export function getLayout(): LayoutEntry[] {
  return readJson('layout.json', layoutSchema).sections
}
