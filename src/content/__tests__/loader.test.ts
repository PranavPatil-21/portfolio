import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { readCollection, readJson } from '../loader'
import { experienceSchema, skillsSchema } from '../schemas'

const ROOT = path.join(process.cwd(), 'content')
const TMP = path.join(ROOT, '__loader_fixtures__')

beforeAll(() => {
  fs.mkdirSync(TMP, { recursive: true })
  fs.writeFileSync(
    path.join(TMP, 'b-second.md'),
    `---\nrole: Intern\ncompany: Wio\nstart: 2024-02\norder: 2\n---\nBody two.`,
  )
  fs.writeFileSync(
    path.join(TMP, 'a-first.md'),
    `---\nrole: Engineer\ncompany: Wio\nstart: 2024-09\norder: 1\n---\nBody one.`,
  )
})

afterAll(() => {
  fs.rmSync(TMP, { recursive: true, force: true })
})

describe('readCollection', () => {
  it('loads markdown files with frontmatter, slug and body', () => {
    const items = readCollection('__loader_fixtures__', experienceSchema)
    expect(items).toHaveLength(2)
    const first = items.find((i) => i.slug === 'a-first')
    expect(first?.role).toBe('Engineer')
    expect(first?.body).toBe('Body one.')
  })

  it('returns an empty array for a missing directory', () => {
    expect(readCollection('does-not-exist', experienceSchema)).toEqual([])
  })

  it('throws naming both the file and the offending field', () => {
    const bad = path.join(TMP, 'broken.md')
    fs.writeFileSync(bad, `---\ncompany: Wio\nstart: 2024-09\n---\nNo role.`)
    try {
      expect(() =>
        readCollection('__loader_fixtures__', experienceSchema),
      ).toThrowError(/broken\.md/)
      expect(() =>
        readCollection('__loader_fixtures__', experienceSchema),
      ).toThrowError(/role/)
    } finally {
      fs.rmSync(bad, { force: true })
    }
  })
})

describe('readJson', () => {
  it('throws a readable error for a missing file', () => {
    expect(() => readJson('nope.json', skillsSchema)).toThrowError(
      /Missing required content file/,
    )
  })

  it('throws a readable error for malformed JSON', () => {
    const bad = path.join(ROOT, '__broken__.json')
    fs.writeFileSync(bad, '{ not json')
    try {
      expect(() => readJson('__broken__.json', skillsSchema)).toThrowError(
        /not valid JSON/,
      )
    } finally {
      fs.rmSync(bad, { force: true })
    }
  })
})
