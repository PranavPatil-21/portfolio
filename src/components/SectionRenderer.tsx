import type {
  Settings,
  Experience as ExperienceType,
  Project,
  Article,
  SkillGroup,
  Education as EducationType,
  Responsibility,
  CustomSection as CustomSectionType,
  LayoutEntry,
  Metric,
} from '@/content'

import Hero from '@/components/sections/Hero'
import CurrentRole from '@/components/sections/CurrentRole'
import Experience from '@/components/sections/Experience'
import Projects from '@/components/sections/Projects'
import Skills from '@/components/sections/Skills'
import Education from '@/components/sections/Education'
import Responsibilities from '@/components/sections/Responsibilities'
import Contact from '@/components/sections/Contact'
import Articles from '@/components/sections/Articles'
import CustomSection from '@/components/sections/CustomSection'
import Metrics from '@/components/sections/Metrics'

export type SiteContent = {
  settings: Settings
  experience: ExperienceType[]
  projects: Project[]
  skills: SkillGroup[]
  education: EducationType[]
  responsibilities: Responsibility[]
  articles: Article[]
  metrics: Metric[]
  customSections: CustomSectionType[]
}

/**
 * Renders the page in the order the owner set in `content/layout.json`.
 *
 * Ordering is data, not code: the owner drags rows in `/admin` and the page
 * reorders. Two defensive rules matter here, because `layout.json` and the
 * content collections are edited independently and can drift apart:
 *
 *  - an entry with `visible: false` is skipped;
 *  - an unrecognised `sectionId` is skipped silently rather than throwing.
 *
 * Without the second rule, deleting a custom section without also removing its
 * layout row would crash the whole site — which is exactly the class of mistake
 * a browser-based editor invites.
 */
export function SectionRenderer({
  layout,
  content,
}: {
  layout: LayoutEntry[]
  content: SiteContent
}) {
  const custom = new Map(content.customSections.map((s) => [`custom:${s.slug}`, s]))

  return (
    <>
      {layout
        .filter((entry) => entry.visible)
        .map((entry) => {
          const node = renderSection(entry.sectionId, content, custom)
          return node ? <div key={entry.sectionId}>{node}</div> : null
        })}
    </>
  )
}

function renderSection(
  id: string,
  c: SiteContent,
  custom: Map<string, CustomSectionType>,
) {
  switch (id) {
    case 'hero':
      return <Hero settings={c.settings} />
    case 'current': {
      /*
       * The role the owner holds today, given its own featured block rather
       * than being one row in a timeline. "Emphasise my current experience"
       * is the brief; `current: true` is how the CMS expresses which one that
       * is, with the most recent role as a fallback if the flag is unset.
       */
      const role = c.experience.find((e) => e.current) ?? c.experience[0]
      return role ? <CurrentRole role={role} settings={c.settings} /> : null
    }
    case 'metrics':
      return <Metrics items={c.metrics} />
    case 'experience':
      return <Experience items={c.experience} />
    case 'projects':
      return <Projects items={c.projects} />
    case 'skills':
      return <Skills groups={c.skills} />
    case 'articles':
      return <Articles items={c.articles} />
    case 'education':
      return <Education items={c.education} />
    case 'responsibilities':
      return <Responsibilities items={c.responsibilities} />
    case 'contact':
      return <Contact settings={c.settings} />
    default: {
      const section = custom.get(id)
      return section ? <CustomSection section={section} /> : null
    }
  }
}

export default SectionRenderer
