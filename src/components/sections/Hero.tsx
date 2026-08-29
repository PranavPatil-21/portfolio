'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import type { Settings } from '@/content'
import HeroCanvas from '@/components/three/HeroCanvas'
import BlurText from '@/components/ui/BlurText'

/**
 * The hero.
 *
 * **On the client directive.** GSAP needs a client boundary, and `'use client'`
 * is a *file*-level directive — a module cannot hold a server component and a
 * client one. Since the choreography and the markup are required to live in
 * this one file, the file is the boundary. That costs nothing that matters
 * here: a client component is still rendered to HTML on the server, so the
 * name, roles, bio and every call-to-action ship in the initial document and
 * the page reads with JavaScript disabled. What it does *not* do is let the
 * copy stay out of the client bundle; if that ever matters, the fix is to move
 * `HeroChoreography` into its own file and make this one a server component
 * again, which is a two-minute change because the split is already drawn.
 *
 * **On stranded content.** Every element's *resting* state is fully visible.
 * There is no `opacity-0` anywhere in this markup. GSAP animates *from* a
 * hidden state toward that resting state, so every failure mode — no JS, a
 * GSAP import failure, reduced motion, an effect that never fires — lands on
 * legible text rather than an invisible page. The reverse (markup hidden, JS
 * reveals it) is the same animation and a far worse failure mode.
 */
export default function Hero({ settings }: { settings: Settings }) {
  const { name, roles, bio, location, email, resumePdf, socials, features, avatar } = settings

  // The CMS clears a text field to `''`, not to nothing, so "set" has to mean
  // non-empty — otherwise clearing the field publishes a link to the site root.
  const resumeHref = resumePdf?.trim() ? resumePdf : null

  // One `BlurText` per paragraph. Authors separate thoughts with a blank line
  // in the CMS textarea; rendering that as one wall of text loses the pacing.
  const paragraphs = bio
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)

  return (
    <section
      id="hero"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden px-6 py-28 sm:px-10 lg:px-16"
    >
      {/*
        The portrait takes the right of the frame on wide screens so it reads as
        a subject beside the copy rather than a wash behind it. On narrow
        screens it fills the section and the scrims below carry legibility.
      */}
      <div className="absolute inset-0 lg:left-[34%]">
        <HeroCanvas enabled={features.hero3d} image={avatar ?? '/uploads/profile.jpg'} />
      </div>

      {/*
        Three scrims, because the particle portrait is bright in places and text
        contrast cannot depend on where a procedurally-animated particle happens
        to drift. The horizontal one guarantees a dark base under the copy
        column; the vertical one blends the canvas into the next section; the
        third is a low-opacity flat wash that lifts the floor everywhere else.
      */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[var(--background)] via-[var(--background)]/92 to-[var(--background)]/45 sm:via-[var(--background)]/80 sm:to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[var(--background)]/60 via-transparent to-[var(--background)]" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[var(--background)]/25" />

      <HeroChoreography>
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            {location ? (
              <p className="hero-eyebrow mb-7 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-[var(--accent-readable)] uppercase md:text-xs">
                <span
                  aria-hidden="true"
                  className="inline-block size-1.5 shrink-0 animate-pulse rounded-full bg-[var(--accent-readable)] motion-reduce:animate-none"
                />
                {location}
              </p>
            ) : null}

            {/*
              Two voices. The outlined italic serif is quiet and human; the name
              underneath is the shout. `aria-label` carries the whole heading so
              a screen reader is never handed the per-letter split, while the
              letters themselves remain real text nodes for crawlers and for
              anyone reading with styles off.
            */}
            <h1
              className="relative mb-10 flex flex-col leading-[0.75] font-black tracking-tighter"
              aria-label={`${GHOST_LINE} ${name}`}
            >
              <span
                aria-hidden="true"
                className="hero-ghost ghost block text-4xl sm:text-5xl md:text-6xl"
              >
                {GHOST_LINE}
              </span>
              <span
                aria-hidden="true"
                className="hero-name -mt-1 block text-[clamp(3.25rem,13vw,10rem)] text-[var(--foreground)] md:-mt-4"
                style={{ perspective: '600px' }}
              >
                {splitLetters(name).map((char, i) => (
                  <span key={`${char}-${i}`} className="hero-letter inline-block">
                    {char}
                  </span>
                ))}
              </span>
            </h1>

            <ul className="hero-supporting mb-8 flex flex-wrap items-center gap-x-2.5 gap-y-2">
              {roles.map((role) => (
                <li
                  key={role}
                  className="rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-3.5 py-1.5 font-mono text-[10px] tracking-[0.14em] text-[var(--foreground)]/75 uppercase backdrop-blur-sm md:text-xs"
                >
                  {role}
                </li>
              ))}
            </ul>

            <HeroBio paragraphs={paragraphs} />

            <div className="hero-supporting mt-10 flex flex-wrap items-center gap-x-3 gap-y-3">
              <a
                href={`mailto:${email}`}
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-contrast)] transition hover:opacity-90 motion-reduce:transition-none"
              >
                Get in touch
              </a>

              {resumeHref ? (
                <a
                  href={resumeHref}
                  className="rounded-full border border-[var(--hairline)] px-6 py-3 text-sm font-medium transition hover:border-[var(--accent)] motion-reduce:transition-none"
                >
                  Download résumé
                </a>
              ) : null}

              {socials.map((social) => (
                <a
                  key={social.url}
                  href={social.url}
                  rel="noreferrer noopener"
                  target="_blank"
                  className="rounded-full px-3 py-3 font-mono text-[10px] tracking-[0.2em] text-[var(--foreground)]/55 uppercase underline-offset-4 transition hover:text-[var(--foreground)] hover:underline motion-reduce:transition-none md:text-xs"
                >
                  {social.label}
                </a>
              ))}
            </div>

            <p className="hero-supporting mt-12 font-mono text-[10px] tracking-[0.4em] text-[var(--foreground)]/55 uppercase">
              Explore ↓
            </p>
          </div>
        </div>
      </HeroChoreography>
    </section>
  )
}

