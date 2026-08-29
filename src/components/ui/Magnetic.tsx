'use client'

import { useRef, type ReactNode } from 'react'

/**
 * Pulls its child toward the cursor as the cursor approaches.
 *
 * The effect is what makes buttons feel physical rather than painted on. It is
 * driven by direct style writes inside a pointer handler rather than React
 * state: a re-render per mouse move would be both janky and wasteful, and the
 * value is transient — nothing else in the tree needs to know about it.
 */
export function Magnetic({
  children,
  strength = 0.35,
  radius = 90,
  className = '',
}: {
  children: ReactNode
  strength?: number
  radius?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)

  const reduced = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Coarse pointers have no hover: on touch this would only ever fire mid-tap
  // and shift the target out from under the finger.
  const fine = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: fine)').matches

  const onMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    const el = ref.current
    if (!el || reduced() || !fine()) return
    const rect = el.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    const distance = Math.hypot(dx, dy)
    const falloff = Math.max(0, 1 - distance / (radius + rect.width / 2))
    el.style.transform = `translate3d(${dx * strength * falloff}px, ${dy * strength * falloff}px, 0)`
  }

  const reset = () => {
    const el = ref.current
    if (el) el.style.transform = 'translate3d(0, 0, 0)'
  }

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`inline-block transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none ${className}`}
      style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
    >
      {children}
    </span>
  )
}

export default Magnetic
