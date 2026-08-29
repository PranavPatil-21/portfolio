import type { ReactNode } from 'react'

/** A surface. Border-led rather than fill-led, so it reads on a dark ground. */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-xl border border-[var(--hairline)] bg-[var(--surface)] transition-colors duration-300 hover:border-[color-mix(in_oklab,var(--accent)_38%,transparent)] motion-reduce:transition-none ${className}`}
    >
      {children}
    </div>
  )
}

export default Card
