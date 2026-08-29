'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import type { Settings } from '@/content'

export type NavSection = { id: string; label: string }

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * The navigation the site did not have below `lg`.
 *
 * The scroll-spy rail in `SideRail` is `hidden lg:block`, so on a phone the
 * only way around was the browser's back button — and on `/work/[slug]` there
 * was no route out at all. This panel restores both: the in-page sections when
 * there are any, and always the site-wide destinations.
 *
 * Hidden above `lg` with CSS rather than a `matchMedia` check on purpose. A JS
 * breakpoint would make the first client render disagree with the server one
 * (hydration flash on every load, to remove a node that `display: none`
 * already hides from the accessibility tree and from the tab order).
 */
export default function MobileNav({
  sections = [],
  settings,
}: {
  sections?: NavSection[]
  settings: Settings
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const resumeHref = settings.resumePdf?.trim() ? settings.resumePdf.trim() : null
  const close = useCallback(() => setOpen(false), [])

  // Escape closes, from wherever focus happens to be.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  /*
   * Body scroll lock. The previous inline value is captured and put back rather
   * than blanked, and the restore lives in the effect cleanup so an unmount
   * mid-transition (a client-side route change while the panel is open) cannot
   * leave the page permanently unscrollable.
   */
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // Focus in on open, back to the trigger on close.
  useEffect(() => {
    if (!open) return
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
    return () => {
      const trigger = triggerRef.current
      if (trigger && document.contains(trigger)) trigger.focus()
    }
  }, [open])

  /** Wraps Tab by hand — the panel is a sibling of the page, not an inert-aware overlay. */
  const onPanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const panel = panelRef.current
    if (!panel) return

    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (focusables.length === 0) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement

    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
      event.preventDefault()
      first.focus()
    }
  }

  const panelLink =
    'block rounded-lg px-3 py-2.5 text-base text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none'

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="-mr-2 rounded-lg px-3 py-2 font-mono text-[11px] tracking-[0.14em] text-[var(--foreground)] uppercase transition-colors hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
      >
        Menu
      </button>

      {open ? (
        <>
          <div
            data-testid="mobile-nav-backdrop"
            onClick={close}
            className="fixed inset-0 z-40 bg-[color-mix(in_oklab,var(--background)_72%,transparent)] backdrop-blur-sm"
          />

          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            onKeyDown={onPanelKeyDown}
            className="fixed inset-x-3 top-3 z-50 max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-2xl border border-[var(--hairline)] bg-[var(--background)] p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="eyebrow">{settings.name}</p>
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-3 py-2 font-mono text-[11px] tracking-[0.14em] text-[var(--subtle)] uppercase transition-colors hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
              >
                Close
              </button>
            </div>

            {/* Anchors only exist on the home page; sub-pages mount with none. */}
            {sections.length > 0 ? (
              <nav aria-label="On this page" className="border-t border-[var(--hairline)] pt-3">
                <ul>
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} onClick={close} className={panelLink}>
                        {section.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

            <nav
              aria-label="Site"
              className={
                sections.length > 0
                  ? 'mt-3 border-t border-[var(--hairline)] pt-3'
                  : 'border-t border-[var(--hairline)] pt-3'
              }
            >
              <ul>
                <li>
                  <Link href="/work" onClick={close} className={panelLink}>
                    Work
                  </Link>
                </li>
                <li>
                  <Link href="/articles" onClick={close} className={panelLink}>
                    Writing
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="mt-3 flex flex-col gap-2 border-t border-[var(--hairline)] pt-3">
              {resumeHref ? (
                <a
                  href={resumeHref}
                  onClick={close}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-center text-sm font-medium text-[var(--accent-contrast)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
                >
                  Résumé
                </a>
              ) : null}
              <a
                href={`mailto:${settings.email}`}
                onClick={close}
                className="rounded-lg border border-[var(--hairline)] px-4 py-2.5 text-center text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
              >
                Email
              </a>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
