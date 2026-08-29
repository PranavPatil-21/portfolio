import type { Settings } from '@/content'
import HeroCanvas from '@/components/three/HeroCanvas'

/**
 * The hero. A server component by design: the name, roles, bio and every
 * call-to-action are real server-rendered DOM, so the page reads correctly with
 * JavaScript disabled or WebGL unavailable. The particle portrait sits beside
 * the copy and is decorative — it carries no information the text does not.
 */
export default function Hero({ settings }: { settings: Settings }) {
  const { name, roles, bio, location, email, resumePdf, socials, features, avatar } = settings

  return (
    <section
      id="hero"
      className="relative isolate flex min-h-[92vh] items-center overflow-hidden px-6 py-24 sm:px-10"
    >
      {/*
        The canvas takes the right portion on wide screens so the portrait reads
        as a subject beside the copy rather than a wash behind it. On narrow
        screens it sits behind everything, damped by the scrims below.
      */}
      <div className="absolute inset-0 lg:left-[36%]">
        <HeroCanvas enabled={features.hero3d} image={avatar ?? '/uploads/profile.jpg'} />
      </div>

      {/*
        Two scrims. The horizontal one keeps the copy on a dark base no matter
        what the cloud does behind it — text legibility cannot depend on where a
        procedurally-animated particle happens to drift. The vertical one blends
        the canvas into the next section.
      */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[var(--background)] via-[var(--background)]/92 to-[var(--background)]/40 sm:via-[var(--background)]/78 sm:to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[var(--background)]/50 via-transparent to-[var(--background)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          {location ? (
            <p className="mb-5 flex items-center gap-2.5 text-sm font-medium tracking-[0.18em] text-[var(--accent-readable)] uppercase">
              <span
                aria-hidden="true"
                className="inline-block size-1.5 animate-pulse rounded-full bg-[var(--accent-readable)] motion-reduce:animate-none"
              />
              {location}
            </p>
          ) : null}

          <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-7xl">{name}</h1>

          <ul className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
            {roles.map((role) => (
              <li
                key={role}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-[var(--foreground)]/80 backdrop-blur-sm"
              >
                {role}
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--foreground)]/75">{bio}</p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${email}`}
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-contrast)] transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none"
            >
              Get in touch
            </a>

            {resumePdf ? (
              <a
                href={resumePdf}
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium transition hover:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none motion-reduce:transition-none"
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
                className="rounded-full px-4 py-3 text-sm text-[var(--foreground)]/70 underline-offset-4 transition hover:text-[var(--foreground)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none motion-reduce:transition-none"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-xs tracking-[0.3em] text-[var(--foreground)]/35 uppercase"
      >
        Scroll
      </div>
    </section>
  )
}
