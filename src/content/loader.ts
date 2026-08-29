import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { ZodType, ZodError } from 'zod'

const ROOT = path.join(process.cwd(), 'content')

/**
 * Formats a validation failure so the owner can act on it from a Vercel build
 * log alone. It must name the file and every offending field — this message is
 * the entire debugging experience for someone editing through a browser.
 */
export function formatError(file: string, error: ZodError): string {
  const issues = error.issues
    .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n')
  return `Invalid content in content/${file}:\n${issues}`
}

export function readJson<T>(file: string, schema: ZodType<T>): T {
  const full = path.join(ROOT, file)
  if (!fs.existsSync(full)) {
    throw new Error(`Missing required content file: content/${file}`)
  }
  let raw: unknown
  try {
    raw = JSON.parse(fs.readFileSync(full, 'utf8'))
  } catch (e) {
    throw new Error(
      `Invalid content in content/${file}: not valid JSON (${(e as Error).message})`,
    )
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) throw new Error(formatError(file, parsed.error))
  return parsed.data
}

/**
 * Reads a directory of markdown files. Frontmatter plus the markdown body are
 * merged, with the filename becoming `slug`, then validated.
 *
 * A missing directory yields `[]` rather than throwing: the owner may delete
 * every entry in a collection through the CMS, and that is a valid state.
 */
export function readCollection<T>(dir: string, schema: ZodType<T>): T[] {
  const full = path.join(ROOT, dir)
  if (!fs.existsSync(full)) return []
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data, content } = matter(
        fs.readFileSync(path.join(full, f), 'utf8'),
      )
      const slug = f.replace(/\.md$/, '')
      const parsed = schema.safeParse({ ...data, slug, body: content.trim() })
      if (!parsed.success) throw new Error(formatError(`${dir}/${f}`, parsed.error))
      return parsed.data
    })
}

/** Sorts by explicit `order`, then by `start`/`date` descending as a tiebreak. */
export function byOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order)
}

export function byDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date))
}
