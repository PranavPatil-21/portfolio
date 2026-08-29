import type { ReactNode } from 'react'

type TagProps = {
  children: ReactNode
  className?: string
}

/** A small pill for a technology, topic or category. */
export function Tag({ children, className = '' }: TagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-hairline bg-surface-strong px-3 py-1 text-xs font-medium tracking-wide text-muted transition-colors hover:border-accent/50 hover:text-foreground ${className}`.trim()}
    >
      {children}
    </span>
  )
}

export default Tag
