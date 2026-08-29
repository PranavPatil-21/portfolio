import { SectionShell } from '@/components/ui/SectionShell'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'
import { formatDate } from './Experience'
import type { Project } from '@/content/schemas'

/**
 * Tilt-on-hover, expressed entirely in CSS transforms so it costs no JavaScript
 * and no layout — the card only ever moves on the compositor.
 *
 * The `motion-reduce:` pair is not redundant. `hover:` adds a pseudo-class to
 * the selector, so a bare `motion-reduce:transform-none` loses the specificity
 * contest against `hover:[transform:...]` and the tilt would still fire for
 * users who asked for no motion.
 */
const TILT =
  'transition-transform duration-500 ease-out will-change-transform ' +
  'hover:[transform:perspective(900px)_rotateX(4deg)_rotateY(-5deg)_translateY(-6px)] ' +
  'focus-within:[transform:perspective(900px)_translateY(-6px)] ' +
  'motion-reduce:transition-none motion-reduce:hover:transform-none ' +
  'motion-reduce:focus-within:transform-none'

/**
 * Projects as a card grid. Only `summary` is shown — the markdown `body` is
 * rendered by the article/detail pipeline, not on a card.
 */
export function Projects({ items }: { items: Project[] }) {
  if (items.length === 0) return null

  return (
    <SectionShell
      id="projects"
      title="Projects"
      subtitle="Things I built because the problem was interesting."
    >
      <ul className="grid gap-6 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={item.slug || item.title} className={TILT}>
            <Reveal delay={i * 0.06} className="h-full">
              <Card className="flex h-full flex-col">
                {item.cover ? (
                  <div className="-mx-6 -mt-6 mb-5 overflow-hidden border-b border-hairline">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.cover}
                      alt={item.coverAlt || `Cover image for ${item.title}`}
                      className="aspect-[16/9] w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : null}

                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--accent-readable)]">
                  {formatDate(item.date)}
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.summary}</p>

                {item.tech.length > 0 ? (
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {item.tech.map((tech) => (
                      <li key={tech}>
                        <Tag>{tech}</Tag>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {item.repo || item.demo ? (
                  <div className="mt-6 flex flex-wrap gap-4 border-t border-hairline pt-4 text-sm font-medium">
                    {item.repo ? (
                      <a
                        href={item.repo}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="rounded text-[color:var(--accent-readable)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
                      >
                        Source code
                        <span className="sr-only"> — {item.title}</span>
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    ) : null}
                    {item.demo ? (
                      <a
                        href={item.demo}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="rounded text-[color:var(--foreground)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
                      >
                        Live demo
                        <span className="sr-only"> — {item.title}</span>
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            </Reveal>
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}

export default Projects
