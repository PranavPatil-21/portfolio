# Personal Portfolio Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a deployed, 3D-accented personal portfolio site whose entire content surface is editable from a browser admin panel, at zero recurring cost.

**Architecture:** Content lives as markdown/JSON under `content/`, validated by Zod at build time and read through a single loader module. Next.js App Router renders it server-side. Sveltia CMS at `/admin` writes to `content/` via the GitHub API; each publish is a commit that triggers a Vercel rebuild. The 3D hero is dynamically imported and never blocks first paint.

**Tech Stack:** Next.js 16.3.3 (App Router) · React 19.2.8 · TypeScript 7.0.2 · Tailwind CSS 4.3.3 · Zod 4.5.2 · three 0.185.1 + @react-three/fiber 9.7.0 + @react-three/drei 10.7.8 · motion 13.1.1 · gray-matter 4.0.3 · fast-xml-parser 5.11.1 · rehype-sanitize 6.0.0 · Vitest 4.1.11 · Playwright 1.62.1

**Spec:** `docs/superpowers/specs/2026-08-29-portfolio-design.md`

## Global Constraints

- **Cost is $0 recurring.** No managed database, no paid service, no free tier that idle-pauses as the content store.
- **`content/` is the only directory the CMS writes to.** `src/` never writes to `content/`.
- **All content is read through `src/content/index.ts`.** No component reads the filesystem directly.
- **Every content file is Zod-validated at build time.** Invalid content fails the build with a message naming the file and the field.
- **All readable text is server-rendered DOM.** Nothing readable exists only inside a `<canvas>` or a client-side fetch.
- **`prefers-reduced-motion` is honoured everywhere.** No exceptions.
- **Imported third-party HTML is sanitised server-side against an allowlist** before rendering.
- **No secrets in the repository.** No credential is ever verified client-side.
- **Owner-facing copy uses the owner's real details** from `content/settings.json`; never hardcode "Pranav" in a component.
- **Package manager: npm.** Node 26.5.0.

---

## File Structure

| Path | Responsibility |
|---|---|
| `content/**` | The editable surface. Markdown + JSON. CMS-owned. |
| `src/content/schemas.ts` | Zod schemas + inferred TypeScript types. Single source of content shape. |
| `src/content/loader.ts` | Filesystem reads, frontmatter parsing, validation, error reporting. |
| `src/content/index.ts` | Public API. The only module components import content from. |
| `src/lib/theme.ts` | Maps settings theme values → CSS custom properties. |
| `src/lib/medium.ts` | Medium RSS fetch, parse, sanitise, normalise to `Article`. |
| `src/lib/markdown.tsx` | Markdown → React, shared by native articles and project bodies. |
| `src/components/three/HeroScene.tsx` | The R3F scene. Client-only, dynamically imported. |
| `src/components/three/HeroCanvas.tsx` | Capability detection, poster fallback, lazy boundary. |
| `src/components/sections/*.tsx` | One component per section type. Pure — props in, DOM out. |
| `src/components/ui/*.tsx` | Shared primitives (Card, Tag, Reveal, SectionShell). |
| `src/app/**` | Routes, metadata, sitemap, robots, OG image. |
| `public/admin/index.html` | Sveltia CMS host page. |
| `public/admin/config.yml` | CMS schema — must mirror `schemas.ts` exactly. |

**Ownership rule for parallel execution:** each task below owns its listed files exclusively. No task edits another task's files. Tasks 3–9 are mutually independent and run in parallel; they all consume the contracts frozen in Task 2.

---

## Task 1: Scaffold and toolchain

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`
- Test: `src/app/__tests__/smoke.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: a running Next.js app; `npm run dev`, `npm run build`, `npm test`, `npm run typecheck` all work.

- [ ] **Step 1: Create the Next.js app**

```bash
npx create-next-app@16.3.3 . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*" --use-npm --yes
```

- [ ] **Step 2: Add remaining dependencies**

