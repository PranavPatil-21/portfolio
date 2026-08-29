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
 * Anchors derived from the same layout data that orders the page, so hiding or
 * reordering a section in `/admin` moves its nav entry too. `hero` is excluded:
 * it is the top of the page, not a destination.
 *
 * The bar is fixed rather than sticky, and deliberately has no solid fill — a
 * gradient scrim lets the hero run underneath it, which is what makes the top
 * of the page read as one continuous frame instead of a page with a header
 * bolted on. Sections carry their own `scroll-mt-24`, so anchors still land
 * clear of the bar.
 */
export default function Nav({
  layout,
  settings,
  customTitles,
}: {
  layout: LayoutEntry[]
  settings: Settings
  customTitles: Map<string, string>
}) {
  const items = layout
    .filter((e) => e.visible && e.sectionId !== 'hero')
    .map((e) => ({
      id: e.sectionId,
      label: LABELS[e.sectionId] ?? customTitles.get(e.sectionId) ?? null,
    }))
    .filter((i): i is { id: string; label: string } => i.label !== null)

  const [open, setOpen] = useState(false)
  // Drives the entry stagger. Kept separate from `open` so the links start at
  // their "before" values for one frame and then transition, rather than
  // appearing already in place.
  const [entered, setEntered] = useState(false)
  const toggleRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

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

    const raf = requestAnimationFrame(() => setEntered(true))

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      cancelAnimationFrame(raf)
    }
  }, [open])

  return (
    <header className="pointer-events-none fixed top-0 right-0 left-0 z-50">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-[var(--background)]/60 to-transparent"
      />

      <nav
        aria-label="Primary"
        className="pointer-events-auto relative mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-6 sm:px-10"
      >
        <a
          href="#hero"
          className="font-mono text-[10px] tracking-[0.35em] text-[var(--foreground)]/70 uppercase transition-colors hover:text-[var(--foreground)] motion-reduce:transition-none"
        >
          {settings.name}
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="font-mono text-[10px] tracking-[0.35em] text-[var(--foreground)]/55 uppercase transition-colors duration-300 hover:text-[var(--accent-readable)] motion-reduce:transition-none"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="relative flex h-8 w-8 flex-col items-end justify-center gap-1.5 md:hidden"
        >
          <span
            aria-hidden="true"
            className={`block h-px bg-[var(--foreground)] transition-all duration-300 motion-reduce:transition-none ${
              open ? 'w-6 translate-y-[3.5px] rotate-45' : 'w-6'
            }`}
          />
          <span
            aria-hidden="true"
            className={`block h-px bg-[var(--foreground)] transition-all duration-300 motion-reduce:transition-none ${
              open ? 'w-6 -translate-y-[3.5px] -rotate-45' : 'w-4'
            }`}
          />
        </button>
      </nav>

      {open ? (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="pointer-events-auto fixed inset-0 z-40 flex flex-col justify-center bg-[var(--background)] px-8 md:hidden"
        >
          <p className="mb-10 font-mono text-[10px] tracking-[0.35em] text-[var(--foreground)]/55 uppercase">
            Index
          </p>
          <ul className="flex flex-col gap-2">
            {items.map((item, i) => (
              <li
                key={item.id}
                style={{ transitionDelay: `${60 + i * 55}ms` }}
                className={`transition-all duration-500 ease-[var(--ease-out-expo)] motion-reduce:transition-none ${
                  entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
              >
                <a
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  className="block text-4xl leading-[0.95] font-black tracking-tighter text-[var(--foreground)] transition-colors hover:text-[var(--accent-readable)] motion-reduce:transition-none"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
