# Personal Portfolio Site — Design Spec

**Date:** 2026-08-29
**Owner:** Pranav Patil (personal project — unaffiliated with any employer)
**Status:** Approved design, pending implementation plan

---

## 1. Purpose

A modern, 3D-accented personal portfolio site that Pranav can update entirely
through a browser admin panel after deployment, without touching code, and that
costs nothing to run.

### Success criteria

The build is successful when all of the following are true:

1. The site is live on a custom domain over HTTPS at zero recurring cost.
2. Pranav can log in at `/admin`, add a project, upload an image, and see it
   live — without a terminal, an editor, or a git command.
3. The site still works after 60 days of zero traffic and zero edits.
4. The hero presents a genuine real-time 3D scene, while the site remains fully
   readable with JavaScript disabled or 3D unavailable.
5. Articles are authored on-site and render in full on-site.
6. A recruiter sharing the link gets a correct title, description and preview
   image.

### Explicit non-goals

- Multi-user accounts, roles, or collaborative editing. One admin: Pranav.
- Comments, likes, or any user-generated content from visitors.
- Analytics of any kind. Out of scope for v1; Vercel's built-in analytics can be enabled later without code changes.
- Defining brand-new *visual layouts* from the admin panel. New content types
  are supported (§5.3); new bespoke layouts are a code change by design.
- E-commerce, newsletters, or contact-form-to-CRM integrations.

---

## 2. Constraints

| Constraint | Consequence for the design |
|---|---|
| Must cost $0 indefinitely | No managed database. Free tiers that idle-pause are disqualified as the content store. |
| Owner edits roughly monthly | The system must survive long idle periods untouched. Anything that expires from disuse is unacceptable. |
| Owner is a backend engineer, not a designer | Admin must be self-explanatory; content must be schema-validated so a bad edit cannot ship a broken site. |
| 3D is a requirement, not a nice-to-have | React is mandatory (React Three Fiber). Rules out pure static generators without a React runtime. |
| Recruiters and search engines must read the content | Content must be present in server-rendered HTML, never only inside a canvas or a client-side fetch. |

---

## 3. Architecture

### 3.1 Chosen approach: git-as-CMS

Content is markdown and JSON committed to this repository. The admin panel is a
client-side application served from the site itself that reads and writes those
files through the GitHub API using the owner's own GitHub credentials.

```
Pranav → /admin (GitHub login)
           │  edits content, uploads images
           ▼
      GitHub API → commit to main
           │
           ▼
      Vercel build hook → Next.js build → deploy (~1 min)
```

**Why this over the alternatives:**

- *Hosted headless CMS (Sanity et al.)*: better editor, but introduces a
  third-party account whose free-tier terms are outside our control, and the
  content stops being ours.
- *Database + custom admin*: most control, but free Postgres tiers idle-pause on
  inactivity — precisely the failure mode our usage pattern triggers — and it
  means building and maintaining an entire CMS.

Git-as-CMS has no runtime state to expire, keeps content portable as plain
files in the repo, and gives free version history and rollback via git.

**Accepted trade-off:** publishing triggers a rebuild, so changes appear in
roughly a minute rather than instantly. For a monthly-edited portfolio this is
acceptable.

### 3.2 Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Server-rendered HTML for SEO; React runtime for 3D; first-class Vercel support. |
| Styling | Tailwind CSS + CSS custom properties | Theme values from the CMS are injected as CSS variables, so colours are editable without a rebuild of the design system. |
| 3D | React Three Fiber + drei | The standard React binding for Three.js. |
| Animation | Framer Motion | Scroll reveals, transitions; honours `prefers-reduced-motion` natively. |
| Admin | Sveltia CMS | Actively maintained git-based CMS; supports GitHub auth without self-hosted infrastructure. |
| Content validation | Zod | Every content file is parsed against a schema at build time. |
| Hosting | Vercel (free tier) | Free custom domain and SSL; scheduled revalidation without a server to keep alive. |
| Admin auth | GitHub OAuth via Sveltia CMS Authenticator on Cloudflare Workers | Free, one-time deploy. Fallback: GitHub personal access token sign-in, which needs no infrastructure at all. |

