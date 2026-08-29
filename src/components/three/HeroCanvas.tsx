'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

/**
 * Capability detection, poster fallback and the lazy boundary for the 3D hero.
 *
 * The poster is always in the DOM underneath the canvas, so first paint never
 * waits on the 3D bundle. `HeroScene` — and with it `three`, `@react-three/fiber`
 * and `@react-three/drei` — is only ever imported when the scene actually
 * renders: `next/dynamic` invokes its loader on first render, and we never
 * render it unless the feature flag is on and WebGL is genuinely available.
 *
 * Deviation from the plan: the poster is not passed as `dynamic`'s `loading`
 * element, because it is already rendered underneath — using both would paint
 * it twice.
 */
const HeroScene = dynamic(() => import('./HeroScene'), {
  ssr: false,
  loading: () => null,
})

/** jsdom and locked-down browsers both land here; a throw is a failure too. */
function detectWebgl(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl'),
    )
  } catch {
    return false
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function HeroCanvas({ enabled = true }: { enabled?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [supported, setSupported] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [onScreen, setOnScreen] = useState(true)
  const [tabVisible, setTabVisible] = useState(true)

  // Detection is deliberately post-mount: the server renders the poster only.
  useEffect(() => {
    if (!enabled) return
    setSupported(detectWebgl())
  }, [enabled])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const onChange = () => setReduced(query.matches)
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [])

  // Stop drawing while the tab is in the background.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const onVisibility = () => setTabVisible(!document.hidden)
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Stop drawing once the hero has scrolled away.
  useEffect(() => {
    const host = hostRef.current
    if (!host || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  const showScene = enabled && supported
  const active = showScene && !reduced && onScreen && tabVisible

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-testid="hero-poster"
        src="/hero-poster.svg"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover opacity-90"
      />
      {showScene ? (
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: reduced ? 0.85 : 1 }}
        >
          <HeroScene active={active} reduced={reduced} />
        </div>
      ) : null}
    </div>
  )
}
