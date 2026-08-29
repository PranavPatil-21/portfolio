import type { ReactNode } from 'react'

/**
 * The frame every section sits in.
 *
 * Sized for the scrolling content column beside the sticky rail, so it carries
 * no page-level centering of its own. On narrow screens the rail stacks above
 * and this simply becomes the page.
 *
 * The heading is ONE `<h2>`, restyled across breakpoints — a small sticky label
 * on mobile, a full heading on desktop. An earlier version rendered two copies
 * and hid one per breakpoint, which meant the accessible heading was
 * `display: none` on desktop: `aria-labelledby` pointed at a hidden node and a
 * screen reader got no heading at all.
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
    <section id={id} aria-labelledby={headingId} className="scroll-mt-16 py-14 first:pt-0 md:py-20">
      <div className="sticky top-0 z-20 -mx-6 mb-6 bg-[var(--background)]/85 px-6 py-4 backdrop-blur-sm lg:static lg:mx-0 lg:mb-8 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        {label ? <p className="eyebrow mb-3 hidden lg:block">{label}</p> : null}
        <h2
          id={headingId}
          className="font-mono text-[11px] tracking-[0.16em] text-[var(--subtle)] uppercase lg:font-sans lg:text-[clamp(1.5rem,2.6vw,2.125rem)] lg:leading-[1.12] lg:font-semibold lg:tracking-[-0.02em] lg:text-[var(--foreground)] lg:normal-case"
        >
          {title}
        </h2>
      </div>

      {subtitle ? (
        <p className="mb-10 hidden max-w-xl text-[15px] leading-relaxed text-[var(--muted)] lg:block">
          {subtitle}
        </p>
      ) : null}

      {children}

      {action ? <div className="mt-8">{action}</div> : null}
    </section>
  )
}

export default SectionShell
