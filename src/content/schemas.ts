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
const dateish = z.preprocess((v) => {
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  // A `datetime` widget with picker_utc emits a full ISO timestamp
  // ("2026-08-29T00:00:00.000Z"). Keep the date half.
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10)
  return v
}, z.string().regex(/^\d{4}(-\d{2})?(-\d{2})?$/, 'use YYYY, YYYY-MM or YYYY-MM-DD'))

/**
 * A sort-order field as a CMS actually writes it.
 *
 * A cleared `number` widget emits `''` or `null`, and a populated one can emit
 * a numeric *string*. Plain `z.number().default(0)` rejects all three, so
 * clearing the order box would fail the build.
 */
const orderField = z.preprocess((v) => {
  if (v === '' || v === null || v === undefined) return 0
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  return v
}, z.number())

/**
 * A list of non-empty strings, tolerant of how a `list` widget behaves.
 *
 * Adding a row and leaving it blank emits `''`. Requiring `.min(1)` on the
 * element would then fail the build for a stray empty row — a mistake that is
 * one keystroke away and invisible in the editor. Drop blanks instead.
 */
function stringList() {
  return z.preprocess(
    (v) =>
      Array.isArray(v)
        ? v.filter((item) => typeof item !== 'string' || item.trim() !== '')
        : v,
    z.array(z.string().min(1)).default([]),
  )
}

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
  roles: stringList().pipe(z.array(z.string().min(1)).min(1, 'add at least one role')),
  /**
   * The positioning sentence — the largest, most important text on the site.
   * Separate from `bio` so the owner can edit the claim itself from `/admin`
   * rather than it living as a constant in a component. Supports *asterisk*
   * emphasis, which renders in the accent colour.
   */
  headline: optionalish(z.string()),
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
    defaultMode: z.enum(['light', 'dark', 'system']).default('system'),
    /*
     * The light palette needs its own three values rather than being derived.
     * An accent chosen to glow on near-black almost never clears 4.5:1 as text
     * on white — this site's orange scores 8.54 on the dark ground and 2.22 on
     * the light one. Inverting a palette is a design decision, not arithmetic.
     */
    light: z
      .object({
        accent: hexColour,
        background: hexColour,
        foreground: hexColour,
      })
      .optional(),
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
  bullets: stringList(),
  tech: stringList(),
  logo: optionalish(z.string()),
  order: orderField,
  body: z.string().default(''),
})

/**
 * A headline impact figure — "800K+" / "monthly events processed".
 *
 * `value` is a free string rather than a number because the interesting part is
 * usually the notation: `99%`, `800K+`, `<1%`, `3s → 1s`. The counter parses
 * the digits out of it and animates those, preserving whatever surrounds them.
 */
export const metricSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
})

export const metricsSchema = z.object({
  items: z.array(metricSchema).default([]),
})

/**
 * A piece of work, told as a case study.
 *
 * The structured fields exist because a recruiter for a product role reads for
 * a specific shape — what was broken, what you decided, what changed — and a
 * free-text blob makes them hunt for it. Each is optional so a lightweight
 * entry stays lightweight.
 */
export const projectSchema = z.object({
  slug: z.string().default(''),
  title: z.string().min(1),
  summary: z.string().min(1),
  body: z.string().default(''),
  tech: stringList(),
  repo: optionalish(z.string().url()),
  demo: optionalish(z.string().url()),
  cover: optionalish(z.string()),
  coverAlt: optionalish(z.string()),
  featured: z.boolean().default(false),
  date: dateish,
  order: orderField,

  /** Drives the case-study filter. */
  category: z.enum(['ai', 'systems', 'product']).default('systems'),
  /** What he actually did on it — important when the work was in a team. */
  role: optionalish(z.string()),
  context: optionalish(z.string()),

  problem: optionalish(z.string()),
  approach: optionalish(z.string()),
  decision: optionalish(z.string()),
  outcome: optionalish(z.string()),

  /** Headline figures for this piece of work specifically. */
  metrics: z.array(metricSchema).default([]),
  /**
   * Nodes of a system diagram, in order — e.g. ["API", "Kafka", "Processor"].
   * Rendered as an animated flow. A list of strings rather than a graph so it
   * stays editable in a CMS by someone who is not drawing boxes.
   */
  flow: stringList(),
})

