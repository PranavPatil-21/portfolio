import {
  getLayout,
  getExperience,
  getProjects,
  getSkills,
  getEducation,
  getResponsibilities,
  getMetrics,
  getCustomSections,
} from '@/content'
import { getAllArticles } from '@/lib/articles'

export const SECTION_LABELS: Record<string, string> = {
  current: 'Current role',
  metrics: 'Impact',
  experience: 'Experience',
  projects: 'Case studies',
  skills: 'Skills',
  articles: 'Writing',
  education: 'Education',
  responsibilities: 'Leadership',
  contact: 'Contact',
}

/**
 * The sections that will actually render, in the owner's chosen order.
 *
 * Shared by the header, the rail and the command palette so they cannot
 * disagree about what exists. An earlier version computed this in the page
 * only, which is how `/articles` ended up advertised in the navigation while
 * rendering nothing: a link that scrolls or navigates nowhere reads as a broken
 * site rather than an empty section.
 */
export async function getNavSections(): Promise<{ id: string; label: string }[]> {
  const layout = getLayout()
  const customSections = getCustomSections()
  const customTitles = new Map(customSections.map((s) => [`custom:${s.slug}`, s.title]))

  const empty = new Set<string>()
  if (!getExperience().length) {
    empty.add('experience')
    empty.add('current')
  }
  if (!getProjects().length) empty.add('projects')
  if (!getSkills().length) empty.add('skills')
  if (!getEducation().length) empty.add('education')
  if (!getResponsibilities().length) empty.add('responsibilities')
  if (!getMetrics().length) empty.add('metrics')
  if (!(await getAllArticles()).length) empty.add('articles')
  for (const section of customSections) {
    if (!section.items.length) empty.add(`custom:${section.slug}`)
  }

  return layout
    .filter((entry) => entry.visible && entry.sectionId !== 'hero' && !empty.has(entry.sectionId))
    .flatMap((entry) => {
      const label = SECTION_LABELS[entry.sectionId] ?? customTitles.get(entry.sectionId)
      return label ? [{ id: entry.sectionId, label }] : []
    })
}
