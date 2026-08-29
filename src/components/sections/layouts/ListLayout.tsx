import type { CustomLayoutProps } from '../CustomSection'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'

/**
 * Compact divider-separated rows. Best for dense enumerations where scanning
 * matters more than dwelling — long certification or publication lists.
 */
export function ListLayout({ items }: CustomLayoutProps) {
  return (
    <ul className="list-none divide-y divide-current/10 border-y border-current/10 p-0">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`}>
          <Reveal delay={index * 0.04}>
            <div className="flex flex-col gap-2 py-4 transition-colors duration-200 hover:bg-current/[0.04] motion-reduce:transition-none sm:flex-row sm:items-baseline sm:gap-6 sm:px-2">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.imageAlt ?? ''}
                    loading="lazy"
                    className="h-8 w-8 shrink-0 rounded object-contain"
                  />
                ) : null}

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold sm:text-base">{item.title}</h3>
                  {item.subtitle ? (
                    <p className="text-sm text-current/70">{item.subtitle}</p>
                  ) : null}
                  {item.description ? (
                    <p className="mt-1 text-sm leading-relaxed text-current/70">
                      {item.description}
                    </p>
                  ) : null}

                  {item.tags.length > 0 ? (
                    <ul className="mt-2 flex list-none flex-wrap gap-2 p-0">
                      {item.tags.map((tag) => (
                        <li key={tag}>
                          <Tag>{tag}</Tag>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-baseline gap-4">
                {item.date ? (
                  <span className="font-mono text-xs uppercase tracking-widest text-current/50">
                    {item.date}
                  </span>
                ) : null}
                {item.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    className="text-sm font-medium underline-offset-4 transition-colors hover:underline motion-reduce:transition-none"
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
