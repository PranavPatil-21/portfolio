import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { load as loadYaml } from 'js-yaml'
import { z } from 'zod'
import {
  settingsSchema,
  experienceSchema,
  projectSchema,
  articleSchema,
  educationSchema,
  responsibilitySchema,
  customSectionSchema,
} from '../schemas'

/**
 * Cross-checks `public/admin/config.yml` against the Zod schemas.
 *
 * These two files are the same contract expressed twice, edited by different
 * people at different times. When they drift, the failure is nasty and remote:
 * the admin happily saves a value, the commit lands, and the *build* fails
 * minutes later with an error the owner sees only if they go looking in Vercel.
 *
 * Catching drift here turns that into a failing test at authoring time.
 */

type CmsField = { name: string; widget?: string; required?: boolean; fields?: CmsField[] }
type CmsCollection = {
  name: string
  folder?: string
  fields?: CmsField[]
  files?: { name: string; file: string; fields: CmsField[] }[]
}

const config = loadYaml(
  fs.readFileSync(path.join(process.cwd(), 'public/admin/config.yml'), 'utf8'),
) as { backend: { repo: string; branch: string }; media_folder: string; collections: CmsCollection[] }

const collections = new Map(config.collections.map((c) => [c.name, c]))

/**
 * `slug` is derived from the filename by the loader, so exposing it in the CMS
 * would create a competing source of truth. `body` is different: it is the
 * markdown document body, and exposing it is exactly how the owner writes an
 * article — it just must not be a frontmatter field.
 */
const LOADER_SUPPLIED = new Set(['slug'])

/** Top-level keys a Zod object requires (no default, not optional). */
function requiredKeys(schema: z.ZodObject<z.ZodRawShape>): string[] {
  return Object.entries(schema.shape)
    .filter(([, v]) => !(v as z.ZodTypeAny).safeParse(undefined).success)
    .map(([k]) => k)
}

function fieldNames(fields: CmsField[] = []): Set<string> {
  return new Set(fields.map((f) => f.name))
}

describe('CMS backend configuration', () => {
  it('points at the right repo, branch and media folder', () => {
    expect(config.backend.repo).toBe('PranavPatil-21/portfolio')
    expect(config.backend.branch).toBe('main')
    expect(config.media_folder).toBe('public/uploads')
  })
})

describe('folder collections map to real content directories', () => {
  const folderCollections = config.collections.filter((c) => c.folder)

  it('every folder collection writes inside content/', () => {
    expect(folderCollections.length).toBeGreaterThan(0)
    for (const c of folderCollections) {
      expect(c.folder!.startsWith('content/')).toBe(true)
    }
  })

  it('every folder collection has a loader that reads it', () => {
    const readByLoader = new Set([
      'content/experience',
      'content/projects',
      'content/articles',
      'content/education',
      'content/responsibilities',
      'content/sections',
    ])
    for (const c of folderCollections) {
      expect(readByLoader).toContain(c.folder!.replace(/\/$/, ''))
    }
  })
})

describe('file collections point at files the loader reads', () => {
  it.each([
    ['settings', 'content/settings.json'],
    ['layout', 'content/layout.json'],
    ['skills', 'content/skills.json'],
  ])('%s → %s', (name, file) => {
    const c = collections.get(name)
    expect(c, `collection "${name}" is missing from config.yml`).toBeTruthy()
    expect(c!.files?.[0].file).toBe(file)
    expect(fs.existsSync(path.join(process.cwd(), file))).toBe(true)
  })
})

describe('every Zod-required field is offered by the CMS', () => {
  const cases: [string, z.ZodObject<z.ZodRawShape>, CmsField[]][] = [
    ['settings', settingsSchema, collections.get('settings')!.files![0].fields],
    ['experience', experienceSchema, collections.get('experience')!.fields!],
    ['projects', projectSchema, collections.get('projects')!.fields!],
    ['articles', articleSchema, collections.get('articles')!.fields!],
    ['education', educationSchema, collections.get('education')!.fields!],
    ['responsibilities', responsibilitySchema, collections.get('responsibilities')!.fields!],
    ['sections', customSectionSchema, collections.get('sections')!.fields!],
  ]

  it.each(cases)(
    '%s: no required field is missing from the admin form',
    (name, schema, fields) => {
      const offered = fieldNames(fields)
      const missing = requiredKeys(schema)
        .filter((k) => !LOADER_SUPPLIED.has(k))
        .filter((k) => !offered.has(k))
      expect(missing, `${name} is missing required CMS fields`).toEqual([])
    },
  )

  it.each(cases)('%s: the CMS offers no field the schema would strip', (name, schema, fields) => {
    const known = new Set(Object.keys(schema.shape))
    const unknown = [...fieldNames(fields)].filter((f) => !known.has(f))
    expect(unknown, `${name} offers fields the schema does not define`).toEqual([])
  })

  it.each(cases)('%s: never exposes slug, which the loader derives', (name, _schema, fields) => {
    const exposed = [...fieldNames(fields)].filter((f) => LOADER_SUPPLIED.has(f))
    expect(exposed, `${name} must not let the CMS set the slug`).toEqual([])
  })

  it.each(cases)('%s: writes body as the markdown document, not frontmatter', (name, _s, fields) => {
    const body = fields.find((f) => f.name === 'body')
    if (!body) return
    expect(body.widget, `${name} body must use the markdown widget`).toBe('markdown')
  })
})

describe('layout collection stays reorderable', () => {
  it('uses a list widget so sections can be dragged', () => {
    const sections = collections.get('layout')!.files![0].fields.find((f) => f.name === 'sections')
    expect(sections?.widget).toBe('list')
    expect(fieldNames(sections?.fields)).toEqual(new Set(['sectionId', 'visible']))
  })
})
