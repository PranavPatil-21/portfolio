import type { Settings } from '@/content'

/**
 * The closing frame of the page.
 *
 * It repeats the section-heading move — outlined italic serif above heavy sans
 * — so the bottom of the page rhymes with every section above it rather than
 * trailing off into a thin legal strip. The email is the largest interactive
 * thing on the page after the hero, because it is the one action the whole
 * portfolio is asking for.
 */
export default function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="relative border-t border-[var(--hairline)] px-6 pt-24 pb-12 sm:px-10 md:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        <p className="mb-6 font-mono text-[10px] tracking-[0.35em] text-[var(--foreground)]/55 uppercase">
          Get in touch
        </p>

        <h2 className="flex flex-col text-5xl leading-[0.85] font-black tracking-tighter sm:text-7xl md:text-8xl">
          <span className="ghost block">Let&rsquo;s build</span>
          <span className="-mt-1 block md:-mt-3">Something</span>
        </h2>

        <a
          href={`mailto:${settings.email}`}
          className="group mt-12 inline-block max-w-full text-2xl font-light tracking-tight break-words text-[var(--foreground)]/70 transition-colors duration-300 hover:text-[var(--accent-readable)] sm:text-4xl motion-reduce:transition-none"
        >
          <span className="border-b border-[var(--hairline)] pb-2 transition-colors duration-300 group-hover:border-[var(--accent)] motion-reduce:transition-none">
            {settings.email}
          </span>
        </a>

        {settings.location ? (
          <p className="mt-8 font-mono text-[10px] tracking-[0.35em] text-[var(--foreground)]/55 uppercase">
            {settings.location}
          </p>
        ) : null}

        <div className="mt-20 flex flex-col gap-6 border-t border-[var(--hairline)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] tracking-[0.35em] text-[var(--foreground)]/55 uppercase">
            © {new Date().getFullYear()} {settings.name}
          </p>

          {settings.socials.length > 0 ? (
            <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
              {settings.socials.map((social) => (
                <li key={social.url}>
                  <a
                    href={social.url}
                    rel="noreferrer noopener"
                    target="_blank"
                    className="font-mono text-[10px] tracking-[0.35em] text-[var(--foreground)]/60 uppercase transition-colors duration-300 hover:text-[var(--accent-readable)] motion-reduce:transition-none"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