```bash
npm i three@0.185.1 @react-three/fiber@9.7.0 @react-three/drei@10.7.8 \
      motion@13.1.1 zod@4.5.2 gray-matter@4.0.3 fast-xml-parser@5.11.1 \
      rehype-sanitize@6.0.0 rehype-stringify@10.0.1 remark-parse@11.0.0 \
      remark-rehype@11.1.1 unified@11.0.5 rehype-raw@7.0.0
npm i -D vitest@4.1.11 @vitejs/plugin-react@5.0.4 jsdom@28.0.1 \
      @testing-library/react@17.0.2 @testing-library/jest-dom@6.9.1 \
      @playwright/test@1.62.1 @axe-core/playwright@4.11.0
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

Create `vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Add scripts to `package.json`**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit",
  "e2e": "playwright test"
}
```

- [ ] **Step 5: Write the smoke test**

```tsx
// src/app/__tests__/smoke.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

function Hello() { return <h1>portfolio</h1> }

describe('toolchain', () => {
  it('renders react components under vitest', () => {
    render(<Hello />)
    expect(screen.getByRole('heading')).toHaveTextContent('portfolio')
  })
})
```

- [ ] **Step 6: Verify**

Run: `npm test && npm run typecheck && npm run build`
Expected: all three pass.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js app with Tailwind, Vitest and Playwright"
```

---

## Task 2: Content layer — schemas, loader, seed content

This task freezes the contracts every later task builds on. It must land before Tasks 3–9 begin.

**Files:**
- Create: `src/content/schemas.ts`, `src/content/loader.ts`, `src/content/index.ts`, `content/settings.json`, `content/layout.json`, `content/skills.json`, `content/experience/*.md`, `content/projects/*.md`, `content/education/*.md`, `content/responsibilities/*.md`, `content/articles/hello-world.md`
- Test: `src/content/__tests__/schemas.test.ts`, `src/content/__tests__/loader.test.ts`

**Interfaces:**
- Consumes: Task 1's toolchain.
- Produces — every later task imports from `@/content`:

```ts
export type Social   = { label: string; url: string; icon: string }
export type Settings = {
  name: string; roles: string[]; bio: string; location: string
  email: string; phone?: string; avatar?: string; resumePdf?: string
  socials: Social[]
  theme: { accent: string; background: string; foreground: string; defaultMode: 'light' | 'dark' | 'system' }
  seo: { title: string; description: string; ogImage?: string }
  features: { hero3d: boolean; mediumImport: boolean; mediumHandle?: string }
}
export type Experience = { slug: string; role: string; company: string; location: string; start: string; end?: string; current: boolean; bullets: string[]; tech: string[]; logo?: string; order: number }
export type Project = { slug: string; title: string; summary: string; body: string; tech: string[]; repo?: string; demo?: string; cover?: string; featured: boolean; date: string; order: number }
export type Article = { slug: string; title: string; excerpt: string; body: string; cover?: string; tags: string[]; date: string; draft: boolean; source: 'native' | 'medium'; canonicalUrl?: string; externalUrl?: string; hasFullText: boolean }
export type SkillGroup = { label: string; items: string[] }
export type Education = { slug: string; institution: string; degree: string; location: string; start: string; end?: string; details: string[]; order: number }
export type Responsibility = { slug: string; role: string; organisation: string; location: string; start: string; end?: string; bullets: string[]; order: number }
export type CustomItem = { title: string; subtitle?: string; date?: string; description?: string; image?: string; tags: string[]; links: { label: string; url: string }[] }
export type CustomSection = { slug: string; title: string; layout: 'cards' | 'timeline' | 'list' | 'logo-grid'; items: CustomItem[]; order: number }
export type LayoutEntry = { sectionId: string; visible: boolean }

export function getSettings(): Settings
export function getExperience(): Experience[]        // sorted by order
export function getProjects(): Project[]             // sorted by order
export function getNativeArticles(): Article[]       // drafts excluded, newest first
export function getSkills(): SkillGroup[]
export function getEducation(): Education[]
export function getResponsibilities(): Responsibility[]
export function getCustomSections(): CustomSection[]
export function getLayout(): LayoutEntry[]
```

- [ ] **Step 1: Write failing schema tests**

