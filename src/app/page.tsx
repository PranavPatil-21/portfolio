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
import { getAllArticles } from '@/lib/articles'
import Footer from '@/components/Footer'
import SideRail from '@/components/SideRail'
import Spotlight from '@/components/Spotlight'
import ScrollProgress from '@/components/ScrollProgress'
import CommandPalette, { type CommandItem } from '@/components/CommandPalette'
import TopBar from '@/components/TopBar'
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

  const articles = await getAllArticles()

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

  /*
   * Everything the palette can jump to: the sections that actually render, then
   * every case study, then the outbound links. Built here rather than inside the
   * palette so it stays a dumb, testable component and the page keeps ownership
   * of what exists.
   */
  const SECTION_LABELS: Record<string, string> = {
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

  const navSections = layout
    .filter((e) => e.visible && e.sectionId !== 'hero' && !emptyIds.has(e.sectionId))
    .flatMap((e) => {
      const label = SECTION_LABELS[e.sectionId] ?? customTitles.get(e.sectionId)
      return label ? [{ id: e.sectionId, label }] : []
    })

  const commandItems: CommandItem[] = [
    ...layout
      .filter((e) => e.visible && e.sectionId !== 'hero' && !emptyIds.has(e.sectionId))
      .flatMap((e) => {
        const label = SECTION_LABELS[e.sectionId] ?? customTitles.get(e.sectionId)
        return label
          ? [{ id: e.sectionId, label, group: 'Sections', href: `#${e.sectionId}` }]
          : []
      }),
    ...projects.map((project) => ({
      id: `work-${project.slug}`,
      label: project.title,
      group: 'Case studies',
      href: `/work/${project.slug}`,
    })),
    {
      id: 'email',
      label: `Email ${settings.name}`,
      group: 'Contact',
      href: `mailto:${settings.email}`,
    },
    ...(settings.resumePdf
      ? [
          {
            id: 'resume',
            label: 'Download résumé',
            group: 'Contact',
            href: settings.resumePdf,
          },
        ]
      : []),
    ...settings.socials
      .filter((social) => !social.url.startsWith('mailto:'))
      .map((social) => ({
        id: `social-${social.label}`,
        label: social.label,
        group: 'Elsewhere',
        href: social.url,
      })),
  ]

  return (
    <>
      <ScrollProgress />
      <TopBar
        settings={settings}
        variant="home"
        sections={navSections}
        showWriting={articles.length > 0}
      />
      <Spotlight />
      <CommandPalette items={commandItems} />

      {/*
        The split layout: identity and navigation stay put on the left while the
        evidence scrolls on the right. On narrow screens the rail simply stacks
        above the content.
      */}
      <div className="flex min-h-screen flex-col gap-4 px-6 pt-8 pb-16 sm:px-10 lg:grid lg:grid-cols-[minmax(22rem,34rem)_minmax(0,1fr)] lg:gap-0 lg:px-0 lg:py-0">
        <SideRail settings={settings} layout={layout} emptyIds={emptyIds} />

        {/*
          The content column is visually a separate surface from the rail: a
          hairline divider, a slight tonal lift and its own padding. Without
          that separation the two halves read as one undifferentiated page and
          the sticky rail looks like content that failed to scroll.
        */}
        <main
          id="main"
          className="relative z-10 min-w-0 pt-6 lg:border-l lg:border-[var(--hairline)] lg:bg-[var(--surface)] lg:pt-10 lg:pr-12 lg:pb-24 lg:pl-14 xl:pr-20 xl:pl-20"
        >
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
      </div>

      <Footer settings={settings} />
    </>
  )
}
