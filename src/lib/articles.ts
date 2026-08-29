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

  // Native articles win a slug collision: they are the copy the owner controls,
  // and the one guaranteed to render in full rather than linking out.
  const seen = new Set(native.map((article) => article.slug))

  return [...native, ...imported.filter((article) => !seen.has(article.slug))].sort((a, b) =>
    b.date.localeCompare(a.date),
  )
}