```ts
// src/content/__tests__/schemas.test.ts
import { describe, it, expect } from 'vitest'
import { settingsSchema, experienceSchema } from '../schemas'

describe('settingsSchema', () => {
  it('accepts a complete settings object', () => {
    const r = settingsSchema.safeParse({
      name: 'Pranav Patil', roles: ['Software Engineer'], bio: 'hi',
      location: 'India', email: 'a@b.com', socials: [],
      theme: { accent: '#6c5ce7', background: '#0b0b12', foreground: '#f5f5f7', defaultMode: 'dark' },
      seo: { title: 'Pranav Patil', description: 'Portfolio' },
      features: { hero3d: true, mediumImport: false },
    })
    expect(r.success).toBe(true)
  })

  it('rejects a missing required field and names it', () => {
    const r = settingsSchema.safeParse({ name: 'x' })
    expect(r.success).toBe(false)
    if (!r.success) expect(JSON.stringify(r.error.issues)).toContain('email')
  })

  it('rejects a non-hex accent colour', () => {
    const r = settingsSchema.safeParse({ theme: { accent: 'blurple' } })
    expect(r.success).toBe(false)
  })
})

describe('experienceSchema', () => {
  it('defaults current to false and tech to an empty array', () => {
    const r = experienceSchema.parse({
      role: 'SWE', company: 'Wio', location: 'Gurugram',
      start: '2024-09', bullets: ['did things'],
    })
    expect(r.current).toBe(false)
    expect(r.tech).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/content`
Expected: FAIL — cannot resolve `../schemas`.

- [ ] **Step 3: Implement `src/content/schemas.ts`**

Use `z.object({...})` per the Interfaces block above. Rules:
- `accent`, `background`, `foreground`: `z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a 6-digit hex colour like #6c5ce7')`.
- `email`: `z.string().email()`. `repo`/`demo`/`url`/`canonicalUrl`: `z.string().url()`.
- Arrays that are optional in the CMS default to `[]` via `.default([])`; `current`/`featured`/`draft` default to `false`; `order` defaults to `0`.
- `start`/`end`/`date`: `z.string().regex(/^\d{4}(-\d{2})?(-\d{2})?$/, 'use YYYY, YYYY-MM or YYYY-MM-DD')`.
- Every image field is paired with a required `alt` where the image is content-bearing (`Project.cover`, `CustomItem.image`).
- Export both the schema and `z.infer` type for each.

- [ ] **Step 4: Implement `src/content/loader.ts`**

```ts
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { ZodType } from 'zod'

const ROOT = path.join(process.cwd(), 'content')

export function readJson<T>(file: string, schema: ZodType<T>): T {
  const full = path.join(ROOT, file)
  const parsed = schema.safeParse(JSON.parse(fs.readFileSync(full, 'utf8')))
  if (!parsed.success) throw new Error(formatError(file, parsed.error))
  return parsed.data
}

export function readCollection<T>(dir: string, schema: ZodType<T>): T[] {
  const full = path.join(ROOT, dir)
  if (!fs.existsSync(full)) return []
  return fs.readdirSync(full)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(full, f), 'utf8'))
      const slug = f.replace(/\.md$/, '')
      const parsed = schema.safeParse({ ...data, slug, body: content.trim() })
      if (!parsed.success) throw new Error(formatError(`${dir}/${f}`, parsed.error))
      return parsed.data
    })
}
```

`formatError(file, error)` returns a multi-line string: `Invalid content in content/<file>:` then one line per issue as `  • <path>: <message>`. This is the message the owner sees in the Vercel build log, so it must name the file and the field.

- [ ] **Step 5: Implement `src/content/index.ts`**

Thin wrappers calling `readJson`/`readCollection` and applying the documented sort. `getNativeArticles()` filters `draft === true` out and sorts by `date` descending; it sets `source: 'native'` and `hasFullText: true`.

- [ ] **Step 6: Write loader tests**

Cover: a valid collection loads and sorts by `order`; a missing directory returns `[]`; a malformed frontmatter file throws an error whose message contains both the filename and the offending field name.

- [ ] **Step 7: Seed `content/` from the resume**

