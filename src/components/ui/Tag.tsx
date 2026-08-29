import type { ReactNode } from 'react'

/**
 * A small metadata pill — tech, tags, categories.
 *
 * Mono and low-contrast on purpose: tags are supporting evidence, and a wall of
 * them competing with a heading is what makes a portfolio read as a CV dump.
 */
export function Tag({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`rounded-full border border-[var(--hairline)] px-3 py-1 font-mono text-[11px] tracking-wide text-[var(--foreground)]/55 ${className}`}
    >
      {children}
    </span>
  )
}

export default Tag
