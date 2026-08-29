import type { CustomLayoutProps } from '../CustomSection'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'

/**
 * The default layout: a responsive grid of raised surfaces. Best for items that
 * carry a description worth reading (Talks, Publications).
 */
export function CardsLayout({ items }: CustomLayoutProps) {
  return (
    <ul className="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="h-full">
          <Reveal delay={index * 0.06}>
            <Card className="flex h-full flex-col gap-3 transition-transform duration-300 hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.imageAlt ?? ''}
                  loading="lazy"
                  className="mb-1 h-40 w-full rounded-lg object-cover"
                />
              ) : null}

              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold leading-snug">{item.title}</h3>
                {item.subtitle ? (
                  <p className="text-sm text-current/70">{item.subtitle}</p>
                ) : null}
                {item.date ? (
                  <p className="font-mono text-xs uppercase tracking-wide text-current/50">
                    {item.date}
                  </p>
                ) : null}
              </div>

              {item.description ? (
                <p className="text-sm leading-relaxed text-current/80">{item.description}</p>
              ) : null}

              {item.tags.length > 0 ? (
                <ul className="mt-auto flex list-none flex-wrap gap-2 p-0 pt-2">
                  {item.tags.map((tag) => (
                    <li key={tag}>
                      <Tag>{tag}</Tag>
                    </li>
                  ))}
                </ul>
              ) : null}

              {item.links.length > 0 ? (
                <ul className="flex list-none flex-wrap gap-4 p-0 pt-1">
                  {item.links.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        className="text-sm font-medium underline-offset-4 transition-colors hover:underline motion-reduce:transition-none"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          </Reveal>
        </li>
      ))}
    </ul>
  )
}

export default CardsLayout
