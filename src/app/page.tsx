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
import SmoothScroll from '@/components/SmoothScroll'
import Cursor from '@/components/Cursor'
import Grain from '@/components/Grain'
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

  return (
    <>
      {/*
        Chrome that wraps the whole page. Each of these renders nothing at all
        when the environment says it should not run — reduced motion for the
        smooth scroll and the cursor, coarse pointers for the cursor — so none
        of them needs a second guard here.
      */}
      <SmoothScroll />
      <Cursor />
      <Grain />

      <Nav layout={layout} settings={settings} customTitles={customTitles} />
      <main id="main" className="flex-1">
        <SectionRenderer
          layout={layout}
          content={{
            settings,
            experience: getExperience(),
            projects: getProjects(),
            skills: getSkills(),
            education: getEducation(),
            responsibilities: getResponsibilities(),
            articles,
            metrics: getMetrics(),
            customSections,
          }}
        />
      </main>
      {/* Masks the hard bottom edge of the viewport so sections drift out of frame. */}
      <div className="bottom-blur" aria-hidden="true" />

      <Footer settings={settings} />
    </>
  )
}
