import type { ReactNode } from 'react'

/**
 * A small metadata pill — tech, tags, categories.
 *
 * Low-contrast on purpose: tags are supporting evidence, and a wall of them
 * competing with a heading is what makes a portfolio read as a CV dump.
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
      className={`rounded-md border border-[var(--hairline)] px-2 py-0.5 font-mono text-[11px] text-[var(--subtle)] ${className}`}
    >
      {children}
    </span>
  )
}

export default Tag
