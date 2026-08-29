import type { CustomLayoutProps } from '../CustomSection'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'

const META = 'font-mono text-[10px] tracking-[0.35em] uppercase text-[var(--foreground)]/55'

/**
 * The default layout: a responsive grid of surfaces that lift on hover. Best for
 * items that carry a description worth reading (Talks, Publications).
 *
 * Exactly one `Card` per item — the unknown-layout fallback test counts them to
 * prove it landed here rather than in one of the other three layouts.
 */
export function CardsLayout({ items }: CustomLayoutProps) {
  return (
    <ul className="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="h-full">
          <Reveal delay={index * 0.06}>
            <Card className="flex h-full flex-col p-6 transition-transform duration-500 hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.imageAlt ?? ''}
                  loading="lazy"
                  className="mb-6 h-40 w-full rounded-xl object-cover"
                />
              ) : null}

              {item.date ? <p className={META}>{item.date}</p> : null}

              <h3 className="mt-3 text-lg leading-snug font-semibold tracking-tight text-balance text-[var(--foreground)]">
                {item.title}
              </h3>

              {item.subtitle ? (
                <p className="mt-2 text-sm text-[var(--foreground)]/60">{item.subtitle}</p>
              ) : null}

              {item.description ? (
                <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]/60">
                  {item.description}
                </p>
              ) : null}

              <div className="mt-auto">
                {item.tags.length > 0 ? (
                  <ul className="mt-5 flex list-none flex-wrap gap-2 p-0">
                    {item.tags.map((tag) => (
                      <li key={tag}>
                        <Tag>{tag}</Tag>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {item.links.length > 0 ? (
                  <ul className="mt-5 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
                    {item.links.map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          className="font-mono text-[10px] tracking-[0.28em] text-[var(--accent-readable)] uppercase underline-offset-8 transition-colors duration-300 hover:underline motion-reduce:transition-none"
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