Populate from `Pranav_s_Resume (5).pdf`: two Experience entries (Software Engineer at Wio Bank PJSC, Sept 2024–present, Gurugram; Software Engineer Intern, Feb 2024–Aug 2024, Remote) with the resume's bullets verbatim; two Projects (AES Cryptosystem via Double Pendulum; Splitwise Backend Clone); Education (Dhirubhai Ambani University, B.Tech ICT, Nov 2020–May 2024, Gandhinagar); two Responsibilities (Chairperson IEEE Society DAU; Finance Executive DCEI); Skills groups Languages / Frameworks & Tools / Databases / Core Concepts; settings with email `pranavnarendrapatil.2104@gmail.com`, phone `+91 7623955135`, socials for LinkedIn (`linkedin.com/in/pranav-patil`) and GitHub (`github.com/PranavPatil-21`); `features.mediumImport: false`; one placeholder article.

Move the resume PDF to `public/uploads/resume.pdf` and set `settings.resumePdf` to `/uploads/resume.pdf`.

- [ ] **Step 8: Verify and commit**

Run: `npm test && npm run typecheck`
Expected: PASS.

```bash
git add -A && git commit -m "feat: content schemas, loader and seed content from resume"
```

---

## Tasks 3–9 run in parallel. Each owns its files exclusively.

---

## Task 3: Design system and theme

**Files:**
- Create: `src/lib/theme.ts`, `src/components/ui/SectionShell.tsx`, `src/components/ui/Card.tsx`, `src/components/ui/Tag.tsx`, `src/components/ui/Reveal.tsx`
- Modify: `src/app/globals.css`
- Test: `src/lib/__tests__/theme.test.ts`, `src/components/ui/__tests__/Reveal.test.tsx`

**Interfaces:**
- Consumes: `Settings` from `@/content`.
- Produces:
  - `themeToCssVars(theme: Settings['theme']): Record<string, string>` — returns `{ '--accent': '#..', '--background': '#..', '--foreground': '#..' }`.
  - `<SectionShell id title subtitle children />` — semantic `<section>` with heading and scroll anchor.
  - `<Card />`, `<Tag />`, `<Reveal delay?>` — `Reveal` wraps children in a motion fade-and-rise on scroll into view.

- [ ] **Step 1** Write failing tests: `themeToCssVars` maps all three colours; `Reveal` renders its children (motion must not hide content from the DOM); `Reveal` applies no transform when `prefers-reduced-motion: reduce` is matched (mock `window.matchMedia`).
- [ ] **Step 2** Run: `npm test -- src/lib src/components/ui` — expect FAIL.
- [ ] **Step 3** Implement. `Reveal` uses `motion/react` `whileInView` with `useReducedMotion()`; when reduced, render a plain `<div>`. Define the dark/light palettes in `globals.css` as `@theme` tokens referencing the CSS variables so Tailwind utilities resolve against CMS-set colours.
- [ ] **Step 4** Run tests — expect PASS.
- [ ] **Step 5** Commit: `git commit -m "feat: design system primitives and CMS-driven theme tokens"`

---

## Task 4: Resume section components

**Files:**
- Create: `src/components/sections/Experience.tsx`, `Projects.tsx`, `Skills.tsx`, `Education.tsx`, `Responsibilities.tsx`, `Contact.tsx`
- Test: `src/components/sections/__tests__/sections.test.tsx`

**Interfaces:**
- Consumes: types from `@/content`; `SectionShell`, `Card`, `Tag`, `Reveal` from Task 3.
- Produces: `<Experience items={Experience[]} />`, `<Projects items={Project[]} />`, `<Skills groups={SkillGroup[]} />`, `<Education items={Education[]} />`, `<Responsibilities items={Responsibility[]} />`, `<Contact settings={Settings} />`. All are **server components taking data as props** — none reads content itself.

- [ ] **Step 1** Write failing tests: each renders its fixture's key text; **each returns `null` when given an empty array** (empty collections omit the section entirely — no empty heading); `Projects` renders a repo link only when `repo` is set; `Contact` renders a resume download link only when `settings.resumePdf` is set.
- [ ] **Step 2** Run — expect FAIL.
- [ ] **Step 3** Implement. Experience and Education render as a timeline; Projects as a tilt-on-hover card grid; Skills as grouped tag clusters. All headings are real `<h2>`/`<h3>`; links have discernible names.
- [ ] **Step 4** Run — expect PASS.
- [ ] **Step 5** Commit: `git commit -m "feat: resume section components"`

