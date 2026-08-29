import type { CustomLayoutProps } from '../CustomSection'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'

/**
 * Hairline-separated rows. Best for dense enumerations where scanning matters
 * more than dwelling — long certification or publication lists.
 *
 * Deliberately the flattest of the four: no surfaces, no rail, no tiles. Just
 * rules, with the date and any links pushed to the far edge of the row. Exactly
 * one `<li>` per item, and no `<ol>`, `<figure>` or `Card` — `custom.test.tsx`
 * pins all four of those to keep this distinct from its neighbours.
 */
export function ListLayout({ items }: CustomLayoutProps) {
  return (
    <ul className="list-none divide-y divide-[var(--hairline)] border-y border-[var(--hairline)] p-0">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`}>
          <Reveal delay={index * 0.04}>
            <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-baseline sm:gap-8">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.imageAlt ?? ''}
                    loading="lazy"
                    className="mt-0.5 h-6 w-6 shrink-0 rounded object-contain"
                  />
                ) : null}

                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
                    {item.title}
                  </h3>

                  {item.subtitle ? (
                    <p className="mt-0.5 text-sm text-[var(--muted)]">{item.subtitle}</p>
                  ) : null}

                  {item.description ? (
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
                      {item.description}
                    </p>
                  ) : null}

                  {item.tags.length > 0 ? (
                    <ul className="mt-2.5 flex list-none flex-wrap gap-1.5 p-0">
                      {item.tags.map((tag) => (
                        <li key={tag}>
                          <Tag>{tag}</Tag>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-baseline gap-x-4 gap-y-1">
                {item.date ? <span className="eyebrow tabular">{item.date}</span> : null}

                {item.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    className="text-[13px] text-[var(--accent-readable)] underline-offset-4 transition-colors duration-200 hover:underline motion-reduce:transition-none"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </Reveal>
        </li>
      ))}
    </ul>
  )
}

export default ListLayout
