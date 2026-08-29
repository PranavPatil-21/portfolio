import type { ReactNode } from 'react'
import { SectionShell } from '@/components/ui/SectionShell'
import { Reveal } from '@/components/ui/Reveal'
import type { Education as EducationItem } from '@/content/schemas'

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
 *
 * Education and Responsibilities own this copy rather than importing Experience's
 * so the two credential sections can carry their own quieter typography without
 * being coupled to the headline timeline's markup.
 */
export function formatDate(value: string): string {
  const [year, month] = value.split('-')
  if (!month) return year
  const name = MONTHS[Number(month) - 1]
  return name ? `${name} ${year}` : year
}

/**
 * `start — end`, where an absent end reads as "Present".
 *
 * Emitted as one string, never as two spans with a separator between them, so
 * the range stays a single selectable, copyable, findable text node.
 */
export function formatRange(start: string, end?: string): string {
  return `${formatDate(start)} — ${end ? formatDate(end) : 'Present'}`
}

/**
 * The rail Education and Responsibilities share.
 *
 * These are supporting evidence, not headline material, so the treatment is
 * deliberately quiet: hairline rules, a mono date in its own column, and no
 * card surfaces competing with Experience or Projects for attention. A reader
 * skimming for thirty seconds should be able to take this in without stopping.
 */
export function CredentialList({ children }: { children: ReactNode }) {
  return (
    <ol className="list-none divide-y divide-[var(--hairline)] border-y border-[var(--hairline)] p-0">
      {children}
    </ol>
  )
}

/** One credential: a mono period beside a heading block and its quiet body. */
export function CredentialRow({
  period,
  heading,
  subheading,
  meta,
  bullets,
  delay = 0,
}: {
  period: string
  heading: string
  subheading: string
  meta?: string
  bullets: string[]
  delay?: number
}) {
  return (
    <li>
      <Reveal delay={delay}>
        <div className="grid gap-2 py-6 md:grid-cols-[10rem_1fr] md:gap-8">
          <p className="eyebrow tabular md:pt-1">{period}</p>

          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
              {heading}
            </h3>

            <p className="mt-1 text-sm text-[var(--muted)]">
              <span>{subheading}</span>
              {meta ? <span className="text-[var(--subtle)]"> · {meta}</span> : null}
            </p>

            {bullets.length > 0 ? (
              <ul className="mt-3 list-none space-y-1.5 p-0">
                {bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="relative pl-4 text-sm leading-relaxed text-[var(--muted)] before:absolute before:top-[0.7em] before:left-0 before:h-px before:w-2 before:bg-[var(--accent)]"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </Reveal>
    </li>
  )
}

/**
 * Academic history. An absent `end` is what signals an in-progress course —
 * there is no `current` flag on this schema, unlike Experience.
 */
export function Education({ items }: { items: EducationItem[] }) {
  if (items.length === 0) return null

  return (
    <SectionShell
      id="education"
      eyebrow="Background"
      title="Education"
      subtitle="The grounding underneath the work."
    >
      <CredentialList>
        {items.map((item, i) => (
          <CredentialRow
            key={item.slug || `${item.institution}-${item.start}`}
            period={formatRange(item.start, item.end)}
            heading={item.institution}
            subheading={item.degree}
            meta={item.location || undefined}
            bullets={item.details}
            delay={i * 0.05}
          />
        ))}
      </CredentialList>
    </SectionShell>
  )
}

export default Education
