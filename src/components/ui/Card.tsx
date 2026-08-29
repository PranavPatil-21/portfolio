import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
}

/**
 * The site's one surface treatment: a glass panel that sits above the page
 * gradient. Every section reuses it so custom sections (§5.3) inherit the
 * visual language for free.
 */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-hairline bg-surface p-6 shadow-glass backdrop-blur-xl transition duration-300 hover:border-accent/40 hover:shadow-glow ${className}`.trim()}
    >
      {children}
    </div>
  )
}

export default Card