### 3.3 Repository layout

```
content/              # the entire editable surface — CMS writes only here
  settings.json       #   identity, socials, theme, SEO, feature toggles
  layout.json         #   section order and visibility
  experience/*.md
  projects/*.md
  articles/*.md
  education/*.md
  skills.json
  responsibilities/*.md
  sections/*.md       #   user-defined custom sections (§5.3)
public/
  uploads/            #   CMS-uploaded images and the resume PDF
  admin/config.yml    #   CMS schema definition
src/
  content/            # loading, Zod schemas, validation
  components/
    three/            # 3D scene, isolated behind a dynamic import
    sections/         # one component per section type
    ui/
  app/                # routes
```

**Boundary rule:** `content/` is the only directory the CMS writes to, and
`src/` never writes to it. Every consumer reads content through
`src/content/`, which is the single place where files are parsed and validated.
This keeps content shape changes to one module.

---

## 4. Content model

Derived from the owner's current resume.

| Collection | Type | Key fields |
|---|---|---|
| Settings | single | name, roles[], bio, avatar, location, email, phone, socials[], resume PDF, theme colours, SEO defaults, feature toggles |
| Layout | single | ordered list of `{ sectionId, visible }` |
| Experience | list | role, company, location, start, end, current, bullets[], tech[], logo |
| Projects | list | title, summary, description, tech[], repo, demo, cover image, gallery[], featured, date |
| Articles | list | title, slug, excerpt, cover, tags[], published date, draft, body (markdown), canonical URL, source (`native` \| `medium`) |
| Skills | single | groups[] of `{ label, items[] }` |
| Education | list | institution, degree, location, start, end, details |
| Responsibilities | list | role, organisation, location, start, end, bullets[] |
| Custom sections | list | title, layout, items[] (§5.3) |

**Validation:** every file is parsed with Zod at build time. A malformed or
incomplete entry fails the build with a readable message naming the file and
field, rather than deploying a broken page. Because the previous deploy stays
live on a failed build, an invalid edit can never take the site down.

---

## 5. Editability guarantees

This section defines precisely what "no code changes" means, because that is the
central promise of the project.

### 5.1 No code change required

- Add, edit, reorder, or delete any entry in any collection.
- Edit every user-facing string: hero headline, bio, section headings, CTA
  labels, footer, meta title and description.
- Upload or replace images and the resume PDF.
- Reorder sections and toggle their visibility.
- Change theme colours, accent colour, and light/dark default.
- Toggle features on and off, including the 3D hero and the Medium importer.

### 5.2 One-time setup, then never again

- Custom domain, GitHub OAuth helper deployment.

### 5.3 Custom sections

To keep the promise beyond the sections designed today, the admin exposes a
generic section builder. The owner creates a section with a title, chooses a
layout from a fixed set — `cards`, `timeline`, `list`, `logo-grid` — and adds
items with a common field set (title, subtitle, date, description, links, image,
tags). It renders in the site's existing visual language automatically.

This covers plausible future sections (Talks, Awards, Certifications,
Publications) without code. Inventing a *new visual layout* remains a code
change; that boundary is deliberate and is stated here so it does not drift.

---

## 6. Articles

**Native-first.** Articles are authored in the admin as markdown and render in
full at `/articles/<slug>`. This is the primary path.

**Rationale.** Medium's RSS feed carries only the ten most recent posts and
exposes only an abstract for member-only articles. A Medium-sourced site would
therefore silently lose history past ten posts and fail to render paywalled
pieces. Verified 2026-08-29; the owner's handle currently returns no feed, so no
existing content is lost by choosing native authoring.

**Medium importer (optional, off by default).** When a handle is set in
settings, the build fetches `https://medium.com/feed/@<handle>` server-side and
merges those posts into the article list.

