import type { CustomLayoutProps } from '../CustomSection'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'

/**
 * A vertical rail with an accent node per item. Best for anything chronological
 * (Awards, Certifications) where the date carries as much meaning as the title.
 *
 * The `<ol>` is the structural signature of this layout — it is what makes it
 * distinguishable from the list layout, which is otherwise the nearest sibling.
 */
export function TimelineLayout({ items }: CustomLayoutProps) {
  return (
    <ol className="relative ml-1 list-none border-l border-[var(--hairline)] p-0">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="relative pb-12 pl-8 last:pb-0 sm:pl-10">
          <span
            aria-hidden="true"
            className="absolute top-2 left-0 h-3 w-3 -translate-x-1/2 rounded-full border border-[var(--accent)] bg-[var(--background)]"
          />

          <Reveal delay={index * 0.06}>
            {item.date ? (
              <p className="font-mono text-[10px] tracking-[0.35em] text-[var(--accent-readable)] uppercase">
                {item.date}
              </p>
            ) : null}

            <h3 className="mt-3 text-lg leading-snug font-semibold tracking-tight text-[var(--foreground)] sm:text-xl">
              {item.title}
            </h3>

            {item.subtitle ? (
              <p className="mt-2 text-sm text-[var(--foreground)]/60">{item.subtitle}</p>
            ) : null}

            {item.image ? (
              <img
                src={item.image}
                alt={item.imageAlt ?? ''}
                loading="lazy"
                className="mt-4 h-16 w-auto max-w-full rounded-lg object-contain"
              />
            ) : null}

            {item.description ? (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--foreground)]/60">
                {item.description}
              </p>
            ) : null}

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
          </Reveal>
        </li>
      ))}
    </ol>
  )
}

export default TimelineLayout
