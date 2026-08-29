import { SectionShell } from '@/components/ui/SectionShell'
import { Reveal } from '@/components/ui/Reveal'
import type { Settings } from '@/content/schemas'

const LABEL = 'font-mono text-[10px] tracking-[0.35em] uppercase text-[var(--foreground)]/55'

/**
 * A mono row link — used for socials and for the résumé.
 *
 * The accent only arrives on hover; at rest the row is deliberately quiet so
 * the email address is the single loud thing in the section.
 */
const ROW_LINK =
  'group/link inline-flex items-baseline gap-2 font-mono text-[11px] tracking-[0.28em] uppercase text-[var(--foreground)]/60 transition-colors duration-300 hover:text-[var(--accent-readable)] motion-reduce:transition-none'

/**
 * The closing section: how to reach the owner, and the emotional full stop of
 * the page.
 *
 * Unlike the collection sections this never returns `null` — `Settings` always
 * carries a name and an email, so there is always something to render. Its
 * conditionals are the optional pieces: the résumé download, the phone number,
 * the location and the social list.
 *
 * The email is rendered exactly once, as the largest interactive element on the
 * page after the hero. Repeating it as a caption would read nicely and quietly
 * break every "one link per accessible name" guarantee the tests rely on.
 *
 * Every piece of *owner data* — email, phone, location, socials, résumé — comes
 * from `content/settings.json`; only the section's own framing copy is literal.
 */
export function Contact({ settings }: { settings: Settings }) {
  const { email, phone, resumePdf, socials, location, name } = settings

  return (
    <SectionShell
      id="contact"
      index="08 / CONTACT"
      eyebrow="Let's"
      title="Get in touch"
      subtitle="Open to product roles where AI does real work for real users. If you are early on something and still deciding what it should be, that is a good time to talk."
    >
      <Reveal>
        <div className="border-t border-[var(--hairline)] pt-12">
          <p className={LABEL}>Email</p>

          <a
            href={`mailto:${email}`}
            className="group mt-5 inline-block max-w-full text-[var(--foreground)] transition-colors duration-500 hover:text-[var(--accent-readable)] motion-reduce:transition-none"
          >
            <span className="relative inline-block wrap-anywhere text-2xl font-black tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl after:absolute after:-bottom-2 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-[var(--accent)] after:transition-transform after:duration-500 group-hover:after:origin-left group-hover:after:scale-x-100 motion-reduce:after:transition-none">
              {email}
            </span>
          </a>
        </div>
      </Reveal>

      {location || phone ? (
        <Reveal delay={0.08}>
          <dl className="mt-14 grid gap-8 sm:grid-cols-2">
            {location ? (
              <div>
                <dt className={LABEL}>Based in</dt>
                <dd className="mt-3 text-sm text-[var(--foreground)]/55">{location}</dd>
              </div>
            ) : null}

            {phone ? (
              <div>
                <dt className={LABEL}>Phone</dt>
                <dd className="mt-3">
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="text-sm text-[var(--foreground)]/55 underline-offset-4 transition-colors duration-300 hover:text-[var(--accent-readable)] hover:underline motion-reduce:transition-none"
                  >
                    {phone}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </Reveal>
      ) : null}

      {socials.length > 0 || resumePdf ? (
        <Reveal delay={0.12}>
          <div className="mt-16 flex flex-col gap-8 border-t border-[var(--hairline)] pt-10 md:flex-row md:items-center md:justify-between">
            {socials.length > 0 ? (
              <ul className="flex list-none flex-wrap items-center gap-x-9 gap-y-4 p-0">
                {socials.map((social) => (
                  <li key={social.url}>
                    <a
                      href={social.url}
                      className={ROW_LINK}
                      {...(social.url.startsWith('http')
                        ? { target: '_blank', rel: 'noreferrer noopener' }
                        : {})}
                    >
                      {social.label}
                      <span
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover/link:-translate-y-0.5 motion-reduce:transition-none"
                      >
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}

            {resumePdf ? (
              <a
                href={resumePdf}
                download
                className={`${ROW_LINK} text-[var(--accent-readable)] decoration-[var(--accent)]/40 underline-offset-8 hover:underline`}
              >
                Resume
                <span className="sr-only"> — {name}, PDF</span>
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover/link:translate-y-0.5 motion-reduce:transition-none"
                >
                  ↓
                </span>
              </a>
            ) : null}
          </div>
        </Reveal>
      ) : null}

      <p
        aria-hidden="true"
        className="mt-20 text-right font-mono text-[10px] tracking-[0.35em] text-[var(--foreground)]/55 uppercase"
      >
        {name}
      </p>
    </SectionShell>
  )
}

export default Contact
