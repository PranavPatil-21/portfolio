import { SectionShell } from '@/components/ui/SectionShell'
import { CredentialList, CredentialRow, formatRange } from './Education'
import type { Responsibility } from '@/content/schemas'

/**
 * Positions of responsibility — societies, committees, student bodies.
 *
 * Shares Education's quiet credential rail rather than Experience's headline
 * timeline: this is corroboration, and it should read that way. `organisation`
 * is the British spelling the frozen schema uses; do not "correct" it.
 */
export function Responsibilities({ items }: { items: Responsibility[] }) {
  if (items.length === 0) return null

  return (
    <SectionShell
      id="responsibilities"
      index="07 / RESPONSIBILITIES"
      eyebrow="Leading"
      title="Responsibilities"
      subtitle="Teams I have led and rooms I have been accountable in."
    >
      <CredentialList>
        {items.map((item, i) => (
          <CredentialRow
            key={item.slug || `${item.organisation}-${item.start}`}
            period={formatRange(item.start, item.end)}
            heading={item.role}
            subheading={item.organisation}
            meta={item.location || undefined}
            bullets={item.bullets}
            delay={i * 0.06}
          />
        ))}
      </CredentialList>
    </SectionShell>
  )
}

export default Responsibilities
