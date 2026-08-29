import type { CustomLayoutProps } from '../CustomSection'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'

/**
 * A vertical rail with an accent node per item. Best for anything chronological
 * (Awards, Certifications) where the date carries as much meaning as the title.
 *
 * The `<ol>` plus the rule down its left edge is the structural signature of
 * this layout — it is what makes it distinguishable from the list layout, which
 * is otherwise the nearest sibling. `custom.test.tsx` pins that.
 */
export function TimelineLayout({ items }: CustomLayoutProps) {
  return (
    <ol className="relative ml-1 list-none border-l border-[var(--hairline)] p-0">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="relative pb-8 pl-6 last:pb-0 sm:pl-8">
          <span
            aria-hidden="true"
            className="absolute top-[0.4rem] left-0 h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--accent)]"
          />

          <Reveal delay={index * 0.05}>
            {item.date ? <p className="eyebrow tabular">{item.date}</p> : null}

            <h3 className="mt-1.5 text-[15px] leading-snug font-semibold tracking-tight text-[var(--foreground)]">
              {item.title}
            </h3>

            {item.subtitle ? (
              <p className="mt-1 text-sm text-[var(--muted)]">{item.subtitle}</p>
            ) : null}

            {item.image ? (
              <img
                src={item.image}
                alt={item.imageAlt ?? ''}
                loading="lazy"
                className="mt-3 h-12 w-auto max-w-full rounded object-contain"
              />
            ) : null}

            {item.description ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
                {item.description}
              </p>
            ) : null}

            {item.tags.length > 0 ? (
              <ul className="mt-3 flex list-none flex-wrap gap-1.5 p-0">
                {item.tags.map((tag) => (
                  <li key={tag}>
                    <Tag>{tag}</Tag>
                  </li>
                ))}
              </ul>
            ) : null}

            {item.links.length > 0 ? (
              <ul className="mt-3 flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
                {item.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      className="text-[13px] text-[var(--accent-readable)] underline-offset-4 transition-colors duration-200 hover:underline motion-reduce:transition-none"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </Reveal>
        </li>
      ))}
    </ol>
  )
}

export default TimelineLayout
