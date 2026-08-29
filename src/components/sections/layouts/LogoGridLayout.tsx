import type { CustomLayoutProps } from '../CustomSection'
import { Tag } from '@/components/ui/Tag'
import { Reveal } from '@/components/ui/Reveal'

/**
 * An image-forward grid for logos and badges — credentials, sponsors, press.
 *
 * Every tile still carries its title as real text below the mark: a logo wall is
 * unreadable to screen readers and to anyone whose images failed to load if the
 * name lives only inside the image.
 */
export function LogoGridLayout({ items }: CustomLayoutProps) {
  return (
    <ul className="grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`}>
          <Reveal delay={index * 0.05}>
            <figure className="m-0 flex h-full flex-col items-center gap-3 rounded-xl border border-current/10 bg-current/[0.03] p-5 text-center transition-colors duration-300 hover:border-current/25 hover:bg-current/[0.06] motion-reduce:transition-none">
              <div className="flex h-16 w-full items-center justify-center">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.imageAlt ?? ''}
                    loading="lazy"
                    className="max-h-16 w-auto max-w-full object-contain opacity-90 transition-opacity duration-300 hover:opacity-100 motion-reduce:transition-none"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="font-mono text-2xl font-semibold text-current/25"
                  >
                    {item.title.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <figcaption className="flex flex-col items-center gap-1">
                <span className="text-sm font-semibold leading-snug">{item.title}</span>
                {item.subtitle ? (
                  <span className="text-xs text-current/70">{item.subtitle}</span>
                ) : null}
                {item.date ? (
                  <span className="font-mono text-xs uppercase tracking-widest text-current/50">
                    {item.date}
                  </span>
                ) : null}
                {item.description ? (
                  <span className="text-xs leading-relaxed text-current/70">
                    {item.description}
                  </span>
                ) : null}
              </figcaption>

              {item.tags.length > 0 ? (
                <ul className="flex list-none flex-wrap justify-center gap-2 p-0">
                  {item.tags.map((tag) => (
                    <li key={tag}>
                      <Tag>{tag}</Tag>
                    </li>
                  ))}
                </ul>
              ) : null}

              {item.links.length > 0 ? (
                <ul className="mt-auto flex list-none flex-wrap justify-center gap-3 p-0 pt-1">
                  {item.links.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        className="text-xs font-medium underline-offset-4 transition-colors hover:underline motion-reduce:transition-none"
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
