import { getNativeArticles, getSettings, type Article } from '@/content'
import { fetchMediumArticles } from '@/lib/medium'

/**
 * Every article the site should show: the owner's own posts, plus anything
 * imported from Medium.
 *
 * This lives in one place because it previously did not. The home page merged
 * the imported posts and `/articles` did not, so turning the importer on filled
 * the homepage list while the page devoted to writing still said "nothing
 * published yet" — a bug invisible from either file alone.
 */
export async function getAllArticles(): Promise<Article[]> {
  const settings = getSettings()
  const native = getNativeArticles()

  const handle = settings.features.mediumHandle
  const imported =
    settings.features.mediumImport && handle ? await fetchMediumArticles(handle) : []

  /*
   * Drop an imported post when the owner has written the same piece here.
   *
   * Slugs alone are not enough, and assuming they were is how this went wrong
   * the first time: Medium appends a post id, so the imported slug for an
   * article is `my-title-484e80aa36c5` while the hand-written one is
   * `my-title`. They never collide, and the reader sees the article twice.
   *
   * So three signals, cheapest first: the slug, an explicit `canonicalUrl`
   * pointing at the Medium post, and finally a normalised title. The last one
   * is what catches the ordinary case — republishing under the same headline
   * without thinking about metadata.
   */
  const slugs = new Set(native.map((article) => article.slug))
  const canonicals = new Set(
    native.flatMap((article) => (article.canonicalUrl ? [normaliseUrl(article.canonicalUrl)] : [])),
  )
  const titles = new Set(native.map((article) => normaliseTitle(article.title)))

  const deduped = imported.filter((article) => {
    if (slugs.has(article.slug)) return false
    if (article.canonicalUrl && canonicals.has(normaliseUrl(article.canonicalUrl))) return false
    if (article.externalUrl && canonicals.has(normaliseUrl(article.externalUrl))) return false
    return !titles.has(normaliseTitle(article.title))
  })

  return [...native, ...deduped].sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * Lowercased, stripped of every non-alphanumeric character, whitespace
 * collapsed.
 *
 * Punctuation is removed rather than normalised. An earlier version mapped
 * curly quotes to apostrophes and then preserved apostrophes, so a curly
 * double-quote became an apostrophe on one side and a space on the other, and
 * two copies of the same headline failed to match. Dropping punctuation
 * entirely has no such edge: only the words have to agree.
 */
function normaliseTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Ignores protocol, `www.`, trailing slashes and Medium's tracking query. */
function normaliseUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('?')[0]
    .replace(/\/+$/, '')
}
