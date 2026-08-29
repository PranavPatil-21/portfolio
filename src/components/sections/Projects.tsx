'use client'

import { useMemo, useState } from 'react'
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

type Category = Project['category']
type Filter = 'all' | Category

const CATEGORY_LABEL: Record<Category, string> = {
  ai: 'AI',
  systems: 'Systems',
  product: 'Product',
}

/**
 * The filter's tabs, in a fixed order.
 *
 * Deliberately not derived from the data: the order is an editorial claim —
 * AI first, because that is the role being applied for — and a derived list
 * would reshuffle itself the moment a category emptied out.
 */
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ai', label: 'AI' },
  { id: 'systems', label: 'Systems' },
  { id: 'product', label: 'Product' },
]

/** Featured work leads, then the owner's explicit `order`. */
function byWeight(a: Project, b: Project): number {
  return Number(b.featured) - Number(a.featured) || a.order - b.order
}

/**
 * The supporting line under the summary: the *decision*.
 *
 * `decision` is a first-class field now, so it wins outright when set. The body
 * excerpt stays as the fallback for entries written before the field existed —
 * older write-ups carry the same reasoning inside a "The decision" section, and
 * silently dropping it would make those cards thinner than they need to be.
 */
function decisionOf(item: Project): Excerpt | null {
  if (item.decision?.trim()) return { label: 'Decision', text: item.decision.trim() }
  return firstPassage(item.body)
}

/**
 * The impact figures for one piece of work, as a strip of tiles.
 *
 * A description list rather than a grid of divs: each figure genuinely is a
 * term and its definition, and the pairing is what makes "42%" mean anything.
 * DOM order is label-then-value with `flex-col-reverse` doing the visual swap,
 * so the reading order stays correct while the number reads first.
 */
function MetricStrip({ item }: { item: Project }) {
  return (
    <dl
      data-testid={`project-metrics-${item.slug || item.title}`}
      className="mt-5 grid gap-px overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--hairline)] sm:grid-cols-2"
    >
      {item.metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex flex-col-reverse gap-1.5 bg-[var(--background)] px-4 py-3.5"
        >
          <dd className="tabular font-mono text-[clamp(1.375rem,2.6vw,1.75rem)] leading-none font-semibold tracking-tight text-[var(--accent-readable)]">
            {metric.value}
          </dd>
          <dt className="eyebrow tracking-[0.1em]">{metric.label}</dt>
        </div>
      ))}
    </dl>
  )
}

