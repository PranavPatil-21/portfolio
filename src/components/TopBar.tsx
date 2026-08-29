'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Settings } from '@/content'
import MobileNav, { type NavSection } from '@/components/MobileNav'

/** Far enough that a stray trackpad nudge doesn't flicker the background in. */
const SCROLL_THRESHOLD = 8

/**
 * The one piece of chrome that is on every route.
 *
 * Before this, `/work`, `/work/[slug]` and `/articles` rendered no site
 * navigation at all — someone landing on a case study from search had the back
 * button and nothing else. The bar carries the name home, the two section
 * routes, and a standing call to action.
 *
 * It is `sticky`, not `fixed`, so it occupies layout space and cannot cover the
 * content beneath it; pages keep their own top padding and need no offset hack.
 *
 * `variant`:
 * - `home` — transparent at rest over the hero, gaining a background and a
 *   hairline once the reader has scrolled past it.
 * - `sub` — opaque immediately, because content starts directly underneath.
 *
 * The scrolled state is mirrored onto `data-scrolled` so it is assertable
 * without reaching into computed styles.
 */
export default function TopBar({
  settings,
  variant = 'home',
  sections,
}: {
  settings: Settings
  variant?: 'home' | 'sub'
  /**
   * In-page anchors for the mobile panel. Only the home page has any; when it
   * is omitted the mobile trigger is omitted too — a menu offering nothing the
   * bar doesn't already show would be noise.
   */
  sections?: NavSection[]
}) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Read once before subscribing: an arrival at `#anchor`, or a restored
    // scroll position on back-navigation, fires no scroll event, and a
    // listener-only bar would paint transparent over live content.
    const sync = () => setScrolled(window.scrollY > SCROLL_THRESHOLD)
    sync()
    window.addEventListener('scroll', sync, { passive: true })
    return () => window.removeEventListener('scroll', sync)
  }, [])

  const resumeHref = settings.resumePdf?.trim() ? settings.resumePdf.trim() : null
  const opaque = variant === 'sub' || scrolled

  const navLink =
    'rounded-md px-1 py-1 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none'

  return (
    <header
      role="banner"
      data-variant={variant}
      data-scrolled={scrolled}
      className={`sticky top-0 z-30 w-full transition-colors duration-200 motion-reduce:transition-none ${
        opaque
          ? 'border-b border-[var(--hairline)] bg-[color-mix(in_oklab,var(--background)_88%,transparent)] backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6 sm:px-10">
        {variant === 'sub' ? (
          <Link
            href="/"
            className="rounded-md text-sm font-semibold tracking-tight text-[var(--foreground)] transition-colors hover:text-[var(--accent-readable)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
          >
            {settings.name}
          </Link>
        ) : (
          // On the home page `/` is where the reader already is. A link there
          // would be a no-op; a jump to the top is the useful version of it.
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="rounded-md text-sm font-semibold tracking-tight text-[var(--foreground)] transition-colors hover:text-[var(--accent-readable)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
          >
            {settings.name}
          </button>
        )}

        <div className="flex items-center gap-1 sm:gap-4">
          <nav aria-label="Site" className="hidden items-center gap-4 sm:flex">
            <Link href="/work" className={navLink}>
              Work
            </Link>
            <Link href="/articles" className={navLink}>
              Writing
            </Link>
          </nav>

          {/*
            One standing call to action, not two. Below `sm` the panel carries
            Work and Writing; the résumé (or email) stays in the bar so the
            action a recruiter came for is never behind a tap.
          */}
          {resumeHref ? (
            <a
              href={resumeHref}
              className="rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-sm font-medium text-[var(--accent-contrast)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
            >
              Résumé
            </a>
          ) : (
            <a
              href={`mailto:${settings.email}`}
              className="rounded-lg border border-[var(--hairline)] px-3.5 py-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
            >
              Email
            </a>
          )}

          {sections && sections.length > 0 ? (
            <MobileNav sections={sections} settings={settings} />
          ) : null}
        </div>
      </div>
    </header>
  )
}
