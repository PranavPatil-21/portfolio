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
 * The vertical rail that Education and Responsibilities hang off.
 *
 * Kept here — and kept exactly as it was — because those two sections import it
 * from this module. Experience itself has outgrown the shared rail and renders
 * its own treatment below; this pair stays as the quieter primitive for the
 * supporting sections, which should not compete with it.
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
 * first would break the phrase into separately-animated words and lose the run.
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
          <span
            key={i}
            className="font-medium text-[var(--accent-readable)]"
          >
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
 * Professional history as a cinematic timeline.
 *
 * The hierarchy is the argument: the **company** is the largest element, the
 * date range is a quiet mono label beside it, the bullets carry the outcome,
 * and the stack is the smallest thing on the row. Reading top to bottom you get
 * *where*, *what changed*, and only then *how it was built* — which is the order
 * a reader assessing judgement cares about, and the reverse of a stack list.
 *
 * Returns `null` for an empty list so an emptied collection omits the section
 * rather than shipping a bare heading (design spec §8, "Error handling").
 */
export function Experience({ items }: { items: ExperienceItem[] }) {
  if (items.length === 0) return null

  return (
    <SectionShell
      id="experience"
      eyebrow="Professional"
      title="Experience"
      index="02 / EXPERIENCE"
      subtitle="Roles, and what measurably changed while I held them."
    >
      <ol className="flex flex-col">
        {items.map((item, i) => (
          <li
            key={item.slug || `${item.company}-${item.start}`}
            className="group relative border-t border-[var(--hairline)] py-10 transition-colors duration-500 first:border-t-0 hover:border-[color-mix(in_oklab,var(--accent)_45%,transparent)] motion-reduce:transition-none md:py-14"
          >
            {/* The accent rail wipes down on hover — pure transform, so it never
                touches layout, and it is stripped under reduced motion. */}
            <span
              aria-hidden="true"
              className="absolute top-0 bottom-0 left-0 w-px origin-top scale-y-0 bg-[var(--accent)] transition-transform duration-500 ease-out group-hover:scale-y-100 motion-reduce:transition-none motion-reduce:group-hover:scale-y-0"
            />

            <Reveal delay={i * 0.06}>
              <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-baseline">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.35em] text-[var(--foreground)]/55 uppercase">
                    <span>{item.role}</span>
                    {item.location ? (
                      <span className="text-[var(--foreground)]/55"> · {item.location}</span>
                    ) : null}
                  </p>
                  <h3 className="mt-3 text-3xl leading-[0.95] font-black tracking-tighter text-[var(--foreground)] transition-transform duration-500 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 sm:text-4xl md:text-5xl">
                    {item.company}
                  </h3>
                </div>

                <p className="tabular font-mono text-[11px] tracking-[0.2em] text-[var(--accent-readable)] uppercase md:text-right">
                  {formatRange(item.start, item.end, item.current)}
                </p>
              </div>

              {item.bullets.length > 0 ? (
                <ul className="mt-7 max-w-3xl space-y-3">
                  {item.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="relative pl-6 text-sm leading-relaxed text-[var(--foreground)]/60 before:absolute before:top-[0.65em] before:left-0 before:h-px before:w-3 before:bg-[var(--accent)]"
                    >
                      <Emphasised text={bullet} />
                    </li>
                  ))}
                </ul>
              ) : null}

              {item.tech.length > 0 ? (
                <ul className="mt-7 flex flex-wrap gap-2">
                  {item.tech.map((tech) => (
                    <li key={tech}>
                      <Tag>{tech}</Tag>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Reveal>
          </li>
        ))}
      </ol>
    </SectionShell>
  )
}

export default Experience
