import { z } from 'zod'

/**
 * Single source of truth for the shape of everything under `content/`.
 *
 * `public/admin/config.yml` must mirror these field-for-field: a CMS field this
 * file rejects produces a failed build, which is the intended safety net but a
 * poor editing experience. Keep them in step.
 */

const hexColour = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'must be a 6-digit hex colour like #6c5ce7')

/**
 * Accepts YYYY, YYYY-MM or YYYY-MM-DD so the CMS can stay coarse where it wants to.
 *
 * YAML frontmatter silently parses an unquoted `2026-08-29` into a JS `Date`,
 * while `2026-08` stays a string. The CMS writes full dates, so normalise Date
 * back to `YYYY-MM-DD` before validating rather than making every editor
 * remember to quote the field.
 */
const dateish = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{4}(-\d{2})?(-\d{2})?$/, 'use YYYY, YYYY-MM or YYYY-MM-DD'),
)

/**
 * Makes a field optional in the way a *CMS* means it.
 *
 * Zod's `.optional()` accepts an absent key, but a browser form clears a field
 * to `""`, not to nothing. Without this, clearing an end date or deleting a
 * repo URL in `/admin` publishes `end: ''`, which fails validation and breaks
 * the build — a trap laid precisely where the owner is most likely to step.
 */
function optionalish<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((v) => (v === '' ? undefined : v), schema.optional())
}

const linkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
})

export const socialSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  icon: z.string().min(1),
})

export const settingsSchema = z.object({
  name: z.string().min(1),
  roles: z.array(z.string().min(1)).min(1),
  bio: z.string().min(1),
  location: z.string().default(''),
  email: z.string().email(),
  phone: optionalish(z.string()),
  avatar: optionalish(z.string()),
  avatarAlt: optionalish(z.string()),
  resumePdf: optionalish(z.string()),
  socials: z.array(socialSchema).default([]),
  theme: z.object({
    accent: hexColour,
    background: hexColour,
    foreground: hexColour,
    defaultMode: z.enum(['light', 'dark', 'system']).default('dark'),
  }),
  seo: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    ogImage: optionalish(z.string()),
  }),
  features: z.object({
    hero3d: z.boolean().default(true),
    mediumImport: z.boolean().default(false),
    mediumHandle: optionalish(z.string()),
  }),
})

export const experienceSchema = z.object({
  slug: z.string().default(''),
  role: z.string().min(1),
  company: z.string().min(1),
  location: z.string().default(''),
  start: dateish,
  end: optionalish(dateish),
  current: z.boolean().default(false),
  bullets: z.array(z.string().min(1)).default([]),
  tech: z.array(z.string().min(1)).default([]),
  logo: optionalish(z.string()),
  order: z.number().default(0),
  body: z.string().default(''),
})

export const projectSchema = z.object({
  slug: z.string().default(''),
  title: z.string().min(1),
  summary: z.string().min(1),
  body: z.string().default(''),
  tech: z.array(z.string().min(1)).default([]),
  repo: optionalish(z.string().url()),
  demo: optionalish(z.string().url()),
  cover: optionalish(z.string()),
  coverAlt: optionalish(z.string()),
  featured: z.boolean().default(false),
  date: dateish,
  order: z.number().default(0),
})

export const articleSchema = z.object({
  slug: z.string().default(''),
  title: z.string().min(1),
  excerpt: z.string().default(''),
  body: z.string().default(''),
  cover: optionalish(z.string()),
  coverAlt: optionalish(z.string()),
  tags: z.array(z.string().min(1)).default([]),
  date: dateish,
  draft: z.boolean().default(false),
  source: z.enum(['native', 'medium']).default('native'),
  canonicalUrl: optionalish(z.string().url()),
  externalUrl: optionalish(z.string().url()),
  hasFullText: z.boolean().default(true),
})

export const skillGroupSchema = z.object({
  label: z.string().min(1),
  items: z.array(z.string().min(1)).default([]),
})

export const skillsSchema = z.object({
  groups: z.array(skillGroupSchema).default([]),
})

export const educationSchema = z.object({
  slug: z.string().default(''),
  institution: z.string().min(1),
  degree: z.string().min(1),
  location: z.string().default(''),
  start: dateish,
  end: optionalish(dateish),
  details: z.array(z.string().min(1)).default([]),
  order: z.number().default(0),
  body: z.string().default(''),
})

export const responsibilitySchema = z.object({
  slug: z.string().default(''),
  role: z.string().min(1),
  organisation: z.string().min(1),
  location: z.string().default(''),
  start: dateish,
  end: optionalish(dateish),
  bullets: z.array(z.string().min(1)).default([]),
  order: z.number().default(0),
  body: z.string().default(''),
})

export const customItemSchema = z.object({
  title: z.string().min(1),
  subtitle: optionalish(z.string()),
  date: optionalish(z.string()),
  description: optionalish(z.string()),
  image: optionalish(z.string()),
  imageAlt: optionalish(z.string()),
  tags: z.array(z.string().min(1)).default([]),
  links: z.array(linkSchema).default([]),
})

export const customSectionSchema = z.object({
  slug: z.string().default(''),
  title: z.string().min(1),
  layout: z.enum(['cards', 'timeline', 'list', 'logo-grid']).default('cards'),
  items: z.array(customItemSchema).default([]),
  order: z.number().default(0),
  body: z.string().default(''),
})

export const layoutEntrySchema = z.object({
  sectionId: z.string().min(1),
  visible: z.boolean().default(true),
})

export const layoutSchema = z.object({
  sections: z.array(layoutEntrySchema).default([]),
})

export type Social = z.infer<typeof socialSchema>
export type Settings = z.infer<typeof settingsSchema>
export type Experience = z.infer<typeof experienceSchema>
export type Project = z.infer<typeof projectSchema>
export type Article = z.infer<typeof articleSchema>
export type SkillGroup = z.infer<typeof skillGroupSchema>
export type Education = z.infer<typeof educationSchema>
export type Responsibility = z.infer<typeof responsibilitySchema>
export type CustomItem = z.infer<typeof customItemSchema>
export type CustomSection = z.infer<typeof customSectionSchema>
export type LayoutEntry = z.infer<typeof layoutEntrySchema>
export type Link = z.infer<typeof linkSchema>
