'use client'

import { useEffect, useState } from 'react'

export type Mode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'

/**
 * Resolves a mode to the attribute the stylesheet switches on.
 *
 * Exported because the inline boot script in `layout.tsx` has to make the same
 * decision before React exists — if the two ever disagree, the page paints one
 * theme and then swaps to the other.
 */
export function resolveTheme(mode: Mode): 'light' | 'dark' {
  if (mode !== 'system') return mode
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function apply(mode: Mode) {
  document.documentElement.dataset.theme = resolveTheme(mode)
}

/**
 * Light / dark / system switch.
 *
 * Three states rather than two on purpose: a binary toggle silently overrides
 * the reader's operating-system preference the first time they touch it, and
 * gives them no way back. "System" is the default and stays reachable.
 *
 * The choice persists in `localStorage`, read back by the boot script in
 * `layout.tsx` before first paint so the correct theme is painted once rather
 * than corrected afterwards.
 */
export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') setMode(stored)
  }, [])

  // Follow the OS while the reader is on "system" — including if they change it
  // in another window while this page is open.
  useEffect(() => {
    if (!mounted || mode !== 'system' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => apply('system')
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [mode, mounted])

  const choose = (next: Mode) => {
    setMode(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    apply(next)
  }

  const OPTIONS: { value: Mode; label: string; glyph: string }[] = [
    { value: 'light', label: 'Light', glyph: '☀' },
    { value: 'dark', label: 'Dark', glyph: '☾' },
    { value: 'system', label: 'System', glyph: '◐' },
  ]

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="inline-flex items-center gap-0.5 rounded-lg border border-[var(--hairline)] p-0.5"
    >
      {OPTIONS.map((option) => {
        // Before mount the stored preference is unknown, so nothing is marked
        // active — claiming one and correcting it is a visible flicker.
        const active = mounted && mode === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => choose(option.value)}
            aria-pressed={active}
            title={option.label}
            className={`rounded-md px-2 py-1 text-xs transition-colors duration-200 motion-reduce:transition-none ${
              active
                ? 'bg-[var(--accent-soft)] text-[var(--foreground)]'
                : 'text-[var(--subtle)] hover:text-[var(--foreground)]'
            }`}
          >
            <span aria-hidden="true">{option.glyph}</span>
            <span className="sr-only">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
