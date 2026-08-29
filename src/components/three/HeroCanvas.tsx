'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

/**
 * Capability detection, poster fallback and the lazy boundary for the hero.
 *
 * The poster is always in the DOM underneath the canvas, so first paint never
 * waits on the 3D bundle. `PortraitScene` — and with it `three` and
 * `@react-three/fiber` — is only ever imported when the scene actually renders:
 * `next/dynamic` invokes its loader on first render, and we never render it
 * unless the feature flag is on and WebGL is genuinely available.
 *
 * Scroll drives the particle cloud through two states: it assembles into the
 * portrait shortly after load, then disperses back into a shell as the hero
 * scrolls away. That progress value is passed down through a ref rather than
 * state, so scrolling never triggers a React re-render — the value is read
 * inside the animation frame instead.
 */
const PortraitScene = dynamic(() => import('./PortraitScene'), {
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

export default function HeroCanvas({
  enabled = true,
  image = '/uploads/profile.jpg',
}: {
  enabled?: boolean
  image?: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
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
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0,
    })
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  /*
   * Assemble on entry, disperse on exit.
   *
   * Reduced motion skips the choreography entirely and pins the portrait
   * assembled — the point of the effect is the image, not the movement, so the
   * accessible version keeps the payoff and drops the animation.
   */
  useEffect(() => {
    if (reduced) {
      progressRef.current = 1
      return
    }

    const assembleAt = window.setTimeout(() => {
      progressRef.current = 1
    }, 250)

    const onScroll = () => {
      const host = hostRef.current
      if (!host) return
      const height = host.offsetHeight || 1
      // 0 at the top of the hero, 1 once it has scrolled fully out of view.
      const scrolled = Math.min(1, Math.max(0, window.scrollY / height))
      progressRef.current = 1 - scrolled * 0.9
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(assembleAt)
      window.removeEventListener('scroll', onScroll)
    }
  }, [reduced])

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
        <div className="absolute inset-0 transition-opacity duration-700">
          <PortraitScene
            image={image}
            active={active}
            reduced={reduced}
            progressRef={progressRef}
          />
        </div>
      ) : null}
    </div>
  )
}
