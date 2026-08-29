import type { CustomLayoutProps } from '../CustomSection'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'

/**
 * Hairline-separated rows. Best for dense enumerations where scanning matters
 * more than dwelling — long certification or publication lists.
 *
 * Deliberately the flattest of the four: no surfaces, no rail, no tiles. Just
 * rules and a mono date pushed to the far edge of the row.
 */
export function ListLayout({ items }: CustomLayoutProps) {
  return (
    <ul className="list-none divide-y divide-[var(--hairline)] border-y border-[var(--hairline)] p-0">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`}>
          <Reveal delay={index * 0.04}>
            <div className="group flex flex-col gap-4 py-6 transition-colors duration-300 motion-reduce:transition-none sm:flex-row sm:items-baseline sm:gap-10">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.imageAlt ?? ''}
                    loading="lazy"
                    className="mt-1 h-8 w-8 shrink-0 rounded object-contain"
                  />
                ) : null}

                <div className="min-w-0">
                  <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)] transition-colors duration-300 group-hover:text-[var(--accent-readable)] motion-reduce:transition-none">
                    {item.title}
                  </h3>

                  {item.subtitle ? (
                    <p className="mt-1 text-sm text-[var(--foreground)]/60">{item.subtitle}</p>
                  ) : null}

                  {item.description ? (
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--foreground)]/60">
                      {item.description}
                    </p>
                  ) : null}

                  {item.tags.length > 0 ? (
                    <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
                      {item.tags.map((tag) => (
                        <li key={tag}>
                          <Tag>{tag}</Tag>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-baseline gap-x-6 gap-y-2">
                {item.date ? (
                  <span className="font-mono text-[10px] tracking-[0.35em] text-[var(--foreground)]/55 uppercase">
                    {item.date}
                  </span>
                ) : null}

                {item.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    className="font-mono text-[10px] tracking-[0.28em] text-[var(--accent-readable)] uppercase underline-offset-8 transition-colors duration-300 hover:underline motion-reduce:transition-none"
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
