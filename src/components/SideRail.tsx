'use client'

import { useEffect, useState } from 'react'
import type { LayoutEntry, Settings } from '@/content'
import Magnetic from '@/components/ui/Magnetic'

const LABELS: Record<string, string> = {
  current: 'Current role',
  metrics: 'Impact',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  articles: 'Writing',
  education: 'Education',
  responsibilities: 'Leadership',
  contact: 'Contact',
}

/**
 * Splits `*emphasised*` runs out of a string so copy can carry its own accent
 * highlighting from the CMS. Markers are excluded by construction; an unpaired
 * asterisk stays literal rather than swallowing the rest of the sentence.
 */
export function parseEmphasis(text: string): { text: string; accent: boolean }[] {
  const parts: { text: string; accent: boolean }[] = []
  let last = 0
  for (const match of text.matchAll(/\*([^*]+)\*/g)) {
    const at = match.index ?? 0
    if (at > last) parts.push({ text: text.slice(last, at), accent: false })
    parts.push({ text: match[1], accent: true })
    last = at + match[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), accent: false })
  return parts
}

/**
 * The identity rail: who he is, and where you are in the page.
 *
 * Sticky on wide screens so the name, the positioning sentence and the résumé
 * button stay on screen for the whole read — a recruiter who decides to act
 * three sections down never has to scroll back to find how.
 *
 * The nav tracks scroll position with an `IntersectionObserver` rather than
 * scroll maths: it reports what is actually on screen, survives sections of
 * wildly different heights, and costs nothing per frame.
 */
export default function SideRail({
  settings,
  layout,
  emptyIds,
}: {
  settings: Settings
  layout: LayoutEntry[]
  emptyIds?: ReadonlySet<string>
}) {
  const { name, headline, bio, roles, location, email, resumePdf, socials } = settings
  const resumeHref = resumePdf?.trim() ? resumePdf : null

  const items = layout
    .filter((e) => e.visible && e.sectionId !== 'hero' && !emptyIds?.has(e.sectionId))
    .map((e) => ({ id: e.sectionId, label: LABELS[e.sectionId] ?? null }))
    .filter((i): i is { id: string; label: string } => i.label !== null)

  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || items.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Prefer whichever tracked section is nearest the top of the viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      // A band across the upper-middle of the viewport, so the highlight changes
      // when a section genuinely takes over rather than as it grazes the edge.
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    )

    for (const item of items) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.id).join(',')])

  const positioning = headline?.trim() ? headline : (bio.split(/(?<=\.)\s/)[0] ?? bio)

  return (
    <header className="lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:w-[46%] lg:flex-col lg:justify-between lg:py-24">
      <div>
        {location || roles[0] ? (
          <p className="eyebrow mb-5 flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="inline-block size-1.5 shrink-0 rounded-full bg-[var(--accent)]"
            />
            {[location, roles[0]].filter((p) => p?.trim()).join('  ·  ')}
          </p>
        ) : null}

        <h1 className="display text-[var(--foreground)]">{name}</h1>

        <p className="mt-5 max-w-md text-[17px] leading-[1.5] text-pretty text-[var(--foreground)] md:text-lg">
          {parseEmphasis(positioning).map((part, i) =>
            part.accent ? (
              <span key={i} className="text-[var(--accent-readable)]">
                {part.text}
              </span>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </p>

        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--muted)]">
          {parseEmphasis(bio).map((part, i) => (
            <span key={i}>{part.text}</span>
          ))}
        </p>

        {/* Desktop-only: on narrow screens the sections follow immediately and
            an in-page nav would just be a list the reader scrolls past. */}
        {items.length > 0 ? (
          <nav aria-label="Sections" className="mt-14 hidden lg:block">
            <ul className="space-y-1">
              {items.map((item) => {
                const isActive = active === item.id
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      aria-current={isActive ? 'true' : undefined}
                      className="group flex items-center gap-4 py-1.5"
                    >
                      <span
                        aria-hidden="true"
                        className={`h-px transition-all duration-300 motion-reduce:transition-none ${
                          isActive
                            ? 'w-14 bg-[var(--foreground)]'
                            : 'w-7 bg-[var(--subtle)] group-hover:w-14 group-hover:bg-[var(--foreground)]'
                        }`}
                      />
                      <span
                        className={`font-mono text-[11px] tracking-[0.14em] uppercase transition-colors duration-300 motion-reduce:transition-none ${
                          isActive
                            ? 'text-[var(--foreground)]'
                            : 'text-[var(--subtle)] group-hover:text-[var(--foreground)]'
                        }`}
                      >
                        {item.label}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        ) : null}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-4 lg:mt-0">
        <Magnetic>
          <a
            href={`mailto:${email}`}
            className="inline-block rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-contrast)] transition-opacity duration-200 hover:opacity-90 motion-reduce:transition-none"
          >
            Get in touch
          </a>
        </Magnetic>

        {resumeHref ? (
          <a
            href={resumeHref}
            className="rounded-lg border border-[var(--hairline)] px-5 py-2.5 text-sm font-medium transition-colors duration-200 hover:border-[var(--accent)] motion-reduce:transition-none"
          >
            Résumé
          </a>
        ) : null}

        <ul className="flex items-center gap-4">
          {socials.map((social) => (
            <li key={social.url}>
              <a
                href={social.url}
                rel="noreferrer noopener"
                target={social.url.startsWith('mailto:') ? undefined : '_blank'}
                className="font-mono text-[11px] tracking-[0.14em] text-[var(--subtle)] uppercase transition-colors duration-200 hover:text-[var(--foreground)] motion-reduce:transition-none"
              >
                {social.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