export const articleSchema = z.object({
  slug: z.string().default(''),
  title: z.string().min(1),
  excerpt: z.string().default(''),
  body: z.string().default(''),
  cover: optionalish(z.string()),
  coverAlt: optionalish(z.string()),
  tags: stringList(),
  date: dateish,
  draft: z.boolean().default(false),
  source: z.enum(['native', 'medium']).default('native'),
  canonicalUrl: optionalish(z.string().url()),
  externalUrl: optionalish(z.string().url()),
  hasFullText: z.boolean().default(true),
})

export const skillGroupSchema = z.object({
  label: z.string().min(1),
  items: stringList(),
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
  details: stringList(),
  order: orderField,
  body: z.string().default(''),
})

export const responsibilitySchema = z.object({
  slug: z.string().default(''),
  role: z.string().min(1),
  organisation: z.string().min(1),
  location: z.string().default(''),
  start: dateish,
  end: optionalish(dateish),
  bullets: stringList(),
  order: orderField,
  body: z.string().default(''),
})

export const customItemSchema = z.object({
  title: z.string().min(1),
  subtitle: optionalish(z.string()),
  date: optionalish(z.string()),
  description: optionalish(z.string()),
  image: optionalish(z.string()),
  imageAlt: optionalish(z.string()),
  tags: stringList(),
  links: z.array(linkSchema).default([]),
})

export const customSectionSchema = z.object({
  slug: z.string().default(''),
  title: z.string().min(1),
  layout: z.enum(['cards', 'timeline', 'list', 'logo-grid']).default('cards'),
  items: z.array(customItemSchema).default([]),
  order: orderField,
  body: z.string().default(''),
})


/**
 * A system, described the way it would be defended in an interview.
 *
 * Each node answers the four questions that separate someone who built a system
 * from someone who can only name its parts: what it does, why it exists at all,
 * what was traded away to get it, and what breaks without it.
 */
export const architectureNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(['entry', 'stream', 'service', 'store', 'external']).default('service'),
  does: z.string().min(1),
  why: z.string().min(1),
  tradeoff: optionalish(z.string()),
  failure: optionalish(z.string()),
  scale: optionalish(z.string()),
})

export const architectureEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: optionalish(z.string()),
})

/**
 * A path through the system for one real situation.
 *
 * The map alone shows what exists; a journey shows what *happens* — and the
 * product decision taken at each hop. This is the difference between naming
 * components and demonstrating you understand the product they serve.
 */
export const journeyStepSchema = z.object({
  node: z.string().min(1),
  what: z.string().min(1),
  decision: optionalish(z.string()),
})

export const journeySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  summary: optionalish(z.string()),
  steps: z.array(journeyStepSchema).default([]),
})

export const architectureSchema = z.object({
  enabled: z.boolean().default(false),
  title: z.string().default(''),
  intro: z.string().default(''),
  nodes: z.array(architectureNodeSchema).default([]),
  edges: z.array(architectureEdgeSchema).default([]),
  journeys: z.array(journeySchema).default([]),
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
export type Metric = z.infer<typeof metricSchema>
export type ArchitectureNode = z.infer<typeof architectureNodeSchema>
export type ArchitectureEdge = z.infer<typeof architectureEdgeSchema>
export type JourneyStep = z.infer<typeof journeyStepSchema>
export type Journey = z.infer<typeof journeySchema>
export type Architecture = z.infer<typeof architectureSchema>
export type LayoutEntry = z.infer<typeof layoutEntrySchema>
export type Link = z.infer<typeof linkSchema>
