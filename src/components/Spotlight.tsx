'use client'

import { useEffect, useRef } from 'react'

/**
 * A soft pool of light that follows the cursor.
 *
 * Decorative, but it does real work: a large flat dark page reads as inert, and
 * this gives the surface a sense of depth and responsiveness without adding
 * anything the reader has to look at or interpret.
 *
 * Position is written straight to a CSS custom property from the pointer
 * handler rather than held in React state — a re-render per mouse move would be
 * both janky and pointless, since nothing else in the tree needs the value.
 */
export default function Spotlight() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Pointer-driven decoration is meaningless on touch, and animating a large
    // radial gradient there costs real frames.
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const el = ref.current
    if (!el) return

    let frame = 0
    const onMove = (event: PointerEvent) => {
      // Coalesce to one write per frame; pointermove can fire far faster.
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        el.style.setProperty('--x', `${event.clientX}px`)
        el.style.setProperty('--y', `${event.clientY}px`)
        el.style.opacity = '1'
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-testid="spotlight"
      className="pointer-events-none fixed inset-0 z-30 opacity-0 transition-opacity duration-500 motion-reduce:hidden"
      style={{
        background:
          'radial-gradient(38rem circle at var(--x, 50%) var(--y, 0px), color-mix(in oklab, var(--accent) 9%, transparent), transparent 68%)',
      }}
    />
  )
}
