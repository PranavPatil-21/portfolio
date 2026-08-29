import type { ReactNode } from 'react'

/**
 * The frame every section sits in.
 *
 * A small mono eyebrow, a restrained heading, and an optional one-line summary.
 * The previous version paired an outlined italic serif with a display-weight
 * sans at 8vw — striking, and it pushed the actual evidence below the fold. A
 * reader skimming for thirty seconds should be reading substance by the time
 * they finish the heading, not still reading the heading.
 */
export function SectionShell({
  id,
  title,
  subtitle,
  eyebrow,
  index,
  children,
  action,
}: {
  id: string
  title: string
  subtitle?: string
  eyebrow?: string
  index?: string
  children: ReactNode
  action?: ReactNode
}) {
  const headingId = `${id}-heading`
  const label = eyebrow ?? index

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-20 border-t border-[var(--hairline)] px-6 py-16 sm:px-8 md:py-24"
    >
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 md:mb-14">
          <div className="max-w-2xl">
            {label ? <p className="eyebrow mb-3">{label}</p> : null}
            <h2 id={headingId} className="heading">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>

        {children}
      </div>
    </section>
  )
}

export default SectionShell