---

## Task 5: 3D hero

**Files:**
- Create: `src/components/three/HeroScene.tsx`, `src/components/three/HeroCanvas.tsx`, `src/components/sections/Hero.tsx`, `public/hero-poster.svg`
- Test: `src/components/three/__tests__/HeroCanvas.test.tsx`

**Interfaces:**
- Consumes: `Settings` from `@/content`.
- Produces: `<Hero settings={Settings} />` — renders name, roles and CTAs as real DOM, with the canvas layered behind.

- [ ] **Step 1** Write failing tests, mocking `@react-three/fiber`: the name and roles appear in the DOM **even when the canvas fails to mount**; the poster renders when `features.hero3d` is `false`; the poster renders when WebGL is unavailable (stub `HTMLCanvasElement.prototype.getContext` to return `null`); the scene is not imported at all when `hero3d` is `false`.
- [ ] **Step 2** Run — expect FAIL.
- [ ] **Step 3** Implement. `HeroCanvas` is `'use client'`, feature-detects WebGL, and `next/dynamic`-imports `HeroScene` with `ssr: false` and the poster as `loading`. `HeroScene` renders a distorted icosahedron plus instanced particles drifting toward the cursor, tinted with `--accent`. Apply: `dpr={[1, 2]}`, `frameloop` set to `'never'` under reduced motion, pause on `document.hidden` and when scrolled out of view via IntersectionObserver, and reduce particle count when `navigator.hardwareConcurrency <= 4`.
- [ ] **Step 4** Run — expect PASS.
- [ ] **Step 5** Commit: `git commit -m "feat: 3D hero with poster fallback and motion guardrails"`

---

## Task 6: Articles — rendering and routes

**Files:**
- Create: `src/lib/markdown.tsx`, `src/components/sections/Articles.tsx`, `src/app/articles/page.tsx`, `src/app/articles/[slug]/page.tsx`
- Test: `src/lib/__tests__/markdown.test.ts`, `src/components/sections/__tests__/articles.test.tsx`

**Interfaces:**
- Consumes: `Article` type and `getNativeArticles()` from `@/content`; Task 3 primitives.
- Produces:
  - `renderMarkdown(md: string): Promise<string>` — markdown → sanitised HTML string.
  - `<Articles items={Article[]} />` — the homepage teaser list.
  - Routes `/articles` and `/articles/[slug]`.

- [ ] **Step 1** Write failing tests: `renderMarkdown` converts headings, links and code fences; **it strips `<script>` and `on*` attributes**; `Articles` returns `null` for an empty array; an article card with `hasFullText: false` links out externally and is labelled as such, while one with `hasFullText: true` links to `/articles/<slug>`.
- [ ] **Step 2** Run — expect FAIL.
- [ ] **Step 3** Implement using `unified` → `remark-parse` → `remark-rehype` (`allowDangerousHtml: true`) → `rehype-raw` → `rehype-sanitize` (default GitHub schema) → `rehype-stringify`. The detail route calls `generateStaticParams` from native articles, sets `canonicalUrl` in metadata when present, and calls `notFound()` for unknown slugs.
- [ ] **Step 4** Run — expect PASS.
- [ ] **Step 5** Commit: `git commit -m "feat: article rendering, list and detail routes"`

---

## Task 7: Medium importer

**Files:**
- Create: `src/lib/medium.ts`, `src/lib/__tests__/fixtures/medium-full.xml`, `medium-abstract.xml`, `medium-empty.xml`, `medium-malformed.xml`
- Test: `src/lib/__tests__/medium.test.ts`

**Interfaces:**
- Consumes: `Article` type from `@/content`; `renderMarkdown`'s sanitiser approach from Task 6 (but implement sanitisation independently — do not import from Task 6, to keep the tasks decoupled).
- Produces: `fetchMediumArticles(handle: string): Promise<Article[]>` — never throws.