/**
 * The quiet half of the heading pair. Deliberately not a CMS field: it is
 * grammatical scaffolding for the name, not content, and pulling it from
 * `roles` would print the same string twice in two different type treatments.
 */
const GHOST_LINE = "Hey, I'm"

/**
 * Splits for per-letter animation, with spaces as non-breaking so an
 * `inline-block` letter run does not collapse them. ` ` still normalises
 * to a space for `textContent`, so the name reads intact to anything parsing
 * the DOM.
 */
function splitLetters(value: string): string[] {
  return Array.from(value).map((char) => (char === ' ' ? ' ' : char))
}

/**
 * `useLayoutEffect` warns when React renders on the server, but `useEffect`
 * runs *after* paint — which would show one painted frame of the plain bio
 * before the reveal replaces it. Aliasing per environment is the standard
 * resolution and is what `motion` itself does internally.
 */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * The bio, as progressive enhancement.
 *
 * `BlurText` reveals words on scroll via `IntersectionObserver`, and it renders
 * its starting state — `opacity: 0` — into the server HTML. Used directly, that
 * would make the bio *invisible* to a reader with JavaScript disabled, and
 * permanently invisible in any browser without `IntersectionObserver`: the
 * observer that was going to reveal it never exists. The text would be in the
 * DOM and unreadable, which is the exact failure this hero is built to avoid.
 *
 * So the server renders plain, visible paragraphs, and the reveal is swapped in
 * only once the client has confirmed it can actually finish the job. The swap
 * happens in a layout effect, before paint, so there is no flash.
 */
function HeroBio({ paragraphs }: { paragraphs: string[] }) {
  const [canReveal, setCanReveal] = useState(false)

  useIsomorphicLayoutEffect(() => {
    if (typeof IntersectionObserver !== 'undefined') setCanReveal(true)
  }, [])

  return (
    <div className="hero-supporting flex max-w-xl flex-col gap-5">
      {paragraphs.map((paragraph, i) => {
        const className =
          i === 0
            ? 'text-base leading-[1.65] font-medium text-[var(--foreground)]/70 md:text-[17px]'
            : 'text-sm leading-relaxed font-light text-[var(--foreground)]/60'

        return (
          <div key={i} data-hero-bio="">
            {canReveal ? (
              <BlurText
                text={paragraph}
                delay={0.1 + i * 0.08}
                stagger={0.02}
                className={className}
              />
            ) : (
              <p className={className}>{stripEmphasis(paragraph)}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Mirrors `BlurText`'s handling of `*emphasis*` so the swap is invisible. */
function stripEmphasis(value: string): string {
  return value.replace(/\*/g, '')
}

/**
 * The GSAP layer. Owns nothing but timing — it renders its children unchanged
 * and animates them by class within a `gsap.context` scoped to its own subtree.
 *
 * Under `prefers-reduced-motion` it returns before touching GSAP at all, which
 * is why reduced motion cannot strand anything: with no tween there is no
 * inline style, and the markup's resting state is already the final one.
 */
export function HeroChoreography({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.from('.hero-eyebrow', {
        y: 18,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.25,
      })

      gsap.from('.hero-ghost', {
        y: 70,
        opacity: 0,
        duration: 1.1,
        ease: 'power4.out',
        delay: 0.4,
      })

      // The signature move: the name assembles letter by letter, each one
      // rotating up out of the page plane.
      gsap.from('.hero-letter', {
        y: 100,
        opacity: 0,
        rotateX: -40,
        stagger: 0.06,
        duration: 1.2,
        ease: 'power4.out',
        delay: 0.5,
      })

      gsap.from('.hero-supporting', {
        y: 26,
        opacity: 0,
        stagger: 0.12,
        duration: 0.9,
        ease: 'power3.out',
        delay: 1.1,
      })

      // Drifts the copy out of frame as the hero leaves, so the section hands
      // over rather than cutting. `scrub` ties it to scroll position, which
      // means it reverses cleanly when the reader scrolls back up.
      if (scope.current) {
        gsap.to(scope.current, {
          opacity: 0,
          y: -50,
          ease: 'none',
          scrollTrigger: {
            trigger: scope.current,
            start: 'bottom 65%',
            end: 'bottom 15%',
            scrub: 1.1,
          },
        })
      }
    }, scope)

    // Reverting restores every property GSAP touched, so an unmount mid-tween
    // cannot leave a half-faded inline style behind.
    return () => ctx.revert()
  }, [])

  return (
    <div ref={scope} className="relative z-10 w-full">
      {children}
    </div>
  )
}
