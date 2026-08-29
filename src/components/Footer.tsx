import type { Settings } from '@/content'

/**
 * The closing frame of the page.
 *
 * Deliberately minimal: name, email, socials, copyright. The Contact section
 * directly above already makes the ask at full volume — repeating it here at
 * the same size would read as a second, competing call to action. The footer's
 * job is to be the place a reader's eye lands when they have finished, and to
 * still hold the address they came for.
 */
export default function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="border-t border-[var(--hairline)] px-6 py-12 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
            {settings.name}
          </p>
          <a
            href={`mailto:${settings.email}`}
            className="mt-1 inline-block max-w-full text-sm break-words text-[var(--muted)] underline-offset-4 transition-colors duration-200 hover:text-[var(--accent-readable)] hover:underline motion-reduce:transition-none"
          >
            {settings.email}
          </a>
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          {settings.socials.length > 0 ? (
            <ul className="flex list-none flex-wrap items-center gap-x-5 gap-y-2 p-0">
              {settings.socials.map((social) => (
                <li key={social.url}>
                  <a
                    href={social.url}
                    rel="noreferrer noopener"
                    target="_blank"
                    className="text-sm text-[var(--muted)] transition-colors duration-200 hover:text-[var(--foreground)] motion-reduce:transition-none"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="eyebrow">
            © {new Date().getFullYear()} {settings.name}
          </p>
        </div>
      </div>
    </footer>
  )
}