- [ ] **Step 1** Write failing tests against the fixtures:
  - a post with `<content:encoded>` yields `hasFullText: true` and a sanitised body;
  - a member-only post yields `hasFullText: false`, an empty body and a populated `externalUrl`;
  - an empty feed yields `[]`;
  - malformed XML yields `[]` and does **not** throw;
  - a network failure yields `[]` and does **not** throw;
  - **hostile input** — a fixture containing `<script>alert(1)</script>`, an `onerror` attribute and a `javascript:` href — is fully stripped from the output;
  - every returned article has `source: 'medium'` and `canonicalUrl` set to the Medium permalink.
- [ ] **Step 2** Run — expect FAIL.
- [ ] **Step 3** Implement with `fast-xml-parser`, a 5-second `AbortSignal.timeout`, and the same unified sanitise pipeline. Wrap the whole body in try/catch; on any failure `console.warn` and return `[]`.
- [ ] **Step 4** Run — expect PASS.
- [ ] **Step 5** Commit: `git commit -m "feat: Medium RSS importer with sanitisation and graceful degradation"`

---

## Task 8: Custom section builder

**Files:**
- Create: `src/components/sections/CustomSection.tsx`, `src/components/sections/layouts/CardsLayout.tsx`, `TimelineLayout.tsx`, `ListLayout.tsx`, `LogoGridLayout.tsx`
- Test: `src/components/sections/__tests__/custom.test.tsx`

**Interfaces:**
- Consumes: `CustomSection`, `CustomItem` types; Task 3 primitives.
- Produces: `<CustomSection section={CustomSection} />` dispatching on `section.layout`.

- [ ] **Step 1** Write failing tests: each of the four layouts renders its items; an unknown layout value falls back to `cards` rather than crashing; a section with no items renders `null`; item links render with their labels; an item image renders with its alt text.
- [ ] **Step 2** Run — expect FAIL.
- [ ] **Step 3** Implement. Layouts share the `CustomItem` shape and reuse Task 3 primitives so custom sections inherit the site's visual language automatically.
- [ ] **Step 4** Run — expect PASS.
- [ ] **Step 5** Commit: `git commit -m "feat: generic custom section builder with four layouts"`

---

## Task 9: SEO, metadata and CMS configuration

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/opengraph-image.tsx`, `src/components/JsonLd.tsx`, `public/admin/index.html`, `public/admin/config.yml`
- Test: `src/components/__tests__/JsonLd.test.tsx`

**Interfaces:**
- Consumes: `getSettings()`, `getNativeArticles()`, `getProjects()` from `@/content`.
- Produces: `<JsonLd settings={Settings} />` emitting a `Person` schema; `/sitemap.xml`; `/robots.txt`; a generated OG image; the CMS at `/admin`.

- [ ] **Step 1** Write a failing test: `JsonLd` emits valid JSON-LD with `@type: 'Person'`, the owner's name, and `sameAs` populated from `socials`.
- [ ] **Step 2** Run — expect FAIL.
- [ ] **Step 3** Implement. `sitemap.ts` enumerates `/`, `/articles` and every native article. `opengraph-image.tsx` uses `next/og` with the owner's name, first role and accent colour.

  `public/admin/config.yml` **must mirror `src/content/schemas.ts` field-for-field** — a CMS field the schema rejects produces a broken build, so every widget's requiredness and defaults must match. Configure:
  ```yaml
  backend:
    name: github
    repo: PranavPatil-21/portfolio
    branch: main
  media_folder: public/uploads
  public_folder: /uploads
  ```
  Collections: `settings` and `layout` as `files`; `experience`, `projects`, `articles`, `education`, `responsibilities`, `sections` as folder collections; `skills` as a file collection. Give every collection a `label`, human-readable field `hint`s, and `required` flags matching the Zod schema. Image fields carry a sibling required `alt` text field. `layout.json` uses a `list` widget so sections are drag-reorderable.

  `public/admin/index.html` loads Sveltia CMS from its CDN bundle and nothing else.
- [ ] **Step 4** Run — expect PASS.
- [ ] **Step 5** Commit: `git commit -m "feat: SEO metadata, JSON-LD, OG image and Sveltia CMS config"`

---

## Task 10: Page assembly

Runs after Tasks 3–9 merge.

**Files:**
- Modify: `src/app/page.tsx`, `src/app/layout.tsx`
- Create: `src/components/SectionRenderer.tsx`, `src/components/Nav.tsx`, `src/components/Footer.tsx`
- Test: `src/components/__tests__/SectionRenderer.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 3–9.
- Produces: the assembled homepage, ordered by `content/layout.json`.

