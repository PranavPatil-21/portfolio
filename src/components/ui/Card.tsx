import type { ReactNode } from 'react'

/** A surface. Border-led rather than fill-led, so it reads on near-black. */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] backdrop-blur-sm transition duration-500 hover:border-[color-mix(in_oklab,var(--accent)_45%,transparent)] motion-reduce:transition-none ${className}`}
    >
      {children}
    </div>
  )
}

export default Card
