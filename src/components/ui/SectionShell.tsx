import type { ReactNode } from 'react'

/**
 * The frame every section sits in.
 *
 * The heading is a pair: an outlined italic serif phrase followed by a heavy
 * sans one. Two voices in one line is the core typographic move of this design
 * — it keeps very large headings from reading as shouting.
 *
 * `title` is the solid half and `eyebrow` the outlined half; both come from
 * content, so the pairing survives the owner renaming a section.
 */
export function SectionShell({
  id,
  title,
  subtitle,
  eyebrow,
  index,
  children,
}: {
  id: string
  title: string
  subtitle?: string
  eyebrow?: string
  index?: string
  children: ReactNode
}) {
  const headingId = `${id}-heading`

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="relative scroll-mt-24 px-6 py-24 sm:px-10 md:py-36"
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-14 md:mb-20">
          {index ? (
            <p className="mb-5 font-mono text-[10px] tracking-[0.35em] text-[var(--foreground)]/55 uppercase">
              {index}
            </p>
          ) : null}

          <h2
            id={headingId}
            className="flex flex-col text-5xl leading-[0.85] font-black tracking-tighter sm:text-7xl md:text-8xl"
          >
            {eyebrow ? <span className="ghost block">{eyebrow}</span> : null}
            <span className="-mt-1 block md:-mt-3">{title}</span>
          </h2>

          {subtitle ? (
            <p className="mt-7 max-w-xl text-sm leading-relaxed text-[var(--foreground)]/60">
              {subtitle}
            </p>
          ) : null}
        </header>

        {children}
      </div>
    </section>
  )
}

export default SectionShell
