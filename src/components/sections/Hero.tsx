import type { Settings } from '@/content'
import Magnetic from '@/components/ui/Magnetic'

/**
 * The hero.
 *
 * **A server component, deliberately.** The previous version was a client
 * component because GSAP needed a boundary; there is no GSAP here, no canvas
 * and no reveal, so the whole thing renders to HTML on the server and ships no
 * copy in the client bundle. `Magnetic` is a `'use client'` leaf — importing it
 * from a server component is the normal composition, and it renders fine under
 * `renderToString`.
 *
 * **Nothing animates in.** Not an oversight. A scroll-reveal on the fold is a
 * contradiction — it is already in view — and any `initial={{ opacity: 0 }}`
 * writes `style="opacity:0"` into the server HTML, which is precisely the
 * failure mode where the page scores well on every other check and the owner's
 * name is invisible. The resting state *is* the only state.
 *
 * **The budget is 1440×900.** No `min-h-[100svh]`, no `py-28`. A hiring manager
 * skimming for thirty seconds should reach the evidence without scrolling past
 * a poster, so the eyebrow, name, positioning line, bio and every call to
 * action fit in one screen with the next section's edge visible beneath them.
 */
export default function Hero({ settings }: { settings: Settings }) {
  const { name, roles, bio, headline, location, email, resumePdf, socials } = settings

  /*
   * The positioning sentence. It lives in the CMS rather than in this file:
   * it is the most important text on the site, and the owner must be able to
   * change what he claims about himself without a code change.
   *
   * Falls back to the bio's first sentence so the hero is never headless if the
   * field is cleared.
   */
  const positioning = headline?.trim()
    ? headline
    : (bio.split(/(?<=\.)\s/)[0] ?? bio)

  // The CMS clears a text field to `''`, not to nothing, so "set" has to mean
  // non-empty — otherwise clearing the field publishes a link to the site root.
  const resumeHref = resumePdf?.trim() ? resumePdf : null

  // Location and headline role, whichever exist. Joined here rather than in the
  // markup so an empty `location` cannot leave a dangling separator.
  const eyebrow = [location, roles[0]].filter((part) => part?.trim()).join('  ·  ')

  // Authors separate thoughts with a blank line in the CMS textarea; rendering
  // that as one wall of text loses the pacing.
  const paragraphs = bio
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s*\n\s*/g, ' ').replace(/\*/g, '').trim())
    .filter(Boolean)

  return (
    <section id="hero" className="px-6 pt-16 pb-14 sm:px-8 md:pt-24 md:pb-20">
      <div className="mx-auto w-full max-w-5xl">
        {eyebrow ? (
          <p className="eyebrow mb-6 flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="inline-block size-1.5 shrink-0 rounded-full bg-[var(--accent-readable)]"
            />
            {eyebrow}
          </p>
        ) : null}

        <h1 className="display text-[var(--foreground)]">{name}</h1>

        {/*
          The most important text on the site. Everything after this is the
          reader choosing to keep going; this sentence has to earn that on its
          own, so it sits directly under the name at a size the eye lands on
          before it lands on the body copy.

          `text-pretty`, not `text-balance`: balancing is meant for headings of
          a line or two and would even out this sentence's four lines by
          breaking its two beats — what he does now, where he is going — at
          arbitrary points. Pretty only fixes the orphan.
        */}
        <p
          data-positioning=""
          className="mt-6 max-w-[48ch] text-lg leading-[1.45] font-medium text-pretty text-[var(--foreground)] md:text-[22px]"
        >
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

        <div className="mt-6 flex max-w-[64ch] flex-col gap-3.5">
          {paragraphs.map((paragraph, i) => (
            <p
              key={i}
              data-hero-bio=""
              className="text-[15px] leading-relaxed text-[var(--muted)]"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-x-3 gap-y-3">
          <Magnetic>
            <a
              href={`mailto:${email}`}
              className="inline-block rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-contrast)] transition-opacity hover:opacity-90 motion-reduce:transition-none"
            >
              Get in touch
            </a>
          </Magnetic>

          {resumeHref ? (
            <a
              href={resumeHref}
              className="inline-block rounded-lg border border-[var(--hairline)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)] motion-reduce:transition-none"
            >
              Résumé
            </a>
          ) : null}

          {socials.length ? (
            <span aria-hidden="true" className="mx-1 h-4 w-px bg-[var(--hairline)]" />
          ) : null}

          {socials.map((social) => (
            <a
              key={social.url}
              href={social.url}
              rel="noreferrer noopener"
              target="_blank"
              className="rounded-md px-1 py-2 text-sm text-[var(--subtle)] underline-offset-4 transition-colors hover:text-[var(--foreground)] hover:underline motion-reduce:transition-none"
            >
              {social.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Splits `*emphasised*` runs out of a string.
 *
 * Markers are excluded by construction rather than stripped afterwards, and an
 * unpaired asterisk survives as literal text instead of swallowing the rest of
 * the sentence.
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