- [ ] **Step 1** Write failing tests: `SectionRenderer` renders sections in `layout.json` order; it skips entries with `visible: false`; it skips unknown `sectionId` values without crashing; custom sections interleave correctly with built-in ones.
- [ ] **Step 2** Run — expect FAIL.
- [ ] **Step 3** Implement. `layout.tsx` injects `themeToCssVars` as an inline style on `<html>`, sets `metadata` from settings, and renders `JsonLd`, `Nav` and `Footer`. `page.tsx` loads all content server-side and delegates ordering to `SectionRenderer`. When `features.mediumImport` is true, merge `fetchMediumArticles(handle)` into the article list; set `export const revalidate = 86400`.
- [ ] **Step 4** Run — expect PASS.
- [ ] **Step 5** Commit: `git commit -m "feat: assemble homepage with CMS-driven section ordering"`

---

## Task 11: End-to-end and accessibility verification

**Files:**
- Create: `playwright.config.ts`, `e2e/site.spec.ts`, `e2e/a11y.spec.ts`

- [ ] **Step 1** Write the specs: the homepage renders every visible section's heading; an article page renders its body; the resume link resolves with HTTP 200; **the site is fully readable with JavaScript disabled**; `/admin` serves the CMS page; axe reports no serious or critical violations on `/` and `/articles`.
- [ ] **Step 2** Run: `npx playwright install --with-deps chromium && npm run e2e` — expect FAIL where unimplemented.
- [ ] **Step 3** Fix whatever the specs catch.
- [ ] **Step 4** Run — expect PASS.
- [ ] **Step 5** Commit: `git commit -m "test: end-to-end and accessibility coverage"`

---

## Task 12: Deployment

**Files:**
- Create: `README.md`, `docs/ADMIN.md`, `vercel.json`

- [ ] **Step 1** Write `docs/ADMIN.md` — the owner-facing guide: how to log in, add each content type, upload images, replace the resume, reorder sections, change theme colours, and what to do if a build fails. Written for someone who will read it once, six months from now.
- [ ] **Step 2** Write `README.md` — one-time setup: create the GitHub repo, import to Vercel, deploy the Sveltia CMS Authenticator to Cloudflare Workers, register the GitHub OAuth app, attach a custom domain. Include the token-based sign-in fallback.
- [ ] **Step 3** Add `vercel.json` with a daily cron hitting a revalidation route (only needed when `mediumImport` is enabled).
- [ ] **Step 4** Verify: `npm run build && npm test && npm run typecheck && npm run e2e` all pass.
- [ ] **Step 5** Commit and push.

---

## Self-Review

**Spec coverage:** §3.2 stack → Task 1. §3.3 layout + §4 content model → Task 2. §5.1 editability → Tasks 2, 3, 9, 10. §5.3 custom sections → Task 8. §6 articles → Tasks 6, 7. §7 3D guardrails → Task 5. §8 SEO/a11y/security → Tasks 9, 11. §9 testing → every task plus Task 11. §10 deployment → Task 12. §11 risks → mitigations are the tested behaviours in Tasks 5, 7 and the build-time validation in Task 2. No gaps.

**Type consistency:** every task consumes the type names frozen in Task 2's Interfaces block. `hasFullText` is used consistently by Tasks 6 and 7. `themeToCssVars` is defined in Task 3 and consumed only in Task 10.

**Known deviation from strict TDD:** Tasks 3–9 compress the red-green-commit cycle into one step per file group rather than per test, to allow parallel execution. Each still writes tests first and requires them to fail before implementing.
