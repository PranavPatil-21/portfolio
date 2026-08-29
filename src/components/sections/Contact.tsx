import { SectionShell } from '@/components/ui/SectionShell'
import { Reveal } from '@/components/ui/Reveal'
import type { Settings } from '@/content/schemas'

/**
 * The closing section: how to reach the owner.
 *
 * Unlike the collection sections this never returns `null` — `Settings` always
 * carries a name and an email, so there is always something to render. Its
 * conditionals are the optional pieces: the résumé download, the phone number,
 * the location and the social list.
 *
 * The email is rendered exactly once, as a large but not theatrical link.
 * Repeating it as a caption would read nicely and quietly break every
 * "one link per accessible name" guarantee the tests rely on.
 *
 * Every piece of *owner data* — email, phone, location, socials, résumé — comes
 * from `content/settings.json`; only the section's own framing copy is literal.
 */
export function Contact({ settings }: { settings: Settings }) {
  const { email, phone, resumePdf, socials, location } = settings

  return (
    <SectionShell
      id="contact"
      eyebrow="Contact"
      title="Get in touch"
      subtitle="Open to product roles where AI does real work for real users. If you are early on something and still deciding what it should be, that is a good time to talk."
    >
      <Reveal>
        <div className="flex flex-col gap-4 border-y border-[var(--hairline)] py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <a
            href={`mailto:${email}`}
            className="max-w-full text-xl font-semibold tracking-tight break-words text-[var(--foreground)] transition-colors duration-200 hover:text-[var(--accent-readable)] sm:text-2xl motion-reduce:transition-none"
          >
            {email}
          </a>

          {resumePdf ? (
            <a
              href={resumePdf}
              download
              className="inline-flex shrink-0 items-center justify-center rounded-md border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent-readable)] transition-colors duration-200 hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] motion-reduce:transition-none"
            >
              Download resume
              <span aria-hidden="true" className="ml-2">
                ↓
              </span>
            </a>
          ) : null}
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-3">
          {location ? (
            <div>
              <dt className="eyebrow">Based in</dt>
              <dd className="mt-2 text-sm text-[var(--muted)]">{location}</dd>
            </div>
          ) : null}

          {phone ? (
            <div>
              <dt className="eyebrow">Phone</dt>
              <dd className="mt-2">
                <a
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="tabular text-sm text-[var(--muted)] underline-offset-4 transition-colors duration-200 hover:text-[var(--accent-readable)] hover:underline motion-reduce:transition-none"
                >
                  {phone}
                </a>
              </dd>
            </div>
          ) : null}

          {socials.length > 0 ? (
            <div>
              <dt className="eyebrow">Elsewhere</dt>
              <dd className="mt-2">
                <ul className="flex list-none flex-wrap items-center gap-x-5 gap-y-2 p-0">
                  {socials.map((social) => (
                    <li key={social.url}>
                      <a
                        href={social.url}
                        className="text-sm text-[var(--muted)] underline-offset-4 transition-colors duration-200 hover:text-[var(--accent-readable)] hover:underline motion-reduce:transition-none"
                        {...(social.url.startsWith('http')
                          ? { target: '_blank', rel: 'noreferrer noopener' }
                          : {})}
                      >
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ) : null}
        </dl>
      </Reveal>
    </SectionShell>
  )
}

export default Contact
