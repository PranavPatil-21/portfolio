import { Fragment } from 'react'

import type { Experience, Settings } from '@/content'
import { SectionShell } from '@/components/ui/SectionShell'
import { Tag } from '@/components/ui/Tag'

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
 * String-based rather than `new Date(...)` on purpose: `new Date('2024-09')` is
 * parsed as UTC midnight and then formatted in the local zone, so west of
 * Greenwich it renders as August. Splitting the string keeps the output
 * identical on a laptop in Gurugram and on a build machine in Virginia.
 *
 * Deliberately a local copy rather than an import from `Experience.tsx`: this
 * section must not break if the timeline's formatting is retuned.
 */
function formatDate(value: string): string {
  const [year, month] = value.split('-')
  if (!month) return year
  const name = MONTHS[Number(month) - 1]
  return name ? `${name} ${year}` : year
}

/** `start — end`, where an absent or current end reads as "Present". */
function formatRange(start: string, end?: string, current = false): string {
  return `${formatDate(start)} — ${current || !end ? 'Present' : formatDate(end)}`
}

/**
 * The featured current role.
 *
 * The brief behind this section is "emphasize my current experience", so it is
 * not a timeline row with a heavier border. The bullets are the whole point —
 * they are the outcome statements, the only place on the page that says what
 * changed because of the work — so they get list-level scanability, a
 * measurable-figure highlight, and none of the compression a timeline forces.
 *
 * A hiring manager who reads exactly two things on this site reads the
 * positioning line in the hero and this list.
 */
export default function CurrentRole({
  role,
  settings,
}: {
  role?: Experience | null
  settings: Settings
}) {
  // Ordered before anything else touches `role`: `SectionShell` requires a
  // title, and a site with no current role should render no section at all
  // rather than an empty frame with a heading.
  if (!role) return null

  const period = formatRange(role.start, role.end, role.current)

  return (
    // The company is the `<h2>` and the job title the `<h3>` beneath it — a
    // deliberate ordering, not the incidental one. `SectionShell` points
    // `aria-labelledby` at the title, so a screen-reader user navigating by
    // heading hears "Current role · Wio Bank PJSC" then "Software Engineer";
    // the employer is the credential a recruiter is scanning for, and the
    // eyebrow has already said which role this is.
    <SectionShell
      id="current"
      eyebrow="Current role"
      title={role.company}
      subtitle="What I'm building right now, and what changed because of it."
      action={
        <a
          href={`mailto:${settings.email}`}
          className="text-sm text-[var(--accent-readable)] underline-offset-4 transition-opacity hover:underline hover:opacity-80 motion-reduce:transition-none"
        >
          Talk about this work →
        </a>
      }
    >
      <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-6 md:p-8">
        <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-[var(--hairline)] pb-5">
          <h3 className="text-lg font-semibold text-[var(--foreground)] md:text-xl">
            {role.role}
          </h3>
          <p className="tabular font-mono text-xs text-[var(--subtle)]">
            {period}
            {role.location ? `  ·  ${role.location}` : ''}
          </p>
        </header>

        {role.bullets.length ? (
          <ul className="mt-6 flex flex-col gap-4">
            {role.bullets.map((bullet, i) => (
              <li
                key={i}
                data-bullet=""
                className="relative pl-6 text-[15px] leading-relaxed text-[var(--muted)]"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-[0.6em] left-0 size-1.5 rounded-full bg-[var(--accent-readable)]"
                />
                <Emphasised text={bullet} />
              </li>
            ))}
          </ul>
        ) : null}

        {role.tech.length ? (
          <div className="mt-7 flex flex-wrap gap-1.5 border-t border-[var(--hairline)] pt-5">
            {role.tech.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </div>
        ) : null}
      </div>
    </SectionShell>
  )
}

/**
 * Renders `*emphasis*` as an accent-coloured span with the markers stripped.
 *
 * The split keeps the delimiters out of the result by construction, so there is
 * no second pass that could leave a stray asterisk behind. An *unpaired*
 * asterisk simply never matches, and its text survives verbatim in an even
 * index — losing the rest of a sentence to a greedy parse is a much worse
 * outcome than one stray glyph, and a CMS author will eventually type one.
 */
function Emphasised({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/g)

  return (
    <>
      {parts.map((part, i) =>
        // `String.split` with one capture group alternates: even indices are
        // the surrounding text, odd indices are what the group matched.
        i % 2 === 1 ? (
          <span key={i} className="font-medium text-[var(--accent-readable)]">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}
