import { SectionShell } from '@/components/ui/SectionShell'
import { Reveal } from '@/components/ui/Reveal'
import type { SkillGroup } from '@/content/schemas'

/**
 * Skills as quiet typographic clusters.
 *
 * Deliberately the least decorated section on the page. For a product role the
 * stack is *supporting evidence*, not the argument — Metrics and Experience
 * make the case, and this exists so a reader who wants to check the substrate
 * can, without it competing for attention. Hence no cards, no pills, no accent
 * fills: a hairline, a mono label, and a comma-free run of items.
 *
 * Groups with no items are skipped individually; an empty group list omits the
 * whole section.
 */
export function Skills({ groups }: { groups: SkillGroup[] }) {
  if (groups.length === 0) return null

  return (
    <SectionShell
      id="skills"
      eyebrow="Technical"
      title="Skills"
      index="04 / SKILLS"
      subtitle="The substrate under the work above."
    >
      <ul className="grid gap-px border-y border-[var(--hairline)] bg-[var(--hairline)] sm:grid-cols-2">
        {groups.map((group, i) => (
          <li key={group.label} className="bg-[var(--background)]">
            <Reveal delay={i * 0.05} className="h-full">
              <div className="flex h-full flex-col gap-4 px-1 py-8 sm:px-6">
                <h3 className="font-mono text-[10px] tracking-[0.35em] text-[var(--foreground)]/55 uppercase">
                    {group.label}
                </h3>
                {group.items.length > 0 ? (
                  <ul className="flex flex-wrap gap-x-5 gap-y-2">
                      {group.items.map((item) => (
                        <li
                          key={item}
                          className="text-sm text-[var(--foreground)]/55 transition-colors duration-300 hover:text-[var(--foreground)] motion-reduce:transition-none"
                        >
                          {item}
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}

export default Skills
