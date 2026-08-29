import { SectionShell } from '@/components/ui/SectionShell'
import { Reveal } from '@/components/ui/Reveal'
import type { SkillGroup } from '@/content/schemas'

/**
 * Skills as quiet typographic clusters.
 *
 * Deliberately the least decorated section on the page. For a product role the
 * stack is *supporting evidence*, not the argument — Impact, Experience and the
 * project case studies make the case, and this exists so a reader who wants to
 * check the substrate can, without it competing for attention. Hence no cards,
 * no pills, no accent fills: a label, a hairline, and a run of items.
 *
 * Groups with no items render their label and nothing else; an empty group list
 * omits the whole section.
 */
export function Skills({ groups }: { groups: SkillGroup[] }) {
  if (groups.length === 0) return null

  return (
    <SectionShell
      id="skills"
      eyebrow="Toolkit"
      title="Skills"
      subtitle="The substrate under the work above."
    >
      <ul className="flex flex-col">
        {groups.map((group, i) => (
          <li
            key={group.label}
            className="border-t border-[var(--hairline)] py-5 first:border-t-0 first:pt-0"
          >
            <Reveal delay={i * 0.04}>
              <div className="grid gap-x-8 gap-y-2 md:grid-cols-[9rem_minmax(0,1fr)]">
                <h3 className="eyebrow pt-1">{group.label}</h3>
                {group.items.length > 0 ? (
                  <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-[var(--muted)]">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
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
