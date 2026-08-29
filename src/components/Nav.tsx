'use client'

import { useEffect, useRef, useState } from 'react'
import type { LayoutEntry, Settings } from '@/content'

const LABELS: Record<string, string> = {
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  articles: 'Writing',
  education: 'Education',
  responsibilities: 'Leadership',
  contact: 'Contact',
}

/**
 * Resolves the one call to action the bar always shows.
 *
 * A recruiter should never have to scroll to find the résumé, so it is pinned
 * to the top-right. `resumePdf` wins when it is set; the mailto is the fallback
 * so the slot is never empty for a settings file without a PDF.
 *
 * The accessible name is deliberately short and contains neither the owner's
 * name nor the email address: the wordmark and the footer already own those
 * names, and duplicating them would make "the link called Pranav Patil"
 * ambiguous for anyone navigating by accessible name.
 */
function resolveCta(settings: Settings): { label: string; href: string; download: boolean } | null {
  if (settings.resumePdf) return { label: 'Resume', href: settings.resumePdf, download: true }
  if (settings.email) return { label: 'Email me', href: `mailto:${settings.email}`, download: false }
  return null
}

const CTA_CLASS =
  'inline-flex items-center rounded-md border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] bg-[var(--accent-soft)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--accent-readable)] transition-colors duration-200 hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] motion-reduce:transition-none'

/**
 * Anchors derived from the same layout data that orders the page, so hiding or
 * reordering a section in `/admin` moves its nav entry too. `hero` is excluded:
 * it is the top of the page, not a destination.
 *
 * The bar is a plain fixed header — a hairline rule and, once the page has
 * scrolled, an opaque fill so body copy never shows through the links. The
 * previous version used a gradient scrim that let the hero bleed under it;
 * pretty, and unreadable the moment a paragraph passed behind it. Sections
 * carry their own `scroll-mt-20`, so anchors still land clear of the bar.
 */
export default function Nav({
  layout,
  settings,
  customTitles,
  emptyIds,
}: {
  layout: LayoutEntry[]
  settings: Settings
  customTitles: Map<string, string>
  /**
   * Sections that are listed in the layout but will render nothing, because the
   * collection behind them is empty. Their anchors are dropped: a nav link that
   * scrolls nowhere is worse than a missing one, and the owner emptying a
   * collection from the CMS is a normal thing to do.
   */
  emptyIds?: ReadonlySet<string>
}) {
  const items = layout
    .filter((e) => e.visible && e.sectionId !== 'hero' && !emptyIds?.has(e.sectionId))
    .map((e) => ({
      id: e.sectionId,
      label: LABELS[e.sectionId] ?? customTitles.get(e.sectionId) ?? null,
    }))
    .filter((i): i is { id: string; label: string } => i.label !== null)

  const cta = resolveCta(settings)

  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const toggleRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    // Read once on mount too: a reload part-way down the page (or a direct hit
    // on an anchor) starts scrolled, and a listener alone would leave the bar
    // transparent over content until the reader happened to move.
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return

    // Escape is bound only while the menu is open — a permanently-attached
    // global key handler would swallow Escape for anything else on the page.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        // Focus was inside an overlay that is about to be removed; without this
        // it falls back to <body> and keyboard users lose their place.
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    // The overlay covers the viewport; leaving the page scrollable behind it
    // means a swipe moves content the user cannot see.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <header
      data-scrolled={scrolled ? 'true' : 'false'}
      className={`fixed top-0 right-0 left-0 z-50 border-b transition-colors duration-200 motion-reduce:transition-none ${
        scrolled || open
          ? 'border-[var(--hairline)] bg-[var(--background)]'
          : 'border-transparent bg-transparent'
      }`}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-6 sm:px-8"
      >
        <a
          href="#hero"
          className="text-[15px] font-semibold tracking-tight text-[var(--foreground)] transition-colors duration-200 hover:text-[var(--accent-readable)] motion-reduce:transition-none"
        >
          {settings.name}
        </a>

        <div className="flex items-center gap-6">
          <ul className="hidden list-none items-center gap-6 p-0 md:flex">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-[13px] text-[var(--muted)] transition-colors duration-200 hover:text-[var(--foreground)] motion-reduce:transition-none"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {cta ? (
            <a
              href={cta.href}
              className={`hidden md:inline-flex ${CTA_CLASS}`}
              {...(cta.download ? { download: true } : {})}
            >
              {cta.label}
            </a>
          ) : null}

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-md border border-[var(--hairline)] md:hidden"
          >
            <span
              aria-hidden="true"
              className={`block h-px w-4 bg-[var(--foreground)] transition-transform duration-200 motion-reduce:transition-none ${
                open ? 'translate-y-[3px] rotate-45' : ''
              }`}
            />
            <span
              aria-hidden="true"
              className={`block h-px w-4 bg-[var(--foreground)] transition-transform duration-200 motion-reduce:transition-none ${
                open ? '-translate-y-[3px] -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </nav>

      {open ? (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-[var(--background)] px-6 pt-6 pb-12 md:hidden"
        >
          <ul className="list-none divide-y divide-[var(--hairline)] border-y border-[var(--hairline)] p-0">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  className="block py-4 text-lg font-medium tracking-tight text-[var(--foreground)]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {cta ? (
            <a
              href={cta.href}
              onClick={() => setOpen(false)}
              className={`mt-8 w-full justify-center ${CTA_CLASS} flex`}
              {...(cta.download ? { download: true } : {})}
            >
              {cta.label}
            </a>
          ) : null}
        </nav>
      ) : null}
    </header>
  )
}