- Refresh: on each build, and on a daily scheduled revalidation.
- Full text is rendered on-site when the feed provides it; otherwise the entry
  renders as a card linking to Medium, clearly labelled.
- Imported HTML is **sanitised server-side against an allowlist** before
  rendering. Injecting third-party HTML unsanitised would be a stored-XSS vector
  on our own origin.
- Imported articles emit `rel="canonical"` to the Medium original to avoid
  duplicate-content penalties.
- A feed that is unreachable, empty, or malformed logs a warning and is skipped.
  It never fails the build.

---

## 7. 3D and motion

A React Three Fiber hero scene — animated geometry and particles responding to
cursor position — anchors the page. Remaining sections are conventional, fast,
and readable, with scroll-triggered reveals, subtle tilt-on-hover cards, and
smooth route transitions.

**Guardrails, all required:**

1. The 3D bundle is dynamically imported and never blocks first paint. A static
   poster image renders immediately underneath.
2. All text content is real server-rendered DOM. Nothing readable exists only
   inside the canvas.
3. WebGL support is feature-detected; on failure the poster remains and the site
   is fully functional.
4. `prefers-reduced-motion` disables scene animation and scroll motion.
5. Scene complexity and pixel ratio are reduced on low-end and mobile devices.
6. The scene pauses rendering when the tab is hidden or scrolled out of view, to
   avoid draining battery.

---

## 8. Cross-cutting requirements

**SEO and sharing.** Per-page metadata from CMS values; generated Open Graph
images; `sitemap.xml`; `robots.txt`; JSON-LD `Person` schema.

**Accessibility.** Semantic landmarks, keyboard-navigable throughout, visible
focus states, alt text on every CMS image upload (required field), colour
contrast validated against the CMS-chosen theme.

**Performance budget.** Lighthouse ≥ 90 on Performance, Accessibility, Best
Practices and SEO on mobile, measured with the 3D hero enabled.

**Security.** Admin writes are authorised by GitHub OAuth against the owner's
own account — repository write permission is the authorisation model, and no
credential is ever verified client-side. Imported third-party HTML is sanitised
(§6). No secrets in the repository.

**Error handling.** Invalid content fails the build loudly and the prior deploy
stays live. A missing image falls back to a placeholder. An unreachable Medium
feed is skipped with a warning. Empty collections render as omitted sections
rather than empty headings.

---

## 9. Testing strategy

| Layer | Approach |
|---|---|
| Content schemas | Unit tests per Zod schema: valid fixtures parse, malformed fixtures fail with a useful message. |
| Medium importer | Unit tests against recorded feed fixtures: full-content post, abstract-only post, empty feed, malformed XML, unreachable host. Sanitisation is tested with hostile input. |
| Section rendering | Component tests: each section type renders its fixture; empty collections omit the section. |
| Accessibility | Automated axe checks on rendered pages. |
| End-to-end | Playwright smoke: home page renders all sections; article page renders body; resume link resolves; site is fully functional with WebGL unavailable. |
| Build gate | Type-check, lint, tests, and content validation all run before deploy. |

---

## 10. Deployment

1. GitHub repository (private or public — owner's choice).
2. Vercel project connected to it; deploys on push to `main`.
3. Cloudflare Worker running Sveltia CMS Authenticator; GitHub OAuth app
   registered against it.
4. Custom domain pointed at Vercel.
5. Daily scheduled revalidation for the Medium importer.

Rollback is `git revert` — or, from the admin, restoring the previous value.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Medium changes or removes its RSS feed | Importer is optional and isolated; native articles are unaffected. |
| 3D hurts mobile performance | Explicit budget (§8), device downgrading, and a toggle to disable it from the admin. |
| Owner edits content into an invalid state | Build-time validation; failed build leaves the previous deploy live. |
| Vercel free-tier terms change | Content is plain files in a git repo; the site is portable to any static host with modest rework. |
| OAuth helper drifts out of maintenance | Token-based sign-in is a documented, infrastructure-free fallback. |
