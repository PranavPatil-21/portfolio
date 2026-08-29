import type { ReactNode } from 'react'

type SectionShellProps = {
  /** Anchor target — must match the `sectionId` in `content/layout.json`. */
  id: string
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}

/**
 * The frame every section on the page shares: a semantic `<section>` carrying
 * the anchor id, a real `<h2>` (so the document outline is navigable by screen
 * reader and legible to a crawler), and a scroll margin so in-page navigation
 * does not park the heading under the sticky nav.
 */
export function SectionShell({
  id,
  title,
  subtitle,
  children,
  className = '',
}: SectionShellProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`scroll-mt-24 py-20 sm:py-28 ${className}`.trim()}
    >
      <div className="mx-auto w-full max-w-5xl px-6">
        <header className="mb-10 max-w-2xl">
          <h2
            id={`${id}-heading`}
            className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            <span className="bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
              {title}
            </span>
          </h2>
          {subtitle ? <p className="mt-3 text-base text-muted">{subtitle}</p> : null}
          <span
            aria-hidden="true"
            className="mt-5 block h-px w-24 bg-gradient-to-r from-accent to-transparent"
          />
        </header>
        {children}
      </div>
    </section>
  )
}

export default SectionShell
