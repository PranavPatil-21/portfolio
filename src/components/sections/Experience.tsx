import type { ReactNode } from 'react'
import { SectionShell } from '@/components/ui/SectionShell'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'
import type { Experience as ExperienceItem } from '@/content/schemas'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/**
 * Formats a `YYYY`, `YYYY-MM` or `YYYY-MM-DD` content date for display.
 *
 * Deliberately string-based rather than `new Date(...)`: `new Date('2024-09')`
 * is parsed as UTC midnight and then formatted in the local zone, so west of
 * Greenwich it renders as August. Splitting the string keeps the output
 * identical on a laptop in Gurugram and on a build machine in Virginia.
 */
export function formatDate(value: string): string {
  const [year, month] = value.split('-')
  if (!month) return year
  const name = MONTHS[Number(month) - 1]
  return name ? `${name} ${year}` : year
}

/** `start — end`, where an absent or current end reads as "Present". */
export function formatRange(start: string, end?: string, current = false): string {
  const to = current || !end ? 'Present' : formatDate(end)
  return `${formatDate(start)} — ${to}`
}

/**
 * The vertical rail primitive.
 *
 * Kept here — and kept exactly as it was — because other section files import
 * it from this module. Experience itself no longer uses it: the section below
 * renders a denser two-column row instead.
 */
export function Timeline({ children }: { children: ReactNode }) {
  return <ol className="relative ml-1 space-y-0 border-l border-hairline">{children}</ol>
}

/** One row on the rail: an accent node, a period, a heading block and a body. */
export function TimelineItem({
  heading,
  subheading,
  meta,
  period,
  delay = 0,
  children,
}: {
  heading: string
  subheading: string
  meta?: string
  period: string
  delay?: number
  children?: ReactNode
}) {
  return (
    <li className="relative pb-12 pl-8 last:pb-0 sm:pl-10">
      <span
        aria-hidden="true"
        className="absolute left-0 top-2 h-3 w-3 -translate-x-1/2 rounded-full border border-[color:var(--accent)] bg-[color:var(--background)]"
      />
      <Reveal delay={delay}>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--accent-readable)]">
          {period}
        </p>
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--foreground)] sm:text-xl">
          {heading}
        </h3>
        <p className="mt-1 text-sm text-muted">
          <span className="font-medium">{subheading}</span>
          {meta ? <span> · {meta}</span> : null}
        </p>
        {children}
      </Reveal>
    </li>
  )
}

/** A bulleted body shared by Education and Responsibilities. */
export function TimelineBullets({ bullets }: { bullets: string[] }) {
  if (bullets.length === 0) return null
  return (
    <ul className="mt-4 space-y-2">
      {bullets.map((bullet) => (
        <li
          key={bullet}
          className="relative pl-5 text-sm leading-relaxed text-muted before:absolute before:left-0 before:top-[0.6em] before:h-1 before:w-1 before:rounded-full before:bg-[color:var(--accent)]"
        >
          {bullet}
        </li>
      ))}
    </ul>
  )
}

export type EmphasisSegment = { text: string; emphasis: boolean }

/**
 * Splits copy on `*asterisk*` spans so the emphasised part can be coloured.
 *
 * This exists so the owner can type the number that matters — `*40% across 800K
 * daily events*` — in a plain CMS text field and have it read as the loudest
 * thing in the bullet, without learning markdown or waiting on a code change.
 *
 * Segment-based rather than word-based on purpose: an outcome-led bullet
 * emphasises a *phrase* ("cut settlement latency 40%"), and splitting on spaces
 * first would break the phrase into separate runs and lose it.
 */
export function parseEmphasis(text: string): EmphasisSegment[] {
  return text
    .split(/(\*[^*]+\*)/g)
    .filter((part) => part !== '')
    .map((part) =>
      /^\*[^*]+\*$/.test(part)
        ? { text: part.slice(1, -1), emphasis: true }
        : { text: part, emphasis: false },
    )
}

/** Renders `parseEmphasis` output, accent-colouring the emphasised runs. */
function Emphasised({ text }: { text: string }) {
  return (
    <>
      {parseEmphasis(text).map((segment, i) =>
        segment.emphasis ? (
          <span key={i} className="font-medium text-[var(--accent-readable)]">
            {segment.text}
          </span>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </>
  )
}

/**
 * Professional history, compact.
 *
 * The current role is argued in full elsewhere on the page, so this section is
 * the supporting record: a two-column row per role — dates parked in a narrow
 * left rail, everything that varies in a single readable column — so a reader
 * can run their eye down the timeline and down the outcomes independently
 * without either competing for the same horizontal space.
 *
 * Returns `null` for an empty list so an emptied collection omits the section
 * rather than shipping a bare heading.
 */
export function Experience({ items }: { items: ExperienceItem[] }) {
  if (items.length === 0) return null

  return (
    <SectionShell
      id="experience"
      eyebrow="Track record"
      title="Experience"
      subtitle="Roles held, and what measurably changed while I held them."
    >
      <ol className="flex flex-col">
        {items.map((item, i) => (
          <li
            key={item.slug || `${item.company}-${item.start}`}
            className="border-t border-[var(--hairline)] py-8 first:border-t-0 first:pt-0"
          >
            <Reveal delay={i * 0.05}>
              <div className="grid gap-x-8 gap-y-3 md:grid-cols-[9rem_minmax(0,1fr)]">
                <p className="tabular pt-0.5 font-mono text-[11px] leading-relaxed tracking-[0.08em] text-[var(--subtle)] uppercase">
                  {formatRange(item.start, item.end, item.current)}
                </p>

                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
                    {item.company}
                  </h3>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">
                    <span className="font-medium text-[var(--foreground)]">{item.role}</span>
                    {item.location ? <span> · {item.location}</span> : null}
                  </p>

                  {item.bullets.length > 0 ? (
                    <ul className="mt-4 space-y-2.5">
                      {item.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="relative pl-5 text-[14.5px] leading-relaxed text-[var(--muted)] before:absolute before:top-[0.7em] before:left-0 before:h-px before:w-2.5 before:bg-[var(--accent)]"
                        >
                          <Emphasised text={bullet} />
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {item.tech.length > 0 ? (
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {item.tech.map((tech) => (
                        <li key={tech}>
                          <Tag>{tech}</Tag>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </SectionShell>
  )
}

export default Experience
