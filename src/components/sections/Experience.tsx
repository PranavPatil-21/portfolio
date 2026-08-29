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
 * The vertical rail that Experience, Education and Responsibilities hang off.
 * Kept here rather than in a shared module so the three timeline sections share
 * one definition without adding a file another task owns.
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

/** A bulleted body shared by Experience and Responsibilities. */
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

/**
 * Professional history as a timeline. Returns `null` for an empty list so an
 * emptied collection omits the section rather than shipping a bare heading
 * (design spec §8, "Error handling").
 */
export function Experience({ items }: { items: ExperienceItem[] }) {
  if (items.length === 0) return null

  return (
    <SectionShell
      id="experience"
      title="Experience"
      subtitle="Where I have worked and what I shipped there."
    >
      <Timeline>
        {items.map((item, i) => (
          <TimelineItem
            key={item.slug || `${item.company}-${item.start}`}
            heading={item.role}
            subheading={item.company}
            meta={item.location || undefined}
            period={formatRange(item.start, item.end, item.current)}
            delay={i * 0.06}
          >
            <TimelineBullets bullets={item.bullets} />
            {item.tech.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {item.tech.map((tech) => (
                  <li key={tech}>
                    <Tag>{tech}</Tag>
                  </li>
                ))}
              </ul>
            ) : null}
          </TimelineItem>
        ))}
      </Timeline>
    </SectionShell>
  )
}

export default Experience
