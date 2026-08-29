'use client'

import { useEffect, useState } from 'react'

export type Mode = 'light' | 'dark'
export type Fallback = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'

/**
 * Reads and writes the stored preference defensively.
 *
 * `localStorage` is not always there: Safari in private mode can throw on
 * access, and a partially-stubbed `window` in a test environment leaves it
 * undefined. Neither should take the header down over a colour preference.
 */
function readStored(): string | null {
  try {
    return window.localStorage?.getItem(STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

function writeStored(value: string) {
  try {
    window.localStorage?.setItem(STORAGE_KEY, value)
  } catch {
    // A preference that cannot be persisted still applies for this visit.
  }
}

/**
 * Resolves the theme to paint.
 *
 * Exported because the inline boot script in `layout.tsx` makes the same
 * decision before React exists — if the two disagree, the page paints one theme
 * and visibly swaps to the other.
 */
export function resolveTheme(stored: string | null, fallback: Fallback = 'system'): Mode {
  // A stored choice always wins — the reader has spoken.
  if (stored === 'light' || stored === 'dark') return stored
  // Otherwise the CMS decides: an explicit dark/light default overrides the
  // operating system, and 'system' defers to it.
  if (fallback === 'light' || fallback === 'dark') return fallback
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/**
 * Light / dark switch.
 *
 * Two states, not three. An explicit "system" option is more correct — it keeps
 * the operating-system preference reachable after the reader has overridden it
 * — but it is a third control for a benefit almost nobody reaches for, and the
 * default already follows the system until the reader chooses otherwise.
 *
 * Until first use, no preference is stored and the OS decides. After it, the
 * choice sticks; clearing site data returns to following the system.
 */
export default function ThemeToggle({
  className = '',
  defaultMode = 'system',
}: {
  className?: string
  /** From the CMS. 'system' follows the OS; 'light'/'dark' override it. */
  defaultMode?: Fallback
}) {
  const [mode, setMode] = useState<Mode>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setMode(resolveTheme(readStored(), defaultMode))
  }, [defaultMode])

  // Keep following the OS while the reader has not chosen, including if they
  // change it in another window with this page open.
  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    // Only track the OS when nothing overrides it — neither a stored choice
    // nor an explicit CMS default.
    if (readStored() || defaultMode !== 'system') return
    const query = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => {
      const next: Mode = query.matches ? 'light' : 'dark'
      setMode(next)
      document.documentElement.dataset.theme = next
    }
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [mounted, defaultMode])

  const toggle = () => {
    const next: Mode = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    writeStored(next)
    document.documentElement.dataset.theme = next
  }

  // Before mount the stored preference is unknown. Rendering a definite icon
  // and correcting it after hydration is a visible flicker, so the button is
  // present but unlabelled until the answer is known.
  const target = mode === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted ? `Switch to ${target} theme` : 'Switch theme'}
      title={mounted ? `Switch to ${target} theme` : 'Switch theme'}
      className={`inline-flex size-8 items-center justify-center rounded-lg border border-[var(--hairline)] text-[var(--subtle)] transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--foreground)] motion-reduce:transition-none ${className}`}
    >
      <span aria-hidden="true" className="text-[13px] leading-none">
        {mounted ? (mode === 'dark' ? '☀' : '☾') : '◐'}
      </span>
    </button>
  )
}
