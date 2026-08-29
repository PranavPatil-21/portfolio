import type { CustomLayoutProps } from '../CustomSection'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'

/**
 * An image-forward grid for logos and badges — credentials, sponsors, press.
 *
 * Every tile still carries its title as real text below the mark: a logo wall is
 * unreadable to screen readers, and to anyone whose images failed to load, if the
 * name lives only inside the image. The `<figure>` is this layout's structural
 * signature, the way `<ol>` is the timeline's.
 */
export function LogoGridLayout({ items }: CustomLayoutProps) {
  return (
    <ul className="grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`}>
          <Reveal delay={index * 0.04}>
            <figure className="group m-0 flex h-full flex-col items-center gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-5 text-center transition-colors duration-200 hover:border-[color-mix(in_oklab,var(--accent)_38%,transparent)] motion-reduce:transition-none">
              <div className="flex h-12 w-full items-center justify-center">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.imageAlt ?? ''}
                    loading="lazy"
                    className="max-h-12 w-auto max-w-full object-contain opacity-70 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="font-mono text-xl font-semibold text-[var(--subtle)]"
                  >
                    {item.title.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <figcaption className="flex flex-col items-center gap-1">
                <span className="text-sm leading-snug font-semibold text-[var(--foreground)]">
                  {item.title}
                </span>

                {item.subtitle ? (
                  <span className="text-[13px] text-[var(--muted)]">{item.subtitle}</span>
                ) : null}

                {item.date ? <span className="eyebrow tabular">{item.date}</span> : null}

                {item.description ? (
                  <span className="text-[13px] leading-relaxed text-[var(--muted)]">
                    {item.description}
                  </span>
                ) : null}
              </figcaption>

              {item.tags.length > 0 ? (
                <ul className="flex list-none flex-wrap justify-center gap-1.5 p-0">
                  {item.tags.map((tag) => (
                    <li key={tag}>
                      <Tag>{tag}</Tag>
                    </li>
                  ))}
                </ul>
              ) : null}

              {item.links.length > 0 ? (
                <ul className="mt-auto flex list-none flex-wrap justify-center gap-x-4 gap-y-1 p-0 pt-1">
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
            </figure>
          </Reveal>
        </li>
      ))}
    </ul>
  )
}

export default LogoGridLayout
