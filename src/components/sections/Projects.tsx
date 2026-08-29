import { SectionShell } from '@/components/ui/SectionShell'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'
import { formatDate } from './Experience'
import type { Project } from '@/content/schemas'

/**
 * Hover treatment, expressed entirely in CSS transforms so it costs no
 * JavaScript and no layout — the card only ever moves on the compositor.
 *
 * The `motion-reduce:` pair is not redundant. `hover:` adds a pseudo-class to
 * the selector, so a bare `motion-reduce:transform-none` loses the specificity
 * contest against `hover:[transform:...]` and the lift would still fire for
 * users who asked for no motion.
 */
const LIFT =
  'transition-transform duration-500 ease-out will-change-transform ' +
  'hover:[transform:translateY(-6px)] ' +
  'focus-within:[transform:translateY(-6px)] ' +
  'motion-reduce:transition-none motion-reduce:hover:transform-none ' +
  'motion-reduce:focus-within:transform-none'

const LINK =
  'inline-flex items-center gap-1.5 rounded font-mono text-[10px] tracking-[0.25em] uppercase ' +
  'underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-[var(--accent)]'

/**
 * Projects as full-width editorial rows.
 *
 * One per row on desktop rather than a grid: each project gets the width to
 * state what it *did* before what it was made of, and an oversized index number
 * gives the eye somewhere to land while scanning. Only `summary` is shown — the
 * markdown `body` belongs to the detail pipeline, not to a card.
 */
export function Projects({ items }: { items: Project[] }) {
  if (items.length === 0) return null

  return (
    <SectionShell
      id="projects"
      eyebrow="Selected"
      title="Projects"
      index="03 / PROJECTS"
      subtitle="Problems I chose to solve, and what came out of solving them."
    >
      <ul className="flex flex-col gap-8">
        {items.map((item, i) => (
          <li key={item.slug || item.title} className={LIFT}>
            <Reveal delay={i * 0.06} className="h-full">
              <Card className="group h-full overflow-hidden">
                <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
                  {item.cover ? (
                    <div className="overflow-hidden border-b border-[var(--hairline)] md:border-r md:border-b-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.cover}
                        alt={item.coverAlt || `Cover image for ${item.title}`}
                        className="aspect-[16/10] h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-col p-7 sm:p-9 md:p-11">
                    <div className="flex items-start justify-between gap-6">
                      <p className="font-mono text-[10px] tracking-[0.35em] text-[var(--foreground)]/55 uppercase">
                        {formatDate(item.date)}
                        {item.featured ? (
                          <span className="text-[var(--accent-readable)]"> · Featured</span>
                        ) : null}
                      </p>

                      {/* Decorative counter — it numbers the row for the eye, and
                          is deliberately kept out of the accessibility tree so a
                          screen reader is not read "01" before every title. */}
                      <span
                        aria-hidden="true"
                        data-testid="project-index"
                        className="tabular -mt-2 font-mono text-4xl leading-none font-black tracking-tighter text-[var(--foreground)]/10 transition-colors duration-500 group-hover:text-[var(--accent-readable)]/40 motion-reduce:transition-none sm:text-5xl"
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <h3 className="mt-5 text-2xl leading-[1.05] font-black tracking-tighter text-[var(--foreground)] sm:text-3xl md:text-4xl">
                      {item.title}
                    </h3>

                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--foreground)]/60">
                      {item.summary}
                    </p>

                    {item.tech.length > 0 ? (
                      <ul className="mt-7 flex flex-wrap gap-2">
                        {item.tech.map((tech) => (
                          <li key={tech}>
                            <Tag>{tech}</Tag>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {item.repo || item.demo ? (
                      <div className="mt-8 flex flex-wrap gap-6 border-t border-[var(--hairline)] pt-6">
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
                            className={`${LINK} text-[var(--foreground)]/60 hover:text-[var(--foreground)]`}
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
            </Reveal>
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}

export default Projects
