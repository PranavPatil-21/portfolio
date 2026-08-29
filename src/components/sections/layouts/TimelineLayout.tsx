import type { CustomLayoutProps } from '../CustomSection'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'

/**
 * A vertical rail with a marker per item. Best for anything chronological
 * (Awards, Certifications) where the date carries as much meaning as the title.
 */
export function TimelineLayout({ items }: CustomLayoutProps) {
  return (
    <ol className="relative list-none border-l border-current/15 p-0 pl-6 sm:pl-8">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="relative pb-8 last:pb-0">
          <Reveal delay={index * 0.06}>
            <span
              aria-hidden="true"
              className="absolute -left-[1.6875rem] top-2 h-3 w-3 rounded-full border-2 border-current/40 bg-current/10 sm:-left-[2.1875rem]"
            />

            {item.date ? (
              <p className="font-mono text-xs uppercase tracking-widest text-current/50">
                {item.date}
              </p>
            ) : null}

            <h3 className="mt-1 text-base font-semibold leading-snug">{item.title}</h3>
            {item.subtitle ? (
              <p className="text-sm text-current/70">{item.subtitle}</p>
            ) : null}

            {item.image ? (
              <img
                src={item.image}
                alt={item.imageAlt ?? ''}
                loading="lazy"
                className="mt-3 h-16 w-auto max-w-full rounded-md object-contain"
              />
            ) : null}

            {item.description ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-current/80">
                {item.description}
              </p>
            ) : null}

            {item.tags.length > 0 ? (
              <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
                {item.tags.map((tag) => (
                  <li key={tag}>
                    <Tag>{tag}</Tag>
                  </li>
                ))}
              </ul>
            ) : null}

            {item.links.length > 0 ? (
              <ul className="mt-3 flex list-none flex-wrap gap-4 p-0">
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
          </Reveal>
        </li>
      ))}
    </ol>
  )
}

export default TimelineLayout
