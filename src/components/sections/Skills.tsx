import { SectionShell } from '@/components/ui/SectionShell'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'
import type { SkillGroup } from '@/content/schemas'

/**
 * Skills as labelled tag clusters — one card per group, so the grouping is
 * visible structure rather than a wall of undifferentiated pills. Groups with
 * no items are skipped individually; an empty group list omits the section.
 */
export function Skills({ groups }: { groups: SkillGroup[] }) {
  if (groups.length === 0) return null

  return (
    <SectionShell id="skills" title="Skills" subtitle="The tools I reach for.">
      <div className="grid gap-6 sm:grid-cols-2">
        {groups.map((group, i) => (
          <Reveal key={group.label} delay={i * 0.06} className="h-full">
            <Card className="h-full">
              <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--accent-readable)]">
                {group.label}
              </h3>
              {group.items.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li key={item}>
                      <Tag>{item}</Tag>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}

export default Skills
