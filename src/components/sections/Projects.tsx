import { SectionShell } from '@/components/ui/SectionShell'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'
import { formatDate } from './Experience'
import type { Project } from '@/content/schemas'

const LINK =
  'inline-flex items-center gap-1.5 rounded text-[13px] font-medium ' +
  'underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-[var(--accent)]'

/**
 * Flattens markdown to the sentence underneath it.
 *
 * A deliberately small local helper rather than the real markdown pipeline: a
 * case-study card wants one paragraph of prose, not a rendered document, and
 * pulling `unified`/`remark` in here would drag a parser into a component whose
 * only job is to show a couple of lines. The detail page owns the real render.
 *
 * Order matters — inline code is unwrapped first so a backticked `*` inside it
 * is not mistaken for emphasis, and links are unwrapped before bare emphasis so
 * `[*text*](url)` collapses cleanly.
 */
function stripMarkdown(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}[-*+]\s+/gm, '')
    .replace(/^\s{0,3}\d+\.\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)([^*_]+)\1/g, '$2')
    .replace(/\s+/g, ' ')
    .trim()
}

const EXCERPT_MAX = 300
/** A heading longer than this is a sentence, not a label — drop it rather than
 *  wrap a paragraph of eyebrow text above the excerpt. */
const LABEL_MAX = 24

/** Cuts on a word boundary so an excerpt never ends mid-word. */
function clamp(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[,;:.\s]+$/, '')}…`
}

export type Excerpt = { label?: string; text: string }

/**
 * Headings that introduce the *choice* rather than the context.
 *
 * `summary` already states the problem and the outcome, so leading the excerpt
 * with the body's opening "The problem" section restates it at four times the
 * length — and, since every write-up opens the same way, prints the same label
 * on every card. The reasoning is what a hiring manager is actually assessing,
 * so a decision-shaped section wins when the body has one.
 */
const DECISION_HEADING = /decision|why|approach|how |trade[- ]?off|constraint/i

/**
 * The one supporting passage a case study gets: the paragraph explaining the
 * decision, with its section heading as a label when that heading is short
 * enough to read as one.
 *
 * One paragraph, not three. The bodies are written as full write-ups — problem,
 * decision, audience, build — and reprinting all of that turns a scannable list
 * into an article. The detail page carries the rest.
 */
function firstPassage(body: string): Excerpt | null {
  if (!body.trim()) return null

  // `heading` keeps the raw section title for matching; `label` is the version
  // that renders, and is dropped when the title is too long to read as one.
  const passages: (Excerpt & { heading?: string })[] = []

  for (const block of body.split(/\n(?=#{1,6}\s)/)) {
    const trimmed = block.trim()
    if (!trimmed) continue

    // `[^\n]+` rather than a lazy `.+?`: the heading is the whole first line,
    // and a lazy group would happily capture its first character and hand the
    // rest to the body.
    const headed = /^#{1,6}[ \t]+([^\n]+)\n?([\s\S]*)$/.exec(trimmed)
    const rawLabel = headed ? stripMarkdown(headed[1]) : undefined
    const rest = headed ? headed[2] : trimmed

    const paragraph = rest.trim().split(/\n{2,}/)[0] ?? ''
    const text = stripMarkdown(paragraph)
    if (!text) continue

    passages.push({
      heading: rawLabel,
      // A heading long enough to be a sentence ("Why citations were the binding
      // constraint") is dropped rather than set as a paragraph of eyebrow text.
      label: rawLabel && rawLabel.length <= LABEL_MAX ? rawLabel : undefined,
      text: clamp(text, EXCERPT_MAX),
    })
  }

  if (passages.length === 0) return null

  const decision = passages.find(
    (passage) => passage.heading !== undefined && DECISION_HEADING.test(passage.heading),
  )
  return decision ?? passages[0]
}

/**
 * One project, read as a product case study.
 *
 * The reading order is the argument: what the problem was and what came of it
 * (`summary`), then the decision that made it interesting (the body excerpt),
 * then the stack, then the links. Featured work gets the cover, a larger title
 * and the excerpt; the rest stays a single dense row, because a portfolio that
 * gives its fourth-best project the same space as its best is not making a case.
 */
function ProjectEntry({
  item,
  index,
  showFeatured,
}: {
  item: Project
  index: number
  showFeatured: boolean
}) {
  const excerpt = item.featured ? firstPassage(item.body) : null
  const hasLinks = Boolean(item.repo || item.demo)

  return (
    <Card className="h-full">
      <div className={item.cover && item.featured ? 'grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]' : ''}>
        {item.cover && item.featured ? (
          <div className="overflow-hidden rounded-t-xl border-b border-[var(--hairline)] md:rounded-tr-none md:rounded-bl-xl md:border-r md:border-b-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.cover}
              alt={item.coverAlt || `Cover image for ${item.title}`}
              className="aspect-[16/10] h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : null}

        <div className={item.featured ? 'p-6 sm:p-8' : 'p-5 sm:p-6'}>
          <div className="flex items-baseline gap-3">
            {/* Numbers the row for the eye only — kept out of the accessibility
                tree so a screen reader is not read "01" before every title. */}
            <span
              aria-hidden="true"
              data-testid="project-index"
              className="tabular font-mono text-[11px] text-[var(--subtle)]"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <p className="eyebrow">
              {formatDate(item.date)}
              {item.featured && showFeatured ? (
                <span className="text-[var(--accent-readable)]"> · Featured</span>
              ) : null}
            </p>
          </div>

          <h3
            className={`mt-2 font-semibold tracking-tight text-[var(--foreground)] ${
              item.featured ? 'text-xl sm:text-[1.375rem]' : 'text-lg'
            }`}
          >
            {item.title}
          </h3>

          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
            {item.summary}
          </p>

          {excerpt ? (
            <div className="mt-4 border-l border-[var(--hairline)] pl-4">
              {excerpt.label ? <p className="eyebrow mb-1.5">{excerpt.label}</p> : null}
              <p className="max-w-2xl text-[13.5px] leading-relaxed text-[var(--muted)]">
                {excerpt.text}
              </p>
            </div>
          ) : null}

          {item.tech.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {item.tech.map((tech) => (
                <li key={tech}>
                  <Tag>{tech}</Tag>
                </li>
              ))}
            </ul>
          ) : null}

          {hasLinks ? (
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--hairline)] pt-4">
              {item.repo ? (
                <a
                  href={item.repo}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`${LINK} text-[var(--accent-readable)]`}
                >
                  Source code
                  <span className="sr-only"> — {item.title}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
              {item.demo ? (
                <a
                  href={item.demo}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`${LINK} text-[var(--muted)] hover:text-[var(--foreground)]`}
                >
                  Live demo
                  <span className="sr-only"> — {item.title}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

/**
 * Projects, as case studies rather than a gallery.
 *
 * Returns `null` for an empty list so an emptied collection omits the section
 * rather than shipping a bare heading.
 */
export function Projects({ items }: { items: Project[] }) {
  if (items.length === 0) return null

  // "Featured" only means something when something else is not. On an all-
  // featured list the badge is noise on every row, so it is dropped entirely.
  const showFeatured = items.some((item) => !item.featured)

  return (
    <SectionShell
      id="projects"
      eyebrow="Selected work"
      title="Projects"
      subtitle="The problem, the decision that shaped the build, and what came out of it."
    >
      <ul className="flex flex-col gap-4">
        {items.map((item, i) => (
          <li key={item.slug || item.title}>
            <Reveal delay={i * 0.05} className="h-full">
              <ProjectEntry item={item} index={i} showFeatured={showFeatured} />
            </Reveal>
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}

export default Projects
