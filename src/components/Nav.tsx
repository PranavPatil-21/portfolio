import type { LayoutEntry, Settings } from '@/content'

const LABELS: Record<string, string> = {
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  articles: 'Writing',
  education: 'Education',
  responsibilities: 'Leadership',
  contact: 'Contact',
}

/**
 * Anchors derived from the same layout data that orders the page, so hiding or
 * reordering a section in `/admin` moves its nav entry too. `hero` is excluded:
 * it is the top of the page, not a destination.
 */
export default function Nav({
  layout,
  settings,
  customTitles,
}: {
  layout: LayoutEntry[]
  settings: Settings
  customTitles: Map<string, string>
}) {
  const items = layout
    .filter((e) => e.visible && e.sectionId !== 'hero')
    .map((e) => ({
      id: e.sectionId,
      label: LABELS[e.sectionId] ?? customTitles.get(e.sectionId) ?? null,
    }))
    .filter((i): i is { id: string; label: string } => i.label !== null)

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[var(--background)]/70 backdrop-blur-lg">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3.5 sm:px-10"
      >
        <a
          href="#hero"
          className="text-sm font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
        >
          {settings.name}
        </a>
        <ul className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="rounded-full px-3 py-1.5 text-sm text-[var(--foreground)]/65 transition hover:bg-white/5 hover:text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none motion-reduce:transition-none"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
