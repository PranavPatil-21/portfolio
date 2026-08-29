import { SectionShell } from '@/components/ui/SectionShell'
import { Timeline, TimelineItem, TimelineBullets, formatRange } from './Experience'
import type { Education as EducationItem } from '@/content/schemas'

/**
 * Academic history, rendered on the same rail as Experience so the two read as
 * one continuous story. Note the field names differ from Experience: the body
 * copy lives in `details`, and there is no `current` flag — an absent `end`
 * is what signals an in-progress course.
 */
export function Education({ items }: { items: EducationItem[] }) {
  if (items.length === 0) return null

  return (
    <SectionShell id="education" title="Education" subtitle="Where I learned the fundamentals.">
      <Timeline>
        {items.map((item, i) => (
          <TimelineItem
            key={item.slug || `${item.institution}-${item.start}`}
            heading={item.institution}
            subheading={item.degree}
            meta={item.location || undefined}
            period={formatRange(item.start, item.end)}
            delay={i * 0.06}
          >
            <TimelineBullets bullets={item.details} />
          </TimelineItem>
        ))}
      </Timeline>
    </SectionShell>
  )
}

export default Education
