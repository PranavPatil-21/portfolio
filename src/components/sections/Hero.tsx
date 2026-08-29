import type { Settings } from '@/content'
import HeroCanvas from '@/components/three/HeroCanvas'

/**
 * The hero. A server component by design: the name, roles, bio and every
 * call-to-action are real server-rendered DOM, so the page reads correctly with
 * JavaScript disabled or WebGL unavailable. The canvas is purely decorative and
 * sits behind this content.
 */
export default function Hero({ settings }: { settings: Settings }) {
  const { name, roles, bio, location, email, resumePdf, socials, features, avatar, avatarAlt } =
    settings

  return (
    <section
      id="hero"
      className="relative isolate flex min-h-[88vh] items-center overflow-hidden px-6 py-24 sm:px-10"
    >
      <HeroCanvas enabled={features.hero3d} />

      {/*
        Two scrims. The horizontal one keeps the copy on a dark base no matter
        what the scene does behind it — text legibility cannot depend on where a
        procedurally-animated object happens to drift. The vertical one blends
        the canvas into the next section.
      */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[var(--background)] via-[var(--background)]/95 to-[var(--background)]/55 sm:via-[var(--background)]/85 sm:to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[var(--background)]/60 via-transparent to-[var(--background)]" />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <div className="max-w-2xl">
        {/*
          Deliberately understated: a small avatar that establishes a face
          without becoming the subject of the hero. The 3D scene is the focal
          point; this sits quietly above the name.
        */}
        {avatar ? (
          <img
            src={avatar}
            alt={avatarAlt ?? name}
            width={64}
            height={64}
            className="mb-6 size-16 rounded-full object-cover ring-1 ring-white/15"
          />
        ) : null}

        {location ? (
          <p className="mb-5 text-sm font-medium tracking-[0.18em] text-[var(--accent-readable)] uppercase">
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
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-contrast)] transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Get in touch
          </a>

          {resumePdf ? (
            <a
              href={resumePdf}
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium transition hover:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
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
              className="rounded-full px-4 py-3 text-sm text-[var(--foreground)]/70 underline-offset-4 transition hover:text-[var(--foreground)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
            >
              {social.label}
            </a>
          ))}
        </div>
        </div>
      </div>
    </section>
  )
}
