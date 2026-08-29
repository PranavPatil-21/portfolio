'use client'

import { useEffect, useState, type ReactNode } from 'react'
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
 * ## Why the animation only starts after mount
 *
 * `whileInView` renders the element at its `initial` state, and that state is
 * serialised into the *server* HTML — the element ships as
 * `style="opacity:0"`. The reveal then depends on an `IntersectionObserver`
 * that only exists once JavaScript has run.
 *
 * The failure that follows is severe and silent: with JavaScript disabled, or
 * in any environment without `IntersectionObserver`, the observer meant to
 * reveal the content never exists and the section stays invisible forever. It
 * also evades the obvious test — Playwright's `toBeVisible()` checks `display`
 * and `visibility`, not opacity, so a fully transparent page passes.
 *
 * So the server, and the first client paint, render plain visible content. The
 * animation is swapped in only once the client has confirmed it can finish what
 * it starts. The cost is that the reveal begins after hydration rather than at
 * first paint. Visible content beats invisible content.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduced = useReducedMotion()
  const [canAnimate, setCanAnimate] = useState(false)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    setCanAnimate(true)
  }, [])

  if (reduced || !canAnimate) {
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
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default Reveal
