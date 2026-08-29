import type { Settings } from '@/content/schemas'

/**
 * Emits a schema.org `Person` graph for the site owner.
 *
 * Everything comes from `content/settings.json`, so the owner's structured data
 * stays correct without a code change when they edit their details in the CMS.
 */

/**
 * `sameAs` means "another web page that represents this same person". A
 * `mailto:` or `tel:` link is a contact method, not a profile page — the email
 * already has its own `email` property — so those are filtered out.
 */
function profileUrls(settings: Settings): string[] {
  return settings.socials
    .map((s) => s.url)
    .filter((url) => /^https?:\/\//i.test(url))
}

export default function JsonLd({ settings }: { settings: Settings }) {
  const sameAs = profileUrls(settings)

  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: settings.name,
    jobTitle: settings.roles[0],
    description: settings.bio,
    email: settings.email,
    ...(settings.location ? { address: settings.location } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }

  return (
    <script
      type="application/ld+json"
      // JSON-serialised from validated settings, never raw HTML. `<` is escaped
      // because the bio is free text — a stray `</script` would end the tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(person).replace(/</g, '\\u003c'),
      }}
    />
  )
}
