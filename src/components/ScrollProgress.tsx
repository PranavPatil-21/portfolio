'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * A hairline read-position indicator pinned to the top of the viewport.
 *
 * Two deliberate choices:
 *
 * 1. Scroll events fire far faster than frames. Measuring on every event means
 *    a layout read per event and a janky bar; instead each burst of events sets
 *    a dirty flag and one `requestAnimationFrame` callback does the single
 *    read-and-write. The frame is only requested when none is pending.
 * 2. Under `prefers-reduced-motion` the element is not rendered at all, rather
 *    than rendered-but-static. A bar that tracks scroll *is* the motion; there
 *    is no reduced version of it worth showing.
 *
 * Renders nothing on the server, so there is no hydration mismatch between the
 * unknown media state at build time and the real one in the browser.
 */
export function ScrollProgress() {
  const [enabled, setEnabled] = useState(false)
  const barRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!reduced) setEnabled(true)
  }, [])

  useEffect(() => {
    if (!enabled) return

    let frame: number | null = null

    const measure = () => {
      frame = null
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
      if (barRef.current) barRef.current.style.transform = `scaleX(${ratio})`
    }

    const onScroll = () => {
      // Coalesce: a pending frame already owns the next measurement.
      if (frame !== null) return
      frame = window.requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      data-testid="scroll-progress"
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px]"
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-[var(--accent)]"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}

export default ScrollProgress
