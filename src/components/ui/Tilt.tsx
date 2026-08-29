'use client'

import { useRef, type ReactNode } from 'react'

/**
 * Tilts its child in 3D toward the cursor, with a light sheen that tracks the
 * pointer.
 *
 * Perspective lives on a wrapper rather than the tilting element itself: applied
 * to the same node, `perspective` and `transform` compose in the wrong order and
 * the rotation reads as a flat skew instead of depth.
 */
export function Tilt({
  children,
  max = 7,
  className = '',
}: {
  children: ReactNode
  max?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  const enabled = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || !enabled()) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    el.style.transform = `rotateX(${(0.5 - py) * max * 2}deg) rotateY(${(px - 0.5) * max * 2}deg) translateZ(0)`
    el.style.setProperty('--sheen-x', `${px * 100}%`)
    el.style.setProperty('--sheen-y', `${py * 100}%`)
  }

  const reset = () => {
    const el = ref.current
    if (el) el.style.transform = 'rotateX(0deg) rotateY(0deg)'
  }

  return (
    <div style={{ perspective: '1100px' }} className={className}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={reset}
        className="relative transition-transform duration-500 ease-out will-change-transform motion-reduce:transition-none"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
          style={{
            background:
              'radial-gradient(24rem 18rem at var(--sheen-x, 50%) var(--sheen-y, 50%), color-mix(in oklab, var(--accent) 14%, transparent), transparent 70%)',
          }}
        />
      </div>
    </div>
  )
}

export default Tilt
