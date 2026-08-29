import { SectionShell } from '@/components/ui/SectionShell'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import type { Settings } from '@/content/schemas'

const LINK =
  'inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-strong px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:border-accent/50 hover:text-[color:var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]'

/**
 * The closing section: how to reach the owner.
 *
 * Unlike the collection sections this never returns `null` — `Settings` always
 * carries a name and an email, so there is always something to render. Its
 * conditionals are the optional pieces: the résumé download, the phone number,
 * and the social list.
 *
 * Every string here comes from `content/settings.json`; nothing about the owner
 * is hardcoded (plan, Global Constraints).
 */
export function Contact({ settings }: { settings: Settings }) {
  const { email, phone, resumePdf, socials, location, name } = settings

  return (
    <SectionShell
      id="contact"
      title="Get in touch"
      subtitle="Open to interesting backend and AI systems work."
    >
      <Reveal>
        <Card className="flex flex-col gap-8 sm:p-8">
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Email</dt>
              <dd className="mt-2">
                <a
                  href={`mailto:${email}`}
                  className="rounded text-base text-[color:var(--accent)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
                >
                  {email}
                </a>
              </dd>
            </div>

            {phone ? (
              <div>
                <dt className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Phone</dt>
                <dd className="mt-2">
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="rounded text-base text-[color:var(--foreground)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
                  >
                    {phone}
                  </a>
                </dd>
              </div>
            ) : null}

            {location ? (
              <div>
                <dt className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                  Location
                </dt>
                <dd className="mt-2 text-base text-muted">{location}</dd>
              </div>
            ) : null}
          </dl>

          {socials.length > 0 || resumePdf ? (
            <ul className="flex flex-wrap gap-3 border-t border-hairline pt-6">
              {socials.map((social) => (
                <li key={social.url}>
                  <a
                    href={social.url}
                    className={LINK}
                    {...(social.url.startsWith('http')
                      ? { target: '_blank', rel: 'noreferrer noopener' }
                      : {})}
                  >
                    {social.label}
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
              {resumePdf ? (
                <li>
                  <a
                    href={resumePdf}
                    download
                    className={`${LINK} border-accent/50 text-[color:var(--accent)]`}
                  >
                    Download resume
                    <span className="sr-only"> — {name}, PDF</span>
                    <span aria-hidden="true">↓</span>
                  </a>
                </li>
              ) : null}
            </ul>
          ) : null}
        </Card>
      </Reveal>
    </SectionShell>
  )
}

export default Contact
