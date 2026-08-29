'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

/**
 * The site-wide interactive backdrop.
 *
 * Fixed to the viewport and mounted once for the whole page, so the field is
 * continuous from the first screen to the last. An interactive hero followed by
 * a static page reads as a trick that ran out; this keeps the surface alive
 * wherever the reader happens to be.
 *
 * It is decorative and carries no information, so it is `aria-hidden` and
 * `pointer-events: none`. Everything above it stays clickable and selectable.
 */
const FieldScene = dynamic(() => import('./three/FieldScene'), {
  ssr: false,
  loading: () => null,
})

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

export default function Backdrop({ enabled = true }: { enabled?: boolean }) {
  const [supported, setSupported] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    if (enabled) setSupported(detectWebgl())
  }, [enabled])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const onChange = () => setReduced(query.matches)
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [])

  // Stop drawing entirely while the tab is in the background. A fullscreen
  // shader left running behind a hidden tab is a real battery cost.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const onVisibility = () => setTabVisible(!document.hidden)
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const show = enabled && supported

  return (
    <div
      aria-hidden="true"
      data-testid="backdrop"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/*
        A static gradient underneath, always painted. It holds the composition
        before the shader compiles, and it is the entire visual for anyone
        without WebGL or with reduced motion set.
      */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(70rem 50rem at 72% 28%, color-mix(in oklab, var(--accent) 26%, transparent), transparent 62%),' +
            'radial-gradient(50rem 40rem at 12% 78%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 60%),' +
            'var(--background)',
        }}
      />
      {show ? (
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: reduced ? 0.5 : 1 }}
        >
          <FieldScene active={tabVisible} reduced={reduced} />
        </div>
      ) : null}
    </div>
  )
}
