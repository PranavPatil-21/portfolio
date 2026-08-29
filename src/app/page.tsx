import {
  getSettings,
  getExperience,
  getProjects,
  getSkills,
  getEducation,
  getResponsibilities,
  getNativeArticles,
  getCustomSections,
  getMetrics,
  getLayout,
} from '@/content'
import { fetchMediumArticles } from '@/lib/medium'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import SectionRenderer from '@/components/SectionRenderer'

/**
 * Revalidate daily. This exists only for the Medium importer — native content
 * is baked at build time by the publish-triggers-rebuild flow, so nothing else
 * here needs a timer.
 */
export const revalidate = 86400

export default async function Home() {
  const settings = getSettings()
  const layout = getLayout()
  const customSections = getCustomSections()

  const native = getNativeArticles()
  const imported =
    settings.features.mediumImport && settings.features.mediumHandle
      ? await fetchMediumArticles(settings.features.mediumHandle)
      : []

  // Native articles win on a slug collision — they are the copy the owner
  // controls, and the one that renders in full.
  const seen = new Set(native.map((a) => a.slug))
  const articles = [...native, ...imported.filter((a) => !seen.has(a.slug))].sort((a, b) =>
    b.date.localeCompare(a.date),
  )

  const customTitles = new Map(customSections.map((s) => [`custom:${s.slug}`, s.title]))

  const experience = getExperience()
  const projects = getProjects()
  const skills = getSkills()
  const education = getEducation()
  const responsibilities = getResponsibilities()
  const metrics = getMetrics()

  /*
   * Sections listed in the layout that will render nothing, because their
   * collection is empty. The nav drops their anchors — a link that scrolls
   * nowhere is worse than a missing one, and emptying a collection from the CMS
   * is a normal thing for the owner to do.
   */
  const emptyIds = new Set<string>()
  if (!experience.some((e) => e.current) && experience.length === 0) emptyIds.add('current')
  if (!experience.length) emptyIds.add('experience')
  if (!projects.length) emptyIds.add('projects')
  if (!skills.length) emptyIds.add('skills')
  if (!articles.length) emptyIds.add('articles')
  if (!education.length) emptyIds.add('education')
  if (!responsibilities.length) emptyIds.add('responsibilities')
  if (!metrics.length) emptyIds.add('metrics')
  for (const section of customSections) {
    if (!section.items.length) emptyIds.add(`custom:${section.slug}`)
  }

  return (
    <>

      <Nav layout={layout} settings={settings} customTitles={customTitles} emptyIds={emptyIds} />
      <main id="main" className="flex-1">
        <SectionRenderer
          layout={layout}
          content={{
            settings,
            experience,
            projects,
            skills,
            education,
            responsibilities,
            articles,
            metrics,
            customSections,
          }}
        />
      </main>

      <Footer settings={settings} />
    </>
  )
}
