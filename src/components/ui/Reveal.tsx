'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

type RevealProps = {
  children: ReactNode
  /** Seconds to stagger this element behind its neighbours. */
  delay?: number
  className?: string
}

/**
 * Fades and rises its children as they scroll into view.
 *
 * Two guarantees hold unconditionally:
 *
 * 1. **The children are always in the DOM.** The animation only ever touches
 *    opacity and transform — nothing is conditionally rendered — so crawlers and
 *    screen readers see the full document regardless of whether the animation
 *    ever runs.
 * 2. **`prefers-reduced-motion` wins.** When it is set we render a plain `<div>`
 *    with no motion styling at all, rather than a zero-duration animation that
 *    would still leave a transform on the element.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduced = useReducedMotion()

  if (reduced) {
    return (
      <div data-testid="reveal" className={className}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      data-testid="reveal"
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default Reveal
