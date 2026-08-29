'use client'

import { useEffect, useRef, useState } from 'react'

const HIDE_NATIVE_CLASS = 'cursor-none'
const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, summary, [data-cursor]'

/**
 * Custom cursor: a dot pinned to the pointer plus a ring that lags behind it.
 *
 * `mix-blend-difference` is what makes one element legible over both the near
 * black background and an accent fill, without knowing anything about what it
 * happens to be over.
 *
 * Three separate reasons to render nothing, all of them load-bearing:
 *
 *  - **Coarse pointer.** On touch there is no pointer to follow, and the ring
 *    would sit wherever the last tap landed. More importantly, hiding the
 *    native cursor on a device that may also have a mouse attached (tablet with
 *    a trackpad) leaves the user with no cursor at all.
 *  - **`prefers-reduced-motion`.** The lag is the entire effect; without it
 *    there is nothing worth keeping, and a trailing element is exactly the kind
 *    of continuous motion the setting asks us to drop.
 *  - **Before the media queries are read.** The first render happens on the
 *    server, where neither question can be answered. Rendering nothing until
 *    the effect runs keeps the markup identical on both sides of hydration.
 *
 * `cursor: none` ships from here rather than from `globals.css` so it cannot
 * outlive the component: it is injected by the same effect that adds the class
 * it depends on, and removed by that effect's cleanup. Both live behind the
 * `enabled` guard, so on touch and reduced-motion the rule is never created at
 * all — the native cursor is safe structurally, not by a second guard that a
 * later edit could miss.
 */
export default function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const dotRef = useRef<HTMLDivElement | null>(null)
  const ringRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const fine = window.matchMedia('(pointer: fine)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    const sync = () => setEnabled(fine.matches && !reduced.matches)
    sync()

    // A mouse plugged into a tablet flips `(pointer: fine)` live.
    fine.addEventListener?.('change', sync)
    reduced.addEventListener?.('change', sync)

    return () => {
      fine.removeEventListener?.('change', sync)
      reduced.removeEventListener?.('change', sync)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const root = document.documentElement
    root.classList.add(HIDE_NATIVE_CLASS)

    // The rule is injected imperatively rather than rendered as JSX `<style>`:
    // React 19 hoists and deduplicates stylesheets rendered from a component
    // body, which can leave the rule in <head> after this component unmounts —
    // a page with no cursor at all. Creating and removing the node here ties
    // its lifetime to the effect, so it is provably reversible.
    const style = document.createElement('style')
    style.dataset.cursor = 'true'
    style.textContent = `html.${HIDE_NATIVE_CLASS}, html.${HIDE_NATIVE_CLASS} * { cursor: none !important; }`
    document.head.appendChild(style)

    const dot = dotRef.current
    const ring = ringRef.current

    // Start off-canvas: a cursor parked at 0,0 before the first mousemove reads
    // as a rendering bug in the top-left corner.
    let pointerX = -200
    let pointerY = -200
    let ringX = -200
    let ringY = -200
    let scale = 1
    let targetScale = 1
    let frame = 0

    const onMove = (event: MouseEvent) => {
      pointerX = event.clientX
      pointerY = event.clientY
    }

    // Delegation rather than a listener per node: the section list is rendered
    // from CMS content and grows, and per-node listeners would need a
    // MutationObserver to keep up plus an unbounded teardown loop to remove.
    // One listener on the document covers everything, forever, and unbinds in
    // one call.
    const onOver = (event: MouseEvent) => {
      const found = (event.target as Element | null)?.closest?.(INTERACTIVE) ?? null
      if (found) targetScale = 2.2
    }

    const onOut = (event: MouseEvent) => {
      const leaving = (event.target as Element | null)?.closest?.(INTERACTIVE) ?? null
      if (!leaving) return

      // `mouseout` also fires when the pointer crosses from a child into its own
      // parent — moving from the <span> inside a link onto the link itself. Both
      // resolve to the same anchor, so shrinking here would make the ring
      // flicker in the middle of a hover. Only shrink once the pointer has
      // genuinely left for something that isn't interactive.
      const entering =
        (event.relatedTarget as Element | null)?.closest?.(INTERACTIVE) ?? null
      if (entering === leaving) return

      targetScale = entering ? 2.2 : 1
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver, { passive: true })
    document.addEventListener('mouseout', onOut, { passive: true })

    const tick = () => {
      frame = requestAnimationFrame(tick)
      // The dot tracks exactly and the ring eases toward it; the gap between
      // the two is the whole character of the cursor.
      ringX += (pointerX - ringX) * 0.14
      ringY += (pointerY - ringY) * 0.14
      scale += (targetScale - scale) * 0.12

      if (dot) dot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`
      if (ring) {
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`
      }
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      root.classList.remove(HIDE_NATIVE_CLASS)
      style.remove()
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <div
        ref={ringRef}
        data-testid="cursor-ring"
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[70] h-9 w-9 rounded-full border border-white mix-blend-difference will-change-transform"
        style={{ transform: 'translate3d(-200px, -200px, 0)' }}
      />
      <div
        ref={dotRef}
        data-testid="cursor-dot"
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[70] h-1.5 w-1.5 rounded-full bg-white mix-blend-difference will-change-transform"
        style={{ transform: 'translate3d(-200px, -200px, 0)' }}
      />
    </>
  )
}
