/**
 * Date formatting for case studies.
 *
 * Lives beside the routes rather than inside one of them: `/work` and
 * `/work/[slug]` both need it, and a page module importing another page module
 * would pull the whole markdown pipeline into the index's graph for the sake of
 * a string. Next ignores non-route files in an app directory.
 */

/** `YYYY`, `YYYY-MM` and `YYYY-MM-DD` all reach here; show what is known. */
export function formatProjectDate(date: string): string {
  const [year, month] = date.split('-')
  if (!month) return year
  const d = new Date(Number(year), Number(month) - 1, 1)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}
