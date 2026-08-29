import { SectionShell } from '@/components/ui/SectionShell'
import { Timeline, TimelineItem, TimelineBullets, formatRange } from './Experience'
import type { Responsibility } from '@/content/schemas'

/**
 * Positions of responsibility — societies, committees, student bodies. Same
 * rail as Experience and Education. `organisation` is the British spelling the
 * frozen schema uses; do not "correct" it.
 */
export function Responsibilities({ items }: { items: Responsibility[] }) {
  if (items.length === 0) return null

  return (
    <SectionShell
      id="responsibilities"
      title="Responsibilities"
      subtitle="Teams I have led and events I have run."
    >
      <Timeline>
        {items.map((item, i) => (
          <TimelineItem
            key={item.slug || `${item.organisation}-${item.start}`}
            heading={item.role}
            subheading={item.organisation}
            meta={item.location || undefined}
            period={formatRange(item.start, item.end)}
            delay={i * 0.06}
          >
            <TimelineBullets bullets={item.bullets} />
          </TimelineItem>
        ))}
      </Timeline>
    </SectionShell>
  )
}

export default Responsibilities
