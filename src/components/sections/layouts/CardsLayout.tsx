import type { CustomLayoutProps } from '../CustomSection'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'

/**
 * The default layout: a responsive grid of surfaces. Best for items that carry
 * a description worth reading (Talks, Publications).
 *
 * Exactly one `Card` per item, and no `<ol>` or `<figure>` anywhere — the
 * unknown-layout fallback test counts Cards to prove it landed here rather than
 * in one of the other three layouts, and `custom.test.tsx` pins the absence of
 * the other two layouts' signature elements.
 */
export function CardsLayout({ items }: CustomLayoutProps) {
  return (
    <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="h-full">
          <Reveal delay={index * 0.05}>
            <Card className="flex h-full flex-col p-5">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.imageAlt ?? ''}
                  loading="lazy"
                  className="mb-4 h-32 w-full rounded-lg object-cover"
                />
              ) : null}

              {item.date ? <p className="eyebrow tabular">{item.date}</p> : null}

              <h3 className="mt-2 text-[15px] leading-snug font-semibold tracking-tight text-balance text-[var(--foreground)]">
                {item.title}
              </h3>

              {item.subtitle ? (
                <p className="mt-1 text-sm text-[var(--muted)]">{item.subtitle}</p>
              ) : null}

              {item.description ? (
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  {item.description}
                </p>
              ) : null}

              <div className="mt-auto">
                {item.tags.length > 0 ? (
                  <ul className="mt-4 flex list-none flex-wrap gap-1.5 p-0">
                    {item.tags.map((tag) => (
                      <li key={tag}>
                        <Tag>{tag}</Tag>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {item.links.length > 0 ? (
                  <ul className="mt-4 flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
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
              </div>
            </Card>
          </Reveal>
        </li>
      ))}
    </ul>
  )
}

export default CardsLayout