/**
 * One project, read as a product case study.
 *
 * The reading order is the argument: who this was for and what came of it
 * (`context` + `summary`), then the figures that prove it, then the decision
 * that made it interesting, then the stack, then the way in. Featured work
 * gets the cover, a larger title and the decision line; the rest stays a denser
 * row, because a portfolio that gives its fourth-best project the same space as
 * its best is not making a case.
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
  const excerpt = item.featured ? decisionOf(item) : null
  const hasLinks = Boolean(item.repo || item.demo || item.slug)
  const key = item.slug || item.title

  return (
    <Card className="group relative h-full overflow-hidden">
      {/* A hairline of accent along the top edge, brightening on hover. Purely
          decorative weight for the entries that earned it. */}
      {item.featured ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[var(--accent)] via-[color-mix(in_oklab,var(--accent)_40%,transparent)] to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
        />
      ) : null}

      <div
        className={
          item.cover && item.featured
            ? 'grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]'
            : ''
        }
      >
        {item.cover && item.featured ? (
          <div className="overflow-hidden rounded-t-xl border-b border-[var(--hairline)] md:rounded-tr-none md:rounded-bl-xl md:border-r md:border-b-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.cover}
              alt={item.coverAlt || `Cover image for ${item.title}`}
              className="aspect-[16/10] h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : null}

        <div className={item.featured ? 'p-6 sm:p-8' : 'p-5 sm:p-6'}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {/* Numbers the row for the eye only — kept out of the accessibility
                tree so a screen reader is not read "01" before every title. */}
            <span
              aria-hidden="true"
              data-testid="project-index"
              className="tabular font-mono text-[11px] text-[var(--subtle)]"
            >
              {String(index + 1).padStart(2, '0')}
            </span>

            <span
              data-testid={`project-category-${key}`}
              className="rounded-full border border-[color-mix(in_oklab,var(--accent)_35%,transparent)] bg-[var(--accent-soft)] px-2.5 py-0.5 font-mono text-[10px] tracking-[0.14em] text-[var(--accent-readable)] uppercase"
            >
              {CATEGORY_LABEL[item.category]}
            </span>

            <p className="eyebrow">
              {formatDate(item.date)}
              {item.featured && showFeatured ? (
                <span className="text-[var(--accent-readable)]"> · Featured</span>
              ) : null}
            </p>
          </div>

          <h3
            className={`mt-3 font-semibold tracking-tight text-[var(--foreground)] transition-colors duration-300 group-hover:text-[var(--accent-readable)] motion-reduce:transition-none ${
              item.featured ? 'text-xl sm:text-[1.375rem]' : 'text-lg'
            }`}
          >
            {item.title}
          </h3>

          {item.context || item.role ? (
            <p className="mt-1.5 text-[13px] text-[var(--subtle)]">
              {[item.context, item.role].filter(Boolean).join(' · ')}
            </p>
          ) : null}

          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
            {item.summary}
          </p>

          {item.metrics.length > 0 ? <MetricStrip item={item} /> : null}

          {excerpt ? (
            <div className="mt-5 border-l-2 border-[color-mix(in_oklab,var(--accent)_30%,transparent)] pl-4">
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
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--hairline)] pt-4">
              {/* The card is not itself a link: it already contains two, and
                  nesting interactive content inside an anchor is invalid and
                  unusable by keyboard. The affordance is discrete instead. */}
              {item.slug ? (
                <a href={`/work/${item.slug}`} className={`${LINK} text-[var(--accent-readable)]`}>
                  Read case study
                  {/* Nine cards would otherwise expose nine links all named
                      "Read case study" to a screen reader's link list. */}
                  <span className="sr-only"> — {item.title}</span>
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    →
                  </span>
                </a>
              ) : null}
              {item.repo ? (
                <a
                  href={item.repo}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`${LINK} text-[var(--muted)] hover:text-[var(--foreground)]`}
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
 * Projects, as a filterable case-study index.
 *
 * ## Why the filter is safe without JavaScript
 *
 * The filter is a client-side `useState` over props already in the tree — it
 * never refetches and never navigates. Its initial state is `'all'`, so the
 * server-rendered HTML contains *every* case study. With JavaScript off the
 * buttons are inert but nothing is hidden: filtering is an enhancement laid on
 * top of a complete document, not a gate in front of one.
 *
 * Returns `null` for an empty list so an emptied collection omits the section
 * rather than shipping a bare heading.
 */
export function Projects({ items }: { items: Project[] }) {
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo(() => {
    const tally: Record<Filter, number> = { all: items.length, ai: 0, systems: 0, product: 0 }
    for (const item of items) tally[item.category] += 1
    return tally
  }, [items])

  const visible = useMemo(
    () =>
      items.filter((item) => filter === 'all' || item.category === filter).sort(byWeight),
    [items, filter],
  )

  if (items.length === 0) return null

  // "Featured" only means something when something else is not. Measured across
  // the *whole* list, not the filtered view — otherwise narrowing to a category
  // where everything happens to be featured would drop the badge mid-interaction.
  const showFeatured = items.some((item) => !item.featured)

  return (
    <SectionShell
      id="projects"
      eyebrow="Selected work"
      title="Projects"
      subtitle="The problem, the decision that shaped the build, and what came out of it."
    >
      <div className="mb-8">
        <div
          role="group"
          aria-label="Filter case studies by category"
          className="flex flex-wrap gap-2"
        >
          {FILTERS.map(({ id, label }) => {
            const active = filter === id
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(id)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200 motion-reduce:transition-none ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                    : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--muted)] hover:border-[color-mix(in_oklab,var(--accent)_45%,transparent)] hover:text-[var(--foreground)]'
                }`}
              >
                {label}{' '}
                <span
                  data-testid={`filter-count-${id}`}
                  className={`tabular font-mono text-[11px] ${
                    active ? 'opacity-80' : 'text-[var(--subtle)]'
                  }`}
                >
                  {counts[id]}
                </span>
              </button>
            )
          })}
        </div>

        {/* One region, always mounted, with only its text swapping — a live
            region that mounts at the moment it has something to say is
            frequently missed by screen readers. The empty state lives in here
            too, so "nothing in this category" is announced, not merely drawn. */}
        <p role="status" className="mt-4 text-[13px] text-[var(--subtle)]">
          {visible.length === 0
            ? 'No case studies in this category yet — try another filter.'
            : `Showing ${visible.length} of ${items.length} case ${
                items.length === 1 ? 'study' : 'studies'
              }`}
        </p>
      </div>

      {visible.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {visible.map((item, i) => (
            <li key={item.slug || item.title}>
              <Reveal delay={i * 0.05} className="h-full">
                <ProjectEntry item={item} index={i} showFeatured={showFeatured} />
              </Reveal>
            </li>
          ))}
        </ul>
      ) : null}
    </SectionShell>
  )
}

export default Projects
